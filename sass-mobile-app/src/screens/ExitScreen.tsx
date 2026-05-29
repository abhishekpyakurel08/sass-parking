import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
  Modal, Platform, KeyboardAvoidingView,
} from 'react-native';
import {
  ChevronLeft, ScanLine, DoorOpen, Banknote, CreditCard,
  AlertTriangle, X, Car, Bike, Truck,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useParkingStore } from '../store/parkingStore';
import { useAuthStore } from '../store/authStore';
import type { PaymentMethod } from '../types/api.types';
import { ReceiptPreview } from '../components/Receipt/ReceiptPreview';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ErrorBanner } from '../components/ErrorBanner';

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const ExitScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();

  // Redirect ENTRY-only operators
  useEffect(() => {
    if (user?.role === 'GATE_STAFF' && user?.gate_assignment === 'ENTRY') {
      Alert.alert('Access Denied', 'You are not authorized to process vehicle exits.');
      navigation.goBack();
    }
  }, [user, navigation]);

  const passedTicketId: string | undefined = (route.params as any)?.ticket_id;

  const {
    scannedTicket, checkoutSummary, paymentReceipt,
    isLoading, scanTicket, checkOut, processPayment, lostTicket,
    clearScanned, clearCheckout, clearPayment, error, clearError,
  } = useParkingStore();

  const [scanCode, setScanCode] = useState(passedTicketId ?? '');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [step, setStep] = useState<'scan' | 'payment' | 'done'>('scan');

  // Lost ticket modal
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostPlate, setLostPlate] = useState('');
  const [lostVehicleType, setLostVehicleType] = useState<'CAR' | 'BIKE' | 'TRUCK' | 'SUV' | 'BUS'>('CAR');
  const [lostDuration, setLostDuration] = useState('24');

  useEffect(() => {
    if (passedTicketId && !checkoutSummary) doCheckout(passedTicketId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doScan = async () => {
    if (!scanCode.trim()) { Alert.alert('Enter a plate or ticket number'); return; }
    try {
      clearError();
      await scanTicket(scanCode.trim().toUpperCase());
      const ticket = useParkingStore.getState().scannedTicket;
      if (!ticket) return;
      if (ticket.status === 'ACTIVE') {
        await doCheckout(ticket.ticket_id);
      } else if (ticket.status === 'PENDING_PAYMENT') {
        setStep('payment');
      } else {
        Alert.alert('Ticket Status', `This ticket is already ${ticket.status}.`);
      }
    } catch (err: any) { Alert.alert('Scan Failed', err.message); }
  };

  const doCheckout = async (id: string) => {
    try { await checkOut(id); setStep('payment'); }
    catch (err: any) { Alert.alert('Checkout Error', err.message); }
  };

  const doPayment = async () => {
    const ticketId = (checkoutSummary?.ticket_id ?? scannedTicket?.ticket_id)!;
    const totalDue = checkoutSummary?.total_amount ?? 0;
    
    let received: number | undefined = undefined;
    let reference: string | undefined = undefined;

    if (payMethod === 'CASH') {
      const val = amountReceived ? parseFloat(amountReceived) : 0;
      if (isNaN(val) || val < totalDue) {
        Alert.alert('Insufficient Amount', `Minimum Rs. ${totalDue} required`);
        return;
      }
      received = val;
    } else {
      reference = `REF-${payMethod}-${Date.now()}`;
    }

    try {
      clearError();
      await processPayment(ticketId, payMethod, received, reference);
      setStep('done');
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message);
    }
  };

  const handleLostOverride = async () => {
    if (!lostPlate.trim()) { Alert.alert('Validation Error', 'Please enter license plate'); return; }
    const hours = parseFloat(lostDuration);
    if (isNaN(hours) || hours <= 0) { Alert.alert('Validation Error', 'Enter a valid duration in hours'); return; }
    try {
      await lostTicket(lostVehicleType, lostPlate.trim().toUpperCase(), hours);
      setShowLostModal(false); setLostPlate(''); setLostDuration('24');
      setStep('payment');
    } catch (err: any) { Alert.alert('Override Failed', err.message); }
  };

  const resetAll = () => {
    clearScanned(); clearCheckout(); clearPayment(); clearError();
    setScanCode(''); setAmountReceived(''); setPayMethod('CASH'); setStep('scan');
  };

  const totalDue = checkoutSummary?.total_amount ?? 0;
  const changeDue = payMethod === 'CASH' && amountReceived
    ? Math.max(0, parseFloat(amountReceived || '0') - totalDue) : 0;

  const GateHeader = ({ onBack }: { onBack: () => void }) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <ChevronLeft color={colors.textSecondary} size={24} />
      </TouchableOpacity>
      <View style={styles.gateBadge}>
        <Text style={styles.gateBadgeText}>🔴 EXIT GATE</Text>
      </View>
      <Text style={styles.headerTitle}>PARKSAAS</Text>
    </View>
  );

  // ── DONE ─────────────────────────────────────────────────────────────────────
  if (step === 'done' && paymentReceipt) {
    const sum = checkoutSummary ?? scannedTicket;
    return (
      <SafeAreaView style={styles.container}>
        <ErrorBanner error={error} clearError={clearError} />
        <GateHeader onBack={resetAll} />
        <ScrollView contentContainerStyle={styles.content}>
          <ReceiptPreview
            data={{
              ticketNo: sum?.ticket_number?.slice(0, 8).toUpperCase() ?? 'N/A',
              plate: sum?.license_plate ?? 'N/A',
              vehType: sum?.vehicle_type ?? 'N/A',
              checkIn: sum?.check_in_time ? new Date(sum.check_in_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A',
              checkOut: sum?.check_out_time ? new Date(sum.check_out_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
              duration: checkoutSummary ? fmtDuration(checkoutSummary.duration_minutes) : 'N/A',
              totalDue: paymentReceipt.total_due,
              paymentMethod: paymentReceipt.payment_method,
              changeGiven: paymentReceipt.change_given,
            }}
            onNextVehicle={resetAll}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SCAN ─────────────────────────────────────────────────────────────────────
  if (step === 'scan') {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorBanner error={error} clearError={clearError} />
        <GateHeader onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.duration(350)} style={styles.card}>
            <Text style={styles.cardTitle}>Process Exit / Payment</Text>
            <Text style={styles.cardSub}>Enter plate number or scan ticket QR</Text>

            <Text style={styles.fieldLabel}>TICKET NUMBER / LICENSE PLATE</Text>
            <View style={styles.scanInputRow}>
              <TextInput
                style={styles.scanInput}
                value={scanCode}
                onChangeText={t => setScanCode(t.toUpperCase())}
                placeholder="Enter ID to scan"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
              <ScanLine color={colors.textSecondary} size={22} />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
              onPress={doScan} disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.primaryBtnText}>SCAN & CALCULATE FARE</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.lostLink} onPress={() => setShowLostModal(true)}>
              <AlertTriangle color="#FCA5A5" size={14} />
              <Text style={styles.lostLinkText}>Lost Ticket? Apply Penalty Override</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Lost Ticket Modal */}
        <Modal visible={showLostModal} transparent animationType="fade" onRequestClose={() => setShowLostModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle color="#EF4444" size={20} />
                  <Text style={styles.modalTitle}>Lost Ticket Override</Text>
                </View>
                <TouchableOpacity onPress={() => setShowLostModal(false)}>
                  <X color={colors.textSecondary} size={22} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.fieldLabel}>VEHICLE TYPE</Text>
                <View style={styles.vehicleRow}>
                  {(['CAR', 'BIKE', 'TRUCK', 'SUV', 'BUS'] as const).map(type => {
                    const active = lostVehicleType === type;
                    const Icon = type === 'BIKE' ? Bike : type === 'CAR' ? Car : Truck;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.vehicleChip, active && styles.vehicleChipActive]}
                        onPress={() => setLostVehicleType(type)}
                      >
                        <Icon color={active ? '#FFF' : colors.textSecondary} size={16} />
                        <Text style={[styles.vehicleChipText, active && { color: '#FFF' }]}>{type}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>LICENSE PLATE</Text>
                <View style={styles.modalInput}>
                  <TextInput style={styles.modalInputText} value={lostPlate}
                    onChangeText={t => setLostPlate(t.toUpperCase())}
                    placeholder="e.g. BA-12-PA-3456" placeholderTextColor={colors.textSecondary}
                    autoCapitalize="characters" />
                </View>

                <Text style={styles.fieldLabel}>ASSUMED DURATION (HOURS)</Text>
                <View style={styles.modalInput}>
                  <TextInput style={styles.modalInputText} value={lostDuration}
                    onChangeText={setLostDuration} placeholder="24"
                    placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.success, marginTop: 12 }, isLoading && { opacity: 0.6 }]}
                  onPress={handleLostOverride} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>GENERATE PENALTY & PROCEED</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── PAYMENT ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ErrorBanner error={error} clearError={clearError} />
      <GateHeader onBack={() => setStep('scan')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(350)} style={styles.card}>
          <View style={styles.paymentHeaderRow}>
            <Text style={styles.fieldLabel}>PAYMENT REQUIRED</Text>
            <View style={styles.validatedBadge}><Text style={styles.validatedText}>VALIDATED</Text></View>
          </View>

          <View style={styles.plateBox}>
            <Text style={styles.plateText}>{checkoutSummary?.license_plate ?? scannedTicket?.license_plate}</Text>
          </View>

          <View style={styles.timeRow}>
            <View>
              <Text style={styles.fieldLabel}>ENTRY TIME</Text>
              <Text style={styles.timeValue}>{checkoutSummary?.check_in_time ? fmtTime(checkoutSummary.check_in_time) : '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.fieldLabel}>EXIT TIME</Text>
              <Text style={styles.timeValue}>{fmtTime(checkoutSummary?.check_out_time ?? new Date().toISOString())}</Text>
            </View>
          </View>

          <View style={styles.durationRow}>
            <Text style={styles.fieldLabel}>DURATION</Text>
            <Text style={styles.timeValue}>{checkoutSummary ? fmtDuration(checkoutSummary.duration_minutes) : '—'}</Text>
          </View>

          <View style={styles.totalDue}>
            <Text style={styles.fieldLabel}>TOTAL DUE</Text>
            <Text style={styles.totalDueValue}>Rs. {totalDue.toFixed(0)}</Text>
          </View>

          <View style={styles.methodToggle}>
            {(['CASH', 'UPI'] as PaymentMethod[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, payMethod === m && styles.methodBtnActive]}
                onPress={() => setPayMethod(m)}
              >
                {m === 'CASH'
                  ? <Banknote color={payMethod === m ? '#FFF' : colors.textSecondary} size={16} />
                  : <CreditCard color={payMethod === m ? '#FFF' : colors.textSecondary} size={16} />}
                <Text style={[styles.methodText, payMethod === m && { color: '#FFF' }]}>
                  {m === 'UPI' ? 'UPI/Card' : 'Cash'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {payMethod === 'CASH' && (
            <>
              <Text style={styles.fieldLabel}>AMOUNT RECEIVED (Rs.)</Text>
              <View style={styles.scanInputRow}>
                <TextInput style={[styles.scanInput, { fontSize: 20 }]}
                  placeholder="0.00" placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric" value={amountReceived} onChangeText={setAmountReceived} />
              </View>
              <View style={styles.changeRow}>
                <Text style={styles.fieldLabel}>CHANGE TO GIVE</Text>
                <Text style={styles.changeValue}>Rs. {changeDue.toFixed(0)}</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
            onPress={doPayment} disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <DoorOpen color="#FFF" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>CONFIRM & OPEN GATE</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.lostLink} onPress={() => setShowLostModal(true)}>
            <AlertTriangle color="#FCA5A5" size={14} />
            <Text style={styles.lostLinkText}>Lost Ticket? Apply Penalty Override</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:      { color: colors.textSecondary, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  gateBadge:        { backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  gateBadgeText:    { color: '#EF4444', fontSize: 11, fontWeight: 'bold' },
  content:          { padding: 16, paddingBottom: 40 },
  card:             { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16 },
  cardTitle:        { color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  cardSub:          { color: colors.textSecondary, fontSize: 13, marginBottom: 20 },
  fieldLabel:       { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  scanInputRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 14, height: 48, marginBottom: 16 },
  scanInput:        { flex: 1, color: colors.text, fontSize: 16 },
  primaryBtn:       { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 6, marginBottom: 16 },
  primaryBtnText:   { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  lostLink:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  lostLinkText:     { color: '#FCA5A5', fontSize: 12, textDecorationLine: 'underline' },
  // Payment
  paymentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  validatedBadge:   { backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  validatedText:    { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  plateBox:         { backgroundColor: '#FFF', borderRadius: 4, padding: 14, alignItems: 'center', marginBottom: 16, elevation: 4 },
  plateText:        { color: '#000', fontSize: 26, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 4 },
  timeRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  timeValue:        { color: colors.text, fontSize: 13, fontWeight: 'bold' },
  durationRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  totalDue:         { alignItems: 'center', marginBottom: 20 },
  totalDueValue:    { color: colors.success, fontSize: 48, fontWeight: 'bold', marginTop: 4 },
  methodToggle:     { flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  methodBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 },
  methodBtnActive:  { backgroundColor: '#EF4444', borderRadius: 4 },
  methodText:       { color: colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
  changeRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 16, height: 48, marginBottom: 20 },
  changeValue:      { color: '#FDBA74', fontSize: 18, fontWeight: 'bold' },
  // Modal
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modal:            { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, width: '100%', maxHeight: '85%' },
  modalHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:       { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  modalInput:       { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  modalInputText:   { color: colors.text, fontSize: 14, height: '100%' },
  vehicleRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  vehicleChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 4, backgroundColor: colors.inputBg },
  vehicleChipActive:{ backgroundColor: colors.primary, borderColor: colors.primary },
  vehicleChipText:  { color: colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
});

export default ExitScreen;
