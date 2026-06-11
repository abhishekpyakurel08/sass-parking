import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { brandingService } from '../lib/branding';

export default function ManualExitScreen({ navigation }: any) {
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const branding = brandingService.getBranding();

  const handleLookup = async () => {
    if (!ticketId.trim()) {
      Alert.alert('Required', 'Please enter a ticket number or license plate');
      return;
    }

    try {
      setLoading(true);
      // Use the scan endpoint to look up ticket by ticket number or license plate
      const res = await api.post('/operator/scan', { code: ticketId.trim() });
      setTicketDetails(res.data.ticket);
    } catch (err: any) {
      Alert.alert('Lookup Error', err.response?.data?.message || err.message, [
        { text: 'Try Again' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!ticketDetails) return;

    try {
      setLoading(true);
      
      // 1. Check out to calculate fare and move to PENDING_PAYMENT
      const checkoutRes = await api.post('/operator/check-out', { ticket_id: ticketDetails.ticket_id });
      const totalDue = checkoutRes.data.summary.total_amount;

      // 2. If there's a fee, process the payment
      if (totalDue > 0) {
        await api.post('/operator/process-payment', { 
          ticket_id: ticketDetails.ticket_id,
          amount_received: totalDue,
          payment_method: 'CASH'
        });
      }

      Alert.alert(
        'Exit Successful',
        `Vehicle successfully exited.\n${totalDue > 0 ? `Rs. ${totalDue.toFixed(2)} collected.` : 'No payment required.'}`,
        [
          { text: 'View Receipt', onPress: () => navigation.navigate('PaymentReceipt', { ticketId: ticketDetails.ticket_id }) },
          { text: 'Done', onPress: () => navigation.goBack() }
        ]
      );
    } catch (err: any) {
      Alert.alert('Checkout Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[branding.accentColor, branding.secondaryColor]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Feather name="arrow-left" size={24} color="#F4F6F4" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manual Exit</Text>
            <View style={{ width: 40 }} />
          </View>

          {!ticketDetails ? (
            <View style={styles.content}>
              <BlurView intensity={20} tint="dark" style={styles.formCard}>
                <View style={styles.iconContainer}>
                  <View style={[styles.iconBg, { backgroundColor: `${branding.primaryColor}26` }]}>
                    <Feather name="log-out" size={48} color={branding.primaryColor} />
                  </View>
                  <Text style={styles.formTitle}>Manual Vehicle Exit</Text>
                  <Text style={styles.formSubtitle}>Enter ticket number or license plate</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>TICKET NUMBER / LICENSE PLATE</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="edit-2" size={20} color="#9DAFA8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. TKT-12345 or BA 1 PA 1234"
                      placeholderTextColor="#9DAFA8"
                      value={ticketId}
                      onChangeText={setTicketId}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleLookup} 
                  disabled={loading}
                >
                  <LinearGradient 
                    colors={[branding.primaryColor, branding.secondaryColor]} 
                    style={styles.gradientBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Lookup Ticket</Text>
                        <Feather name="search" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </BlurView>
            </View>
          ) : (
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
              <BlurView intensity={20} tint="dark" style={styles.detailsCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.ticketIconBg, { backgroundColor: `${branding.primaryColor}26` }]}>
                    <Ionicons name="ticket" size={32} color={branding.primaryColor} />
                  </View>
                  <Text style={styles.cardTitle}>{ticketDetails.ticket_number}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${branding.primaryColor}26`, borderColor: `${branding.primaryColor}40` }]}>
                    <Text style={[styles.statusText, { color: branding.primaryColor }]}>{ticketDetails.status}</Text>
                  </View>
                </View>
                
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Vehicle Type</Text>
                    <Text style={styles.detailValue}>{ticketDetails.vehicle_type}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>License Plate</Text>
                    <Text style={styles.detailValue}>{ticketDetails.license_plate || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Entry Time</Text>
                    <Text style={styles.detailValue}>{new Date(ticketDetails.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{Math.floor((Date.now() - new Date(ticketDetails.check_in_time).getTime()) / 60000)} mins</Text>
                  </View>
                </View>

                <View style={[styles.feeContainer, { backgroundColor: `${branding.primaryColor}14`, borderTopColor: `${branding.primaryColor}26`, borderBottomColor: `${branding.primaryColor}26` }]}>
                  <Text style={[styles.feeLabel, { color: branding.primaryColor }]}>Amount</Text>
                  <Text style={[styles.feeValue, { color: branding.primaryColor }]}>Pending</Text>
                  <Text style={[styles.feeSub, { color: `${branding.primaryColor}99` }]}>Fare calculated at checkout</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.payBtn} onPress={handleCheckout} disabled={loading}>
                    <LinearGradient colors={[branding.primaryColor, branding.secondaryColor]} style={styles.gradientBtn}>
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Text style={styles.buttonText}>Collect Cash & Exit</Text>
                          <Feather name="check-circle" size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setTicketDetails(null)}
                    disabled={loading}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#F4F6F4', fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: 24 },
  scrollContent: { paddingTop: 40, justifyContent: 'center' },
  
  formCard: { borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  iconContainer: { alignItems: 'center', marginBottom: 32 },
  iconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  formTitle: { color: '#F4F6F4', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  formSubtitle: { color: '#9DAFA8', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  
  inputContainer: { marginBottom: 24 },
  label: { color: '#9DAFA8', fontSize: 12, fontWeight: '800', marginBottom: 12, letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  inputIcon: { paddingLeft: 16 },
  input: { flex: 1, color: '#F4F6F4', padding: 16, fontSize: 16, fontWeight: '700' },
  
  button: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: 'rgba(52,211,153,0.4)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  gradientBtn: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  
  cancelBtn: { padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#9DAFA8', fontSize: 16, fontWeight: '600' },

  detailsCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  cardHeader: { alignItems: 'center', padding: 32, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  ticketIconBg: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 32, fontWeight: '900', color: '#F4F6F4', letterSpacing: 2, marginBottom: 12 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#9DAFA8', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 24 },
  detailItem: { width: '50%', marginBottom: 24 },
  detailLabel: { color: '#9DAFA8', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  detailValue: { color: '#F4F6F4', fontSize: 16, fontWeight: '800' },
  
  feeContainer: { backgroundColor: 'rgba(255,255,255,0.04)', padding: 24, alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  feeLabel: { color: '#9DAFA8', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  feeValue: { color: '#F4F6F4', fontSize: 48, fontWeight: '900' },
  feeSub: { color: '#9DAFA8', fontSize: 12, marginTop: 4 },
  
  actions: { padding: 24, gap: 16 },
  payBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: 'rgba(0,0,0,0.3)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
});
