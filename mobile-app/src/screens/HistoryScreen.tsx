import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';

export default function HistoryScreen({ navigation }: any) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const res = await api.get('/parking/tickets?limit=50');
      setTickets(res.data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isActive = item.status === 'ACTIVE';
    const date = new Date(item.check_in_time);
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
              <View style={[styles.iconBox, { backgroundColor: isActive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name={item.vehicle_type === 'BIKE' ? 'bicycle' : 'car'} size={20} color={isActive ? '#34D399' : '#10B981'} />
              </View>
              <View>
                <Text style={styles.plateText}>{item.license_plate || 'GUEST'}</Text>
                <Text style={styles.ticketNumText}>{item.ticket_number}</Text>
              </View>
            </View>
            <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgePaid]}>
              <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextPaid]}>{item.status}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.cardFooter}>
            <View style={styles.footerCol}>
              <Feather name="log-in" size={14} color="#9DAFA8" />
              <Text style={styles.footerText}>{formattedTime} • {formattedDate}</Text>
            </View>
            {!isActive && item.fare_amount !== undefined && (
              <View style={styles.footerCol}>
                <Feather name="dollar-sign" size={14} color="#10B981" />
                <Text style={[styles.footerText, { color: '#10B981', fontWeight: '700' }]}>
                  Rs. {item.fare_amount.toFixed(2)}
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
  const totalFare = tickets.reduce((sum, t) => sum + (t.fare_amount || 0), 0);

  return (
    <LinearGradient colors={['#0B0F0E', '#0F1412']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recent History</Text>
        </View>

        {!loading && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{tickets.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#34D399' }]}>{activeCount}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>{exitCount}</Text>
              <Text style={styles.summaryLabel}>Exited</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#F2C879', fontSize: 16, marginTop: 4 }]}>
                Rs.{totalFare}
              </Text>
              <Text style={styles.summaryLabel}>Revenue</Text>
            </View>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#34D399" />
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34D399" />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={64} color="rgba(244,246,244,0.1)" />
                <Text style={styles.emptyText}>No tickets found</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#F4F6F4', fontSize: 18, fontWeight: '700' },
  listContent: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#9DAFA8', marginTop: 16, fontSize: 16, fontWeight: '500' },
  
  cardWrapper: { marginBottom: 16, shadowColor: 'rgba(52,211,153,0.2)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  card: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  cardActive: { borderColor: 'rgba(52, 211, 153, 0.25)', backgroundColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  plateText: { color: '#F4F6F4', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  ticketNumText: { color: '#9DAFA8', fontSize: 12, fontWeight: '600', marginTop: 2, fontFamily: 'monospace' },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeActive: { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.25)' },
  badgePaid: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextActive: { color: '#34D399' },
  badgeTextPaid: { color: '#10B981' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { color: '#9DAFA8', fontSize: 13, fontWeight: '600' },
  
  summaryContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 20, borderRadius: 16, padding: 16, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  summaryCard: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#F4F6F4' },
  summaryLabel: { fontSize: 11, color: '#9DAFA8', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },
  summaryDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.12)' },
});
