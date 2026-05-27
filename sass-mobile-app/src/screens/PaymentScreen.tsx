import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { RefreshCcw, CircleUser, Banknote, CreditCard, DoorOpen, ChevronLeft, ScanLine } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useParkingStore } from '../store/parkingStore';
import type { PaymentMethod } from '../types/api.types';
import RNPrint from 'react-native-print';

// Helper to format minutes → "2h 30m"
const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();

  // ticket_id can be passed from ScannerScreen; fallback to scannedTicket in store
  const passedTicketId: string | undefined = (route.params as any)?.ticket_id;

  const {
    scannedTicket, checkoutSummary, paymentReceipt,
    isLoading, scanTicket, checkOut, processPayment,
    clearScanned, clearCheckout, clearPayment, clearError,
  } = useParkingStore();

  const [scanCode, setScanCode]             = useState(passedTicketId ?? '');
  const [payMethod, setPayMethod]           = useState<PaymentMethod>('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [step, setStep]                     = useState<'scan' | 'payment' | 'done'>('scan');

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

  const doPayment = async () => {
    const summary = checkoutSummary ?? (scannedTicket?.status === 'PENDING_PAYMENT' ? scannedTicket : null);
    if (!summary) return;

    const ticketId = (checkoutSummary?.ticket_id ?? scannedTicket?.ticket_id)!;
    const totalDue = checkoutSummary?.total_amount ?? (scannedTicket as any)?.fare_amount ?? 0;

    if (payMethod === 'CASH') {
      const received = parseFloat(amountReceived);
      if (isNaN(received) || received < totalDue) {
        Alert.alert('Insufficient Amount', `Minimum Rs. ${totalDue} required`);
        return;
      }
    }

    try {
      clearError();
      await processPayment(ticketId, payMethod, payMethod === 'CASH' ? parseFloat(amountReceived) : undefined);
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
    return (
      <SafeAreaView style={styles.container}>
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
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, { alignItems: 'center', gap: 12 }]}>
            <View style={{ backgroundColor: colors.success + '30', borderRadius: 50, padding: 16 }}>
              <DoorOpen color={colors.success} size={40} />
            </View>
            <Text style={{ color: colors.success, fontSize: 22, fontWeight: 'bold' }}>Gate Open!</Text>
            <Text style={{ color: colors.text, fontSize: 18 }}>Payment Confirmed</Text>
            <View style={styles.plateDisplay}>
              <Text style={styles.plateText}>{checkoutSummary?.license_plate ?? scannedTicket?.license_plate}</Text>
            </View>
            <Text style={{ color: colors.textSecondary }}>Total Paid: <Text style={{ color: colors.success, fontWeight: 'bold' }}>Rs. {paymentReceipt.total_due}</Text></Text>
            {paymentReceipt.change_given != null && paymentReceipt.change_given > 0 && (
              <Text style={{ color: '#FDBA74' }}>Change: Rs. {paymentReceipt.change_given.toFixed(2)}</Text>
            )}
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.confirmButton, { flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]} 
                onPress={async () => {
                  try {
                    const html = `
                      <html>
                        <head><style>body { font-family: monospace; font-size: 16px; margin: 20px; white-space: pre-wrap; }</style></head>
                        <body>${paymentReceipt.printable_text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
                      </html>
                    `;
                    await RNPrint.print({ html });
                  } catch (err: any) {
                    Alert.alert('Print Error', err.message);
                  }
                }}
              >
                <Text style={[styles.confirmButtonText, { color: colors.text }]}>PRINT RECEIPT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, { flex: 1 }]} onPress={resetAll}>
                <Text style={styles.confirmButtonText}>NEXT VEHICLE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SCAN ──────────────────────────────────────────────────────────────────
  if (step === 'scan') {
    return (
      <SafeAreaView style={styles.container}>
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
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PAYMENT ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
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

          <TouchableOpacity style={styles.penaltyLinkContainer}>
            <Text style={styles.penaltyLinkText}>Lost Ticket? Apply Penalty</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});

export default PaymentScreen;
