import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';

export default function ScanScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<any>(null);

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <LinearGradient colors={['#0B0F0E', '#0F1412']} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Feather name="arrow-left" size={24} color="#F4F6F4" />
            </TouchableOpacity>
          </View>
          <View style={styles.permissionView}>
            <View style={styles.cameraIconBg}>
              <Feather name="camera" size={48} color="#34D399" />
            </View>
            <Text style={styles.permissionTitle}>Camera Access</Text>
            <Text style={styles.permissionText}>We need your permission to use the camera to scan parking tickets.</Text>
            <TouchableOpacity style={styles.button} onPress={requestPermission}>
              <LinearGradient colors={['#34D399', '#10B981']} style={styles.gradientBtn}>
                <Text style={styles.buttonText}>Allow Camera</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const handleBarcodeScanned = async ({ type, data }: any) => {
    if (scanned) return;
    setScanned(true);
    
    try {
      setLoading(true);
      const res = await api.post('/operator/scan', { code: data });
      setTicketDetails(res.data.ticket);
    } catch (err: any) {
      Alert.alert('Invalid Ticket', err.response?.data?.message || err.message, [
        { text: 'Scan Again', onPress: () => setScanned(false) }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
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
      
      Alert.alert('Checkout Complete', `Vehicle successfully checked out.\nRs. ${totalDue.toFixed(2)} collected.`, [
        { text: 'View Receipt', onPress: () => navigation.navigate('PaymentReceipt', { ticketId: ticketDetails.ticket_id }) },
        { text: 'Done', onPress: () => { setTicketDetails(null); setScanned(false); } }
      ]);
    } catch (err: any) {
      Alert.alert('Checkout Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerAbsolute}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Ticket</Text>
          <View style={{width: 40}} />
        </View>
      </SafeAreaView>

      {!ticketDetails ? (
        <View style={styles.cameraContainer}>
          <CameraView 
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanTarget}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {scanned && <ActivityIndicator size="large" color="#34D399" style={{marginTop: 100}} />}
            </View>
            <BlurView intensity={30} tint="dark" style={styles.scanInstruction}>
              <Ionicons name="scan" size={24} color="#34D399" style={{marginRight: 12}} />
              <Text style={styles.scanText}>{scanned ? 'Fetching Details...' : 'Align QR Code inside frame'}</Text>
            </BlurView>
          </View>
        </View>
      ) : (
        <LinearGradient colors={['#0B0F0E', '#0F1412']} style={styles.container}>
          <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
            <View style={{ flex: 1, paddingTop: 100, padding: 24 }}>
              <BlurView intensity={20} tint="dark" style={styles.detailsCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.ticketIconBg}>
                    <Ionicons name="ticket" size={32} color="#34D399" />
                  </View>
                  <Text style={styles.cardTitle}>{ticketDetails.ticket_number}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{ticketDetails.status}</Text>
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

                <View style={styles.feeContainer}>
                  <Text style={styles.feeLabel}>Amount</Text>
                  <Text style={styles.feeValue}>Pending</Text>
                  <Text style={styles.feeSub}>Fare calculated at checkout</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.payBtn} onPress={handleCheckout} disabled={loading}>
                    <LinearGradient colors={['#34D399', '#10B981']} style={styles.gradientBtn}>
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Text style={styles.buttonText}>Collect Cash & Checkout</Text>
                          <Feather name="check-circle" size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => { setTicketDetails(null); setScanned(false); }}
                    disabled={loading}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Scan</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          </SafeAreaView>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F0E' },
  safeArea: { zIndex: 10, position: 'absolute', top: 0, left: 0, right: 0 },
  headerAbsolute: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#F4F6F4', fontSize: 18, fontWeight: '700' },
  
  permissionView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  cameraIconBg: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52, 211, 153, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  permissionTitle: { fontSize: 24, fontWeight: '800', color: '#F4F6F4', marginBottom: 12 },
  permissionText: { fontSize: 16, color: '#9DAFA8', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  
  cameraContainer: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanTarget: { width: 280, height: 280, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#34D399' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  
  scanInstruction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 30, position: 'absolute', bottom: 60, overflow: 'hidden' },
  scanText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  detailsCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  cardHeader: { alignItems: 'center', padding: 32, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  ticketIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(52, 211, 153, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 32, fontWeight: '900', color: '#F4F6F4', letterSpacing: 2, marginBottom: 12 },
  statusBadge: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#34D399', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 24 },
  detailItem: { width: '50%', marginBottom: 24 },
  detailLabel: { color: '#9DAFA8', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  detailValue: { color: '#F4F6F4', fontSize: 16, fontWeight: '800' },
  
  feeContainer: { backgroundColor: 'rgba(52, 211, 153, 0.08)', padding: 24, alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(52, 211, 153, 0.15)' },
  feeLabel: { color: '#34D399', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  feeValue: { color: '#34D399', fontSize: 48, fontWeight: '900' },
  feeSub: { color: 'rgba(52, 211, 153, 0.6)', fontSize: 12, marginTop: 4 },
  
  actions: { padding: 24, gap: 16 },
  button: { borderRadius: 16, overflow: 'hidden' },
  payBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: 'rgba(52,211,153,0.4)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  gradientBtn: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cancelBtn: { padding: 18, alignItems: 'center' },
  cancelBtnText: { color: '#9DAFA8', fontSize: 16, fontWeight: '600' }
});
