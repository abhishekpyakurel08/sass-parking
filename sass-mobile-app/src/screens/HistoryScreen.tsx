import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Clock, RefreshCcw, Filter, ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { parkingService } from '../services/parking.service';
import type { Ticket } from '../types/api.types';

type FilterStatus = 'ALL' | 'ACTIVE' | 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED';

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All',     value: 'ALL' },
  { label: 'Active',  value: 'ACTIVE' },
  { label: 'Pending', value: 'PENDING_PAYMENT' },
  { label: 'Paid',    value: 'PAID' },
  { label: 'Expired', value: 'EXPIRED' },
];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:          colors.success,
  PENDING_PAYMENT: '#FDBA74',
  PAID:            colors.textSecondary,
  EXPIRED:         colors.danger,
  LOST:            colors.danger,
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

const fmtDuration = (checkIn: string, checkOut?: string) => {
  const end = checkOut ? new Date(checkOut) : new Date();
  const ms  = end.getTime() - new Date(checkIn).getTime();
  const h   = Math.floor(ms / 3_600_000);
  const m   = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const TicketRow = ({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) => {
  const statusColor = STATUS_COLOR[ticket.status] ?? colors.textSecondary;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: statusColor }]} />

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <View style={styles.platePill}>
            <Text style={styles.plateText}>{ticket.license_plate}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{ticket.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.rowMid}>
          <Text style={styles.vehicleType}>{ticket.vehicle_type}</Text>
          {ticket.customer_id && (
            <Text style={styles.customerTag}>👤 {(ticket.customer_id as any).name}</Text>
          )}
        </View>

        <View style={styles.rowBottom}>
          <Text style={styles.timeText}>{fmtTime(ticket.check_in_time)}</Text>
          <Text style={styles.durationText}>{fmtDuration(ticket.check_in_time, ticket.check_out_time)}</Text>
          {ticket.fare_amount > 0 && (
            <Text style={styles.fareText}>Rs. {ticket.fare_amount.toFixed(0)}</Text>
          )}
        </View>
      </View>

      <ChevronRight color={colors.border} size={18} />
    </TouchableOpacity>
  );
};

const HistoryScreen = () => {
  const navigation = useNavigation();
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter]       = useState<FilterStatus>('ALL');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (pg = 1, status: FilterStatus = filter, replace = true) => {
    try {
      const params: Record<string, any> = { page: pg, limit: 15 };
      if (status !== 'ALL') params.status = status;
      const res = await parkingService.getTickets(params);
      setTickets(prev => replace ? res.data : [...prev, ...res.data]);
      setTotalPages(res.pagination.totalPages);
      setPage(pg);
    } catch {
      // silent
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load(1, filter, true).finally(() => setLoading(false));
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1, filter, true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await load(page + 1, filter, false);
    setLoadingMore(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <RefreshCcw color={colors.primary} size={18} />
          <Text style={styles.logoText}>PARKSAAS</Text>
        </View>
        <Text style={styles.headerTitle}>History</Text>
        <Filter color={colors.textSecondary} size={20} />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t._id}
          renderItem={({ item }) => (
            <TicketRow
              ticket={item}
              onPress={() => (navigation as any).navigate('TicketDetail', { ticket: item })}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Clock color={colors.border} size={48} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>No tickets found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText:     { color: colors.primary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  headerTitle:  { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  filterRow:    { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipActive:   { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:     { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  list:         { padding: 16, paddingBottom: 40 },
  separator:    { height: 10 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  accent:       { width: 4, alignSelf: 'stretch' },
  rowBody:      { flex: 1, padding: 14, gap: 6 },
  rowTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  platePill:    { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  plateText:    { color: colors.text, fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
  statusPill:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText:   { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  rowMid:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vehicleType:  { color: colors.textSecondary, fontSize: 12 },
  customerTag:  { color: colors.primary, fontSize: 11 },
  rowBottom:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeText:     { color: colors.textSecondary, fontSize: 11, flex: 1 },
  durationText: { color: colors.textSecondary, fontSize: 11 },
  fareText:     { color: colors.success, fontSize: 12, fontWeight: 'bold' },
});

export default HistoryScreen;
