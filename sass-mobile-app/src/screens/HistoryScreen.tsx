import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { Clock, Filter, ChevronRight, CalendarDays, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { sw, sf } from '../theme/responsive';
import { useNavigation } from '@react-navigation/native';
import { operatorService } from '../services/parking.service';
import type { Ticket } from '../types/api.types';

type FilterStatus = 'ALL' | 'ACTIVE' | 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED';
type FilterDate   = 'ALL_TIME' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All',     value: 'ALL' },
  { label: 'Active',  value: 'ACTIVE' },
  { label: 'Pending', value: 'PENDING_PAYMENT' },
  { label: 'Paid',    value: 'PAID' },
  { label: 'Expired', value: 'EXPIRED' },
];

const DATE_FILTERS: { label: string; value: FilterDate }[] = [
  { label: 'All Time',    value: 'ALL_TIME' },
  { label: 'Today',       value: 'TODAY' },
  { label: 'This Week',   value: 'THIS_WEEK' },
  { label: 'This Month',  value: 'THIS_MONTH' },
];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:          colors.success,
  PENDING_PAYMENT: colors.warning,
  PAID:            colors.textSecondary,
  EXPIRED:         colors.danger,
  LOST:            colors.danger,
};

const STATUS_BG: Record<string, string> = {
  ACTIVE:          colors.successBg,
  PENDING_PAYMENT: colors.warningBg,
  PAID:            colors.inputBg,
  EXPIRED:         colors.dangerBg,
  LOST:            colors.dangerBg,
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

/** Returns ISO date range for a given date filter */
const getDateRange = (dateFilter: FilterDate): { from?: string; to?: string } => {
  const now = new Date();
  if (dateFilter === 'TODAY') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  if (dateFilter === 'THIS_WEEK') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  if (dateFilter === 'THIS_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  return {};
};

// ── Ticket Row ────────────────────────────────────────────────────────────────
const TicketRow = ({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) => {
  const statusColor = STATUS_COLOR[ticket.status] ?? colors.textSecondary;
  const statusBg    = STATUS_BG[ticket.status]    ?? colors.inputBg;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.accent, { backgroundColor: statusColor }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <View style={styles.platePill}>
            <Text style={styles.plateText}>{ticket.license_plate}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {ticket.status === 'PENDING_PAYMENT' ? 'PENDING' : ticket.status}
            </Text>
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
      <ChevronRight color={colors.border} size={18} style={{ marginRight: 12 }} />
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const HistoryScreen = () => {
  const navigation = useNavigation();
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter]           = useState<FilterStatus>('ALL');
  const [dateFilter, setDateFilter]   = useState<FilterDate>('TODAY');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  const load = useCallback(async (
    pg = 1,
    status: FilterStatus = filter,
    date: FilterDate = dateFilter,
    replace = true,
  ) => {
    try {
      const params: Record<string, any> = { page: pg, limit: 15 };
      if (status !== 'ALL') params.status = status;
      const { from, to } = getDateRange(date);
      if (from) params.from = from;
      if (to)   params.to   = to;
      const res = await operatorService.getTickets(params);
      setTickets(prev => replace ? res.data : [...prev, ...res.data]);
      setTotalPages(res.pagination.totalPages);
      setPage(pg);
    } catch {
      // silent
    }
  }, [filter, dateFilter]);

  useEffect(() => {
    setLoading(true);
    load(1, filter, dateFilter, true).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, dateFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1, filter, dateFilter, true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await load(page + 1, filter, dateFilter, false);
    setLoadingMore(false);
  };

  const hasActiveFilters = filter !== 'ALL' || dateFilter !== 'ALL_TIME';

  const resetFilters = () => {
    setFilter('ALL');
    setDateFilter('ALL_TIME');
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSub}>All parking transactions</Text>
        </View>
        <View style={styles.headerRight}>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <X color={colors.danger} size={14} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          )}
          <Filter color={hasActiveFilters ? colors.primary : colors.textSecondary} size={20} />
        </View>
      </View>

      {/* ── Status Filter chips ─────────────────────────────────────────── */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map(f => (
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
        </ScrollView>
      </View>

      {/* ── Date Filter chips ───────────────────────────────────────────── */}
      <View style={[styles.filterSection, styles.filterSectionDate]}>
        <View style={styles.dateLabelRow}>
          <CalendarDays color={colors.textSecondary} size={13} />
          <Text style={styles.filterLabel}>Date Range</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {DATE_FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.chip, styles.chipDate, dateFilter === f.value && styles.chipDateActive]}
              onPress={() => setDateFilter(f.value)}
            >
              <Text style={[styles.chipText, dateFilter === f.value && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Results count ───────────────────────────────────────────────── */}
      {!loading && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {tickets.length} result{tickets.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ── List ────────────────────────────────────────────────────────── */}
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
              <Text style={styles.emptyText}>No tickets found</Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={resetFilters} style={styles.emptyResetBtn}>
                  <Text style={styles.emptyResetText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: sw(20), paddingVertical: sw(16), backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:     { color: colors.text, fontSize: sf(20), fontWeight: '700', letterSpacing: -0.3 },
  headerSub:       { color: colors.textSecondary, fontSize: sf(12), marginTop: 2 },
  headerRight:     { flexDirection: 'row', alignItems: 'center', gap: sw(8) },
  resetBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.dangerBg, paddingHorizontal: sw(10), paddingVertical: sw(5), borderRadius: sw(12) },
  resetText:       { color: colors.danger, fontSize: sf(11), fontWeight: '600' },

  // Filters
  filterSection:   { backgroundColor: colors.card, paddingVertical: sw(10), borderBottomWidth: 1, borderBottomColor: colors.border },
  filterSectionDate:{ borderBottomWidth: 1, borderBottomColor: colors.border },
  filterLabel:     { color: colors.textSecondary, fontSize: sf(10), fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: sw(16), marginBottom: sw(6) },
  dateLabelRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: sw(16), marginBottom: sw(6) },
  filterRow:       { paddingHorizontal: sw(16), gap: sw(8) },
  chip:            { paddingHorizontal: sw(14), paddingVertical: sw(7), borderRadius: sw(20), backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border },
  chipActive:      { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDate:        { borderColor: colors.border },
  chipDateActive:  { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:        { color: colors.textSecondary, fontSize: sf(12), fontWeight: '600' },
  chipTextActive:  { color: '#FFF', fontWeight: '700' },

  // Results bar
  resultsBar:      { paddingHorizontal: sw(16), paddingVertical: sw(8), backgroundColor: colors.background },
  resultsText:     { color: colors.textSecondary, fontSize: sf(12), fontWeight: '500' },

  // List
  list:            { padding: sw(16), paddingBottom: 40 },
  separator:       { height: sw(10) },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:       { color: colors.textSecondary, marginTop: 12, fontSize: sf(14) },
  emptyResetBtn:   { marginTop: 16, paddingHorizontal: sw(20), paddingVertical: sw(10), backgroundColor: colors.accent, borderRadius: sw(20) },
  emptyResetText:  { color: colors.primary, fontSize: sf(13), fontWeight: '600' },

  // Row card
  row:             { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: sw(14), overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  accent:          { width: 4, alignSelf: 'stretch' },
  rowBody:         { flex: 1, padding: sw(14), gap: sw(6) },
  rowTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  platePill:       { backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: sw(8), paddingVertical: 4 },
  plateText:       { color: colors.primary, fontFamily: 'monospace', fontSize: sf(12), fontWeight: '800', letterSpacing: 1.5 },
  statusPill:      { paddingHorizontal: sw(8), paddingVertical: 4, borderRadius: 8 },
  statusText:      { fontSize: sf(10), fontWeight: '700' },
  rowMid:          { flexDirection: 'row', alignItems: 'center', gap: sw(8) },
  vehicleType:     { color: colors.textSecondary, fontSize: sf(12), fontWeight: '600' },
  customerTag:     { color: colors.primary, fontSize: sf(11), fontWeight: '600' },
  rowBottom:       { flexDirection: 'row', alignItems: 'center', gap: sw(10) },
  timeText:        { color: colors.textSecondary, fontSize: sf(11), flex: 1 },
  durationText:    { color: colors.textSecondary, fontSize: sf(11), fontWeight: '700' },
  fareText:        { color: colors.success, fontSize: sf(13), fontWeight: '800' },
});

export default HistoryScreen;
