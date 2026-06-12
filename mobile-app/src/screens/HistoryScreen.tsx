import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { api } from '../lib/api';
import { Colors } from '../lib/colors';

export default function HistoryScreen({ navigation }: any) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAID'>('ALL');

  const loadHistory = async () => {
    try {
      const res = await api.get('/parking/tickets?limit=100');
      const ticketData = res?.data?.data || res?.data || [];
      setTickets(ticketData);
      setFilteredTickets(ticketData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await api.get('/operator/config');
      setConfig(res.data.config);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory();
    loadConfig();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = tickets;
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    setFilteredTickets(filtered);
  }, [statusFilter, tickets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isActive = item.status === 'ACTIVE';
    const date = new Date(item.check_in_time || item.checkInTime);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = date.toLocaleDateString();

    return (
      <TouchableOpacity 
        style={styles.cardWrapper} 
        onPress={() => navigation.navigate('TicketDetail', { ticketId: item._id })}
      >
        <BlurView intensity={20} tint="dark" style={[styles.card, isActive ? styles.cardActive : null]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View>
                <Text style={styles.plateText}>{item.license_plate || item.vehiclePlateNumber || 'GUEST'}</Text>
                <Text style={styles.ticketNumText}>{item.ticket_number || '—'}</Text>
              </View>
            </View>
            <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgePaid]}>
              <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextPaid]}>{item.status || 'UNKNOWN'}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.cardFooter}>
            <View style={styles.footerCol}>
              <Feather name="log-in" size={14} color={Colors.dark.textSecondary} />
              <Text style={styles.footerText}>{formattedTime} • {formattedDate}</Text>
            </View>
            {!isActive && (item.fare_amount !== undefined || item.fareAmount !== undefined) && (
              <View style={styles.footerCol}>
                <Feather name="dollar-sign" size={14} color={Colors.success} />
                <Text style={[styles.footerText, { color: Colors.success, fontWeight: '700' }]}>
                  Rs. {((item.fare_amount || item.fareAmount || 0)).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const activeCount = tickets.filter(t => t.status === 'ACTIVE').length;
  const exitCount = tickets.filter(t => t.status !== 'ACTIVE').length;
  const totalFare = tickets.reduce((sum, t) => sum + (t.fare_amount || t.fareAmount || 0), 0);

  return (
    <LinearGradient colors={[Colors.dark.background, '#1a1a2e', Colors.dark.background]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Recent History</Text>
            <Text style={styles.headerSubtitle}>Operator: {config?.operator?.name || 'Loading...'}</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {(['ALL', 'ACTIVE', 'PAID'] as const).map(status => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {!loading && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{filteredTickets.length}</Text>
              <Text style={styles.summaryLabel}>Showing</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{tickets.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: Colors.primary }]}>{activeCount}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>{exitCount}</Text>
              <Text style={styles.summaryLabel}>Exited</Text>
            </View>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredTickets}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="inbox" size={64} color={`${Colors.dark.textSecondary}40`} />
                <Text style={styles.emptyText}>No tickets found</Text>
                {statusFilter !== 'ALL' && (
                  <TouchableOpacity onPress={() => setStatusFilter('ALL')} style={styles.clearEmptyBtn}>
                    <Text style={styles.clearEmptyText}>Clear Filter</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 4 },
  filterContainer: { paddingHorizontal: 20, paddingBottom: 16 },
  filterScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.dark.elevated, borderWidth: 1, borderColor: Colors.dark.border, marginRight: 8 },
  filterChipActive: { backgroundColor: `${Colors.primary}26`, borderColor: Colors.primary },
  filterChipText: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: Colors.primary },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: Colors.dark.textSecondary, marginTop: 16, fontSize: 16, fontWeight: '500' },
  clearEmptyBtn: { marginTop: 16, padding: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: `${Colors.primary}1F` },
  clearEmptyText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  
  cardWrapper: { marginBottom: 16, marginHorizontal: 20, shadowColor: `${Colors.primary}33`, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  card: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  cardActive: { borderColor: `${Colors.primary}40`, backgroundColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  plateText: { color: Colors.dark.text, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  ticketNumText: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2, fontFamily: 'monospace' },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeActive: { backgroundColor: `${Colors.primary}1F`, borderColor: `${Colors.primary}40` },
  badgePaid: { backgroundColor: `${Colors.success}1F`, borderColor: `${Colors.success}40` },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextActive: { color: Colors.primary },
  badgeTextPaid: { color: Colors.success },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '600' },
  
  summaryContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 20, borderRadius: 16, padding: 16, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  summaryCard: { alignItems: 'center', flex: 1, minWidth: 60 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.dark.text },
  summaryLabel: { fontSize: 11, color: Colors.dark.textSecondary, marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },
  summaryDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.12)' },
});
