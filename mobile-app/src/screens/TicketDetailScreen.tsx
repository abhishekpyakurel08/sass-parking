import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';

export default function TicketDetailScreen({ route, navigation }: any) {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicketDetails();
  }, [ticketId]);

  const loadTicketDetails = async () => {
    try {
      const res = await api.get(`/parking/${ticketId}/receipt`);
      setTicket(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0B0F0E', '#0F1412']} style={styles.container}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#34D399" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const isActive = ticket?.status === 'ACTIVE' || ticket?.status === 'PENDING_PAYMENT';
  const date = new Date(ticket?.check_in_time);
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = date.toLocaleDateString();

  return (
    <LinearGradient colors={['#0B0F0E', '#0F1412']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={24} color="#F4F6F4" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: isActive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name={ticket?.vehicle_type === 'BIKE' ? 'bicycle' : 'car'} size={32} color={isActive ? '#34D399' : '#10B981'} />
              </View>
              <View>
                <Text style={styles.plateText}>{ticket?.license_plate || 'GUEST'}</Text>
                <Text style={styles.ticketNumText}>{ticket?.ticket_number}</Text>
              </View>
              <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgePaid]}>
                <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextPaid]}>{ticket?.status}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle Type</Text>
                <Text style={styles.detailValue}>{ticket?.vehicle_type}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Entry Time</Text>
                <Text style={styles.detailValue}>{formattedTime} • {formattedDate}</Text>
              </View>
              {ticket?.check_out_time && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Exit Time</Text>
                  <Text style={styles.detailValue}>{new Date(ticket.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              )}
              {ticket?.customer_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer</Text>
                  <Text style={styles.detailValue}>{ticket.customer_name}</Text>
                </View>
              )}
            </View>

            {ticket?.fare_amount !== undefined && (
              <>
                <View style={styles.divider} />
                <View style={styles.feeSection}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Fare Amount</Text>
                    <Text style={styles.feeValue}>Rs. {ticket.fare_amount.toFixed(2)}</Text>
                  </View>
                  {ticket.discount_amount > 0 && (
                    <View style={styles.feeRow}>
                      <Text style={styles.feeLabel}>Discount</Text>
                      <Text style={[styles.feeValue, { color: '#10b981' }]}>- Rs. {ticket.discount_amount.toFixed(2)}</Text>
                    </View>
                  )}
                  {ticket.penalty_amount > 0 && (
                    <View style={styles.feeRow}>
                      <Text style={styles.feeLabel}>Penalty</Text>
                      <Text style={[styles.feeValue, { color: '#ef4444' }]}>+ Rs. {ticket.penalty_amount.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={[styles.divider, { marginVertical: 12 }]} />
                  <View style={styles.feeRow}>
                    <Text style={[styles.feeLabel, { fontSize: 16, fontWeight: '800' }]}>Total</Text>
                    <Text style={[styles.feeValue, { fontSize: 20, fontWeight: '900', color: '#10b981' }]}>
                      Rs. {((ticket.fare_amount || 0) + (ticket.penalty_amount || 0) - (ticket.discount_amount || 0)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {ticket?.payment_method && (
              <>
                <View style={styles.divider} />
                <View style={styles.paymentSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method</Text>
                    <Text style={styles.detailValue}>{ticket.payment_method}</Text>
                  </View>
                  {ticket.amount_received && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount Received</Text>
                      <Text style={styles.detailValue}>Rs. {ticket.amount_received.toFixed(2)}</Text>
                    </View>
                  )}
                  {ticket.change_given !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Change Given</Text>
                      <Text style={styles.detailValue}>Rs. {ticket.change_given.toFixed(2)}</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {ticket?.notes && (
              <>
                <View style={styles.divider} />
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{ticket.notes}</Text>
                </View>
              </>
            )}
          </BlurView>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#F4F6F4', fontSize: 18, fontWeight: '700' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  card: { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  plateText: { color: '#F4F6F4', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  ticketNumText: { color: '#9DAFA8', fontSize: 13, fontWeight: '600', marginTop: 4, fontFamily: 'monospace' },
  
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  badgeActive: { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.25)' },
  badgePaid: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextActive: { color: '#34D399' },
  badgeTextPaid: { color: '#10B981' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  
  detailsSection: { gap: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: '#9DAFA8', fontSize: 14, fontWeight: '600' },
  detailValue: { color: '#F4F6F4', fontSize: 15, fontWeight: '700' },
  
  feeSection: { gap: 12 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { color: '#9DAFA8', fontSize: 14, fontWeight: '600' },
  feeValue: { color: '#F4F6F4', fontSize: 15, fontWeight: '700' },
  
  paymentSection: { gap: 12 },
  notesSection: { gap: 8 },
  notesLabel: { color: '#9DAFA8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  notesText: { color: '#F4F6F4', fontSize: 14, lineHeight: 20 },
});
