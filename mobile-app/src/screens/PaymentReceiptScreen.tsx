import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';

export default function PaymentReceiptScreen({ route, navigation }: any) {
  const { ticketId } = route.params;
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipt();
  }, [ticketId]);

  const loadReceipt = async () => {
    try {
      const res = await api.get(`/parking/${ticketId}/receipt`);
      setReceipt(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: receipt?.printable_text || 'Parking Receipt',
      });
    } catch (err) {
      console.error('Share failed:', err);
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

  const totalDue = (receipt?.fare_amount || 0) + (receipt?.penalty_amount || 0) - (receipt?.discount_amount || 0);

  return (
    <LinearGradient colors={['#0B0F0E', '#0F1412']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={24} color="#F4F6F4" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Receipt</Text>
          <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
            <Feather name="share" size={24} color="#F4F6F4" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <BlurView intensity={20} tint="dark" style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#34D399" />
              </View>
              <Text style={styles.successTitle}>Payment Successful</Text>
              <Text style={styles.successSubtitle}>Transaction completed</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ticket Number</Text>
                <Text style={styles.detailValue}>{receipt?.ticket_number}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>License Plate</Text>
                <Text style={styles.detailValue}>{receipt?.license_plate || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle Type</Text>
                <Text style={styles.detailValue}>{receipt?.vehicle_type}</Text>
              </View>
              {receipt?.check_in_time && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Entry Time</Text>
                  <Text style={styles.detailValue}>{new Date(receipt.check_in_time).toLocaleString()}</Text>
                </View>
              )}
              {receipt?.check_out_time && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Exit Time</Text>
                  <Text style={styles.detailValue}>{new Date(receipt.check_out_time).toLocaleString()}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Subtotal</Text>
                <Text style={styles.breakdownValue}>Rs. {(receipt?.fare_amount || 0).toFixed(2)}</Text>
              </View>
              {receipt?.discount_amount > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Discount</Text>
                  <Text style={[styles.breakdownValue, { color: '#10b981' }]}>- Rs. {receipt.discount_amount.toFixed(2)}</Text>
                </View>
              )}
              {receipt?.penalty_amount > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Penalty</Text>
                  <Text style={[styles.breakdownValue, { color: '#ef4444' }]}>+ Rs. {receipt.penalty_amount.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.divider, { marginVertical: 16 }]} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>Rs. {totalDue.toFixed(2)}</Text>
              </View>
            </View>

            {receipt?.payment_method && (
              <>
                <View style={styles.divider} />
                <View style={styles.paymentInfo}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method</Text>
                    <Text style={styles.detailValue}>{receipt.payment_method}</Text>
                  </View>
                  {receipt?.amount_received && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount Received</Text>
                      <Text style={styles.detailValue}>Rs. {receipt.amount_received.toFixed(2)}</Text>
                    </View>
                  )}
                  {receipt?.change_given !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Change Given</Text>
                      <Text style={styles.detailValue}>Rs. {receipt.change_given.toFixed(2)}</Text>
                    </View>
                  )}
                  {receipt?.transaction_reference && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Transaction ID</Text>
                      <Text style={[styles.detailValue, { fontSize: 12, fontFamily: 'monospace' }]}>{receipt.transaction_reference}</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {receipt?.printable_text && (
              <>
                <View style={styles.divider} />
                <View style={styles.printableSection}>
                  <Text style={styles.printableTitle}>Printable Receipt</Text>
                  <Text style={styles.printableText}>{receipt.printable_text}</Text>
                </View>
              </>
            )}
          </BlurView>

          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <LinearGradient colors={['#34D399', '#10B981']} style={styles.gradientBtn}>
              <Text style={styles.buttonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  
  receiptCard: { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  receiptHeader: { alignItems: 'center', paddingVertical: 24 },
  successIcon: { marginBottom: 16 },
  successTitle: { color: '#34D399', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  successSubtitle: { color: '#9DAFA8', fontSize: 14, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  
  receiptDetails: { gap: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: '#9DAFA8', fontSize: 14, fontWeight: '600' },
  detailValue: { color: '#F4F6F4', fontSize: 15, fontWeight: '700' },
  
  paymentBreakdown: { gap: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { color: '#9DAFA8', fontSize: 14, fontWeight: '600' },
  breakdownValue: { color: '#F4F6F4', fontSize: 15, fontWeight: '700' },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#F4F6F4', fontSize: 16, fontWeight: '800' },
  totalValue: { color: '#34D399', fontSize: 24, fontWeight: '900' },
  
  paymentInfo: { gap: 12 },
  printableSection: { gap: 12 },
  printableTitle: { color: '#9DAFA8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  printableText: { color: '#F4F6F4', fontSize: 12, fontFamily: 'monospace', lineHeight: 18, backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 },
  
  doneBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 20, shadowColor: 'rgba(52,211,153,0.4)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  gradientBtn: { padding: 18, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
