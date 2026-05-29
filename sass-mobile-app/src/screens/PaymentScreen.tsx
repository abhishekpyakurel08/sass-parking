import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert, Modal, Platform, KeyboardAvoidingView,
} from 'react-native';
import { RefreshCcw, CircleUser, Banknote, CreditCard, DoorOpen, ChevronLeft, ScanLine, Car, Bike, Truck, AlertTriangle, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useParkingStore } from '../store/parkingStore';
import type { PaymentMethod } from '../types/api.types';
import { ReceiptPreview } from '../components/Receipt/ReceiptPreview';
import { ErrorBanner } from '../components/ErrorBanner';

// Helper to format minutes → "2h 30m"
const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

import { useAuthStore } from '../store/authStore';

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const { user }   = useAuthStore();

  useEffect(() => {
    if (user?.role === 'GATE_STAFF' && user?.gate_assignment === 'ENTRY') {
      Alert.alert('Access Denied', 'You are only authorized to process entries.');
      navigation.goBack();
    }
  }, [user, navigation]);

  // ticket_id can be passed from ScannerScreen; fallback to scannedTicket in store
  const passedTicketId: string | undefined = (route.params as any)?.ticket_id;

  const {
    scannedTicket, checkoutSummary, paymentReceipt,
    isLoading, scanTicket, checkOut, processPayment, lostTicket,
    clearScanned, clearCheckout, clearPayment, error, clearError,
  } = useParkingStore();

  const [scanCode, setScanCode]             = useState(passedTicketId ?? '');
  const [payMethod, setPayMethod]           = useState<PaymentMethod>('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [step, setStep]                     = useState<'scan' | 'payment' | 'done'>('scan');

  // Lost ticket override modal state
  const [showLostModal, setShowLostModal]   = useState(false);
  const [lostPlate, setLostPlate]           = useState('');
  const [lostVehicleType, setLostVehicleType] = useState<'CAR' | 'BIKE' | 'TRUCK' | 'SUV' | 'BUS'>('CAR');
  const [lostDuration, setLostDuration]     = useState('24');

  // If ticket was passed directly, jump to payment
  useEffect(() => {
    if (passedTicketId && !checkoutSummary) {
      doCheckout(passedTicketId);
    }
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
        // Proceed to checkout
        await doCheckout(ticket.ticket_id);
      } else if (ticket.status === 'PENDING_PAYMENT') {
        setStep('payment');
      } else {
        Alert.alert('Ticket Status', `This ticket is already ${ticket.status}.`);
      }
    } catch (err: any) {
      Alert.alert('Scan Failed', err.message);
    }
  };

  const doCheckout = async (id: string) => {
    try {
      await checkOut(id);
      setStep('payment');
    } catch (err: any) {
      Alert.alert('Checkout Error', err.message);
    }
  };

  const handleLostTicketOverride = async () => {
    if (!lostPlate.trim()) {
      Alert.alert('Validation Error', 'Please enter license plate');
      return;
    }
    const hours = parseFloat(lostDuration);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid assumed duration in hours');
      return;
    }

    try {
      await lostTicket(lostVehicleType, lostPlate.trim().toUpperCase(), hours);
      setShowLostModal(false);
      setLostPlate('');
      setLostDuration('24');
      setStep('payment');
    } catch (err: any) {
      Alert.alert('Override Failed', err.message);
    }
  };

  const doPayment = async () => {
    const summary = checkoutSummary ?? (scannedTicket?.status === 'PENDING_PAYMENT' ? scannedTicket : null);
    if (!summary) return;

    const ticketId = (checkoutSummary?.ticket_id ?? scannedTicket?.ticket_id)!;
    const totalDue = checkoutSummary?.total_amount ?? (scannedTicket as any)?.fare_amount ?? 0;

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
      // Auto-generate reference for UPI / Card — required by backend validation
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

  const resetAll = () => {
    clearScanned(); clearCheckout(); clearPayment(); clearError();
    setScanCode(''); setAmountReceived(''); setPayMethod('CASH'); setStep('scan');
  };

  const totalDue    = checkoutSummary?.total_amount ?? 0;
  const changeDue   = payMethod === 'CASH' && amountReceived
    ? Math.max(0, parseFloat(amountReceived || '0') - totalDue)
    : 0;

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (step === 'done' && paymentReceipt) {
    const sum = checkoutSummary ?? scannedTicket;
    const ticketNo = sum?.ticket_number?.slice(0, 8).toUpperCase() ?? 'N/A';
    const plate = sum?.license_plate ?? 'N/A';
    const vehType = sum?.vehicle_type ?? 'N/A';
    const checkIn = sum?.check_in_time ? new Date(sum.check_in_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
    const checkOutTime = sum?.check_out_time ? new Date(sum.check_out_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const duration = checkoutSummary ? fmtDuration(checkoutSummary.duration_minutes) : 'N/A';

    return (
      <SafeAreaView style={styles.container}>
        <ErrorBanner error={error} clearError={clearError} />
        <View style={styles.header}>
          <TouchableOpacity onPress={resetAll}>
            <ChevronLeft color={colors.textSecondary} size={24} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <RefreshCcw color={colors.primary} size={20} />
            <Text style={styles.logoText}>PARKSAAS</Text>
          </View>
          <CircleUser color={colors.textSecondary} size={24} />
        </View>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
          <ReceiptPreview 
            data={{
              ticketNo,
              plate,
              vehType,
              checkIn,
              checkOut: checkOutTime,
              duration,
              totalDue: paymentReceipt.total_due,
              paymentMethod: paymentReceipt.payment_method,
              changeGiven: paymentReceipt.change_given
            }}
            onNextVehicle={resetAll}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SCAN ──────────────────────────────────────────────────────────────────
  if (step === 'scan') {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorBanner error={error} clearError={clearError} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft color={colors.textSecondary} size={24} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <RefreshCcw color={colors.primary} size={20} />
            <Text style={styles.logoText}>PARKSAAS</Text>
          </View>
          <CircleUser color={colors.textSecondary} size={24} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>Scan / Check Out</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 24 }}>Enter plate or ticket number</Text>

            <Text style={styles.smallLabel}>PLATE / TICKET NO</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={scanCode}
                onChangeText={(t) => setScanCode(t.toUpperCase())}
                placeholder="e.g. DL01AA1234"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
              <ScanLine color={colors.textSecondary} size={20} />
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, { marginTop: 24 }, isLoading && { opacity: 0.6 }]}
              onPress={doScan}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.confirmButtonText}>SCAN & CALCULATE FARE</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.penaltyLinkContainer, { marginTop: 16 }]}
              onPress={() => setShowLostModal(true)}
            >
              <Text style={styles.penaltyLinkText}>Lost Ticket? Apply Penalty</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PAYMENT ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ErrorBanner error={error} clearError={clearError} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('scan')}>
          <ChevronLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <RefreshCcw color={colors.primary} size={20} />
          <Text style={styles.logoText}>PARKSAAS</Text>
        </View>
        <CircleUser color={colors.textSecondary} size={24} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.smallLabel}>PAYMENT REQUIRED</Text>
            <View style={styles.validatedBadge}>
              <Text style={styles.validatedText}>VALIDATED</Text>
            </View>
          </View>

          <View style={styles.plateDisplay}>
            <Text style={styles.plateText}>{checkoutSummary?.license_plate ?? scannedTicket?.license_plate}</Text>
          </View>

          <View style={styles.timeRow}>
            <View>
              <Text style={styles.smallLabel}>ENTRY TIME</Text>
              <Text style={styles.timeText}>{checkoutSummary?.check_in_time ? fmtTime(checkoutSummary.check_in_time) : '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.smallLabel}>EXIT TIME (NOW)</Text>
              <Text style={styles.timeText}>{checkoutSummary?.check_out_time ? fmtTime(checkoutSummary.check_out_time) : fmtTime(new Date().toISOString())}</Text>
            </View>
          </View>
          <View style={styles.durationRow}>
            <Text style={styles.smallLabel}>DURATION</Text>
            <Text style={styles.timeText}>{checkoutSummary ? fmtDuration(checkoutSummary.duration_minutes) : '—'}</Text>
          </View>

          <View style={styles.totalDueContainer}>
            <Text style={styles.smallLabel}>TOTAL DUE</Text>
            <Text style={styles.totalDueValue}>Rs. {totalDue.toFixed(0)}</Text>
          </View>

          {/* Payment Method */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, payMethod === 'CASH' && styles.toggleButtonActive]}
              onPress={() => setPayMethod('CASH')}
            >
              <Banknote color={payMethod === 'CASH' ? '#FFF' : colors.textSecondary} size={16} style={{ marginRight: 6 }} />
              <Text style={payMethod === 'CASH' ? styles.toggleTextActive : styles.toggleText}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, payMethod === 'UPI' && styles.toggleButtonActive]}
              onPress={() => setPayMethod('UPI')}
            >
              <CreditCard color={payMethod === 'UPI' ? '#FFF' : colors.textSecondary} size={16} style={{ marginRight: 6 }} />
              <Text style={payMethod === 'UPI' ? styles.toggleTextActive : styles.toggleText}>UPI/Card</Text>
            </TouchableOpacity>
          </View>

          {payMethod === 'CASH' && (
            <>
              <Text style={styles.smallLabel}>AMOUNT RECEIVED (Rs.)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={amountReceived}
                  onChangeText={setAmountReceived}
                />
              </View>

              <View style={styles.changeContainer}>
                <Text style={styles.smallLabel}>CHANGE TO GIVE</Text>
                <Text style={styles.changeValue}>Rs. {changeDue.toFixed(0)}</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.confirmButton, isLoading && { opacity: 0.6 }]}
            onPress={doPayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <DoorOpen color="#FFF" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.confirmButtonText}>CONFIRM & OPEN GATE</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.penaltyLinkContainer} onPress={() => setShowLostModal(true)}>
            <Text style={styles.penaltyLinkText}>Lost Ticket? Apply Penalty</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showLostModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLostModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertTriangle color="#EF4444" size={22} />
                <Text style={styles.modalTitle}>Lost Ticket Override</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLostModal(false)}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.modalLabel}>VEHICLE TYPE</Text>
              <View style={styles.modalVehicleTypes}>
                {(['CAR', 'BIKE', 'TRUCK', 'SUV', 'BUS'] as const).map(type => {
                  const active = lostVehicleType === type;
                  const Icon = type === 'CAR' ? Car : type === 'BIKE' ? Bike : Truck;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.modalVehicleBtn, active && styles.modalVehicleBtnActive]}
                      onPress={() => setLostVehicleType(type)}
                    >
                      <Icon color={active ? '#FFF' : colors.textSecondary} size={18} />
                      <Text style={[styles.modalVehicleText, active && styles.modalVehicleTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalLabel}>LICENSE PLATE</Text>
              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={lostPlate}
                  onChangeText={t => setLostPlate(t.toUpperCase())}
                  placeholder="e.g. BA-12-PA-3456"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                />
              </View>

              <Text style={styles.modalLabel}>ASSUMED DURATION (HOURS)</Text>
              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={lostDuration}
                  onChangeText={setLostDuration}
                  placeholder="24"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isLoading && { opacity: 0.6 }]}
                onPress={handleLostTicketOverride}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>GENERATE PENALTY & PROCESS EXIT</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  header:             { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoContainer:      { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 12 },
  logoText:           { color: colors.primary, fontSize: 18, fontWeight: 'bold', marginLeft: 8, letterSpacing: 1 },
  content:            { padding: 16 },
  card:               { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16 },
  cardHeaderRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  smallLabel:         { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  validatedBadge:     { backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  validatedText:      { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  plateDisplay:       { backgroundColor: '#FFF', borderRadius: 4, padding: 16, alignItems: 'center', marginBottom: 20, elevation: 5 },
  plateText:          { color: '#000', fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 4 },
  timeRow:            { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  timeText:           { color: colors.text, fontSize: 12, fontWeight: 'bold' },
  durationRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  totalDueContainer:  { alignItems: 'center', marginBottom: 24 },
  totalDueValue:      { color: colors.success, fontSize: 48, fontWeight: 'bold', marginTop: 8 },
  toggleContainer:    { flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  toggleButton:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 },
  toggleButtonActive: { backgroundColor: colors.success, borderRadius: 4 },
  toggleText:         { color: colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
  toggleTextActive:   { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  inputContainer:     { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 16, height: 48, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 16 },
  input:              { flex: 1, color: colors.text, fontSize: 16 },
  changeContainer:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 16, height: 48, marginBottom: 24 },
  changeValue:        { color: '#FDBA74', fontSize: 18, fontWeight: 'bold' },
  confirmButton:      { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 4, marginBottom: 20 },
  confirmButtonText:  { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  penaltyLinkContainer: { alignItems: 'center' },
  penaltyLinkText:    { color: '#FCA5A5', fontSize: 12, textDecorationLine: 'underline' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxHeight: '90%',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  modalVehicleTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  modalVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.inputBg,
  },
  modalVehicleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalVehicleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalVehicleTextActive: {
    color: '#FFF',
  },
  modalInputContainer: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalInput: {
    color: colors.text,
    fontSize: 14,
    width: '100%',
  },
  modalSubmitBtn: {
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 4,
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubmitText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;
