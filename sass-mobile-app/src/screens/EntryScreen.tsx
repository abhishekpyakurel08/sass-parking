import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import {
  Car, Bike, Truck, ChevronLeft, CheckCircle2, ClipboardList,
  RefreshCcw, User, Ticket, ParkingCircle, Printer,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useParkingStore } from '../store/parkingStore';
import { useAuthStore } from '../store/authStore';
import type { VehicleType } from '../types/api.types';
import QRCode from 'react-native-qrcode-svg';
import RNPrint from 'react-native-print';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { ErrorBanner } from '../components/ErrorBanner';

const VEHICLE_TYPES: { type: VehicleType; label: string }[] = [
  { type: 'CAR',   label: 'Car' },
  { type: 'BIKE',  label: 'Bike' },
  { type: 'TRUCK', label: 'Truck' },
  { type: 'SUV',   label: 'SUV' },
  { type: 'BUS',   label: 'Bus' },
];

const VehicleIcon = ({ type, color, size }: { type: VehicleType; color: string; size: number }) => {
  if (type === 'BIKE') return <Bike color={color} size={size} />;
  if (type === 'TRUCK' || type === 'BUS' || type === 'SUV') return <Truck color={color} size={size} />;
  return <Car color={color} size={size} />;
};

const EntryScreen = () => {
  const navigation = useNavigation();
  const { checkIn, lastCheckIn, lastCheckInReceiptText, isLoading, error, clearError } = useParkingStore();
  const { user } = useAuthStore();
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!lastCheckInReceiptText) {
      Alert.alert('Print Error', 'No printable receipt text available.');
      return;
    }
    try {
      setIsPrinting(true);
      const html = `
        <html>
          <head>
            <style>
              body { font-family: monospace; font-size: 14px; white-space: pre; padding: 20px; }
            </style>
          </head>
          <body>${lastCheckInReceiptText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
        </html>
      `;
      await RNPrint.print({ html });
    } catch (err: any) {
      Alert.alert('Print Error', err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  // Redirect EXIT-only operators away
  useEffect(() => {
    if (user?.role === 'GATE_STAFF' && user?.gate_assignment === 'EXIT') {
      Alert.alert('Access Denied', 'You are not authorized to process vehicle entries.');
      navigation.goBack();
    }
  }, [user, navigation]);

  const [plate, setPlate]           = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [customerCode, setCustomerCode] = useState('');
  const [showCustomer, setShowCustomer] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCheckIn = async () => {
    try {
      clearError();
      await checkIn(plate, vehicleType, customerCode.trim() || undefined);
      setShowSuccess(true);
      setPlate('');
      setCustomerCode('');
    } catch (err: any) {
      Alert.alert('Check-In Failed', err.message);
    }
  };

  const handleReset = () => {
    setShowSuccess(false);
    setPlate('');
    setCustomerCode('');
    setVehicleType('CAR');
    setShowCustomer(false);
  };

  // ── SUCCESS MODAL ────────────────────────────────────────────────────────────
  if (showSuccess && lastCheckIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorBanner error={error} clearError={clearError} />
        <View style={styles.header}>
          <View style={styles.gateBadge}>
            <Text style={styles.gateBadgeText}>🟢 ENTRY GATE</Text>
          </View>
          <Text style={styles.headerTitle}>PARKSAAS</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.headerAction, { color: colors.success }]}>NEW</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={ZoomIn.springify()} style={styles.successCard}>
            <View style={styles.successBanner}>
              <CheckCircle2 color="#FFF" size={32} />
              <Text style={styles.successTitle}>VEHICLE CHECKED IN</Text>
              {lastCheckIn.isOffline && (
                <View style={styles.offlinePill}>
                  <Text style={styles.offlinePillText}>OFFLINE — WILL SYNC</Text>
                </View>
              )}
            </View>

            <View style={styles.ticketBody}>
              <View style={styles.plateBox}>
                <Text style={styles.plateText}>{lastCheckIn.license_plate}</Text>
              </View>

              <View style={styles.ticketInfoRow}>
                <View style={styles.ticketInfoCell}>
                  <Text style={styles.ticketInfoLabel}>VEHICLE TYPE</Text>
                  <Text style={styles.ticketInfoValue}>{lastCheckIn.vehicle_type}</Text>
                </View>
                <View style={styles.ticketInfoCell}>
                  <Text style={styles.ticketInfoLabel}>CHECK-IN TIME</Text>
                  <Text style={styles.ticketInfoValue}>
                    {new Date(lastCheckIn.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              <View style={styles.ticketIdRow}>
                <Ticket color={colors.textSecondary} size={14} />
                <Text style={styles.ticketIdText} numberOfLines={1}>
                  {lastCheckIn.ticket_number.length > 22
                    ? lastCheckIn.ticket_number.slice(0, 22) + '…'
                    : lastCheckIn.ticket_number}
                </Text>
              </View>

              {!lastCheckIn.isOffline && lastCheckIn.ticket_id && (
                <View style={styles.qrContainer}>
                  <QRCode value={lastCheckIn.ticket_id} size={120} backgroundColor="transparent" color={colors.text} />
                  <Text style={styles.qrLabel}>SCAN FOR EXIT</Text>
                </View>
              )}
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[styles.printBtn, isPrinting && { opacity: 0.6 }]}
            onPress={handlePrint}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Printer color={colors.text} size={20} style={{ marginRight: 10 }} />
                <Text style={styles.printBtnText}>PRINT TICKET</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.newEntryButton} onPress={handleReset}>
            <ParkingCircle color="#FFF" size={20} style={{ marginRight: 10 }} />
            <Text style={styles.newEntryText}>NEXT VEHICLE</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── FORM ─────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ErrorBanner error={error} clearError={clearError} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <View style={styles.gateBadge}>
          <Text style={styles.gateBadgeText}>🟢 ENTRY GATE</Text>
        </View>
        <Text style={styles.headerTitle}>PARKSAAS</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.duration(350)} style={styles.formCard}>
            <Text style={styles.formTitle}>New Vehicle Entry</Text>
            <Text style={styles.formSub}>
              {user?.ticket_prefix ? `Ticket Prefix: ${user.ticket_prefix}` : 'Prefix auto-assigned'}
            </Text>

            {/* Vehicle Type */}
            <Text style={styles.fieldLabel}>VEHICLE TYPE</Text>
            <View style={styles.vehicleGrid}>
              {VEHICLE_TYPES.map(v => {
                const active = vehicleType === v.type;
                return (
                  <TouchableOpacity
                    key={v.type}
                    style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                    onPress={() => setVehicleType(v.type)}
                  >
                    <VehicleIcon
                      type={v.type}
                      color={active ? '#FFF' : colors.textSecondary}
                      size={24}
                    />
                    <Text style={[styles.vehicleLabel, active && styles.vehicleLabelActive]}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* License Plate */}
            <Text style={styles.fieldLabel}>LICENSE PLATE (OPTIONAL)</Text>
            <View style={styles.plateInput}>
              <TextInput
                style={styles.plateTextInput}
                value={plate}
                onChangeText={t => setPlate(t.toUpperCase())}
                placeholder="e.g. BA-12-PA-3456"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Customer Code (expandable) */}
            <TouchableOpacity
              style={styles.customerToggle}
              onPress={() => setShowCustomer(!showCustomer)}
            >
              <User color={showCustomer ? colors.primary : colors.textSecondary} size={16} />
              <Text style={[styles.customerToggleText, showCustomer && { color: colors.primary }]}>
                {showCustomer ? 'Hide Customer Code' : 'Add Customer Code (for discount)'}
              </Text>
            </TouchableOpacity>

            {showCustomer && (
              <Animated.View entering={FadeInDown.duration(200)}>
                <View style={styles.plateInput}>
                  <TextInput
                    style={styles.plateTextInput}
                    value={customerCode}
                    onChangeText={setCustomerCode}
                    placeholder="Enter customer loyalty code"
                    placeholderTextColor={colors.textSecondary}
                    autoCorrect={false}
                  />
                </View>
              </Animated.View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && { opacity: 0.6 }]}
              onPress={handleCheckIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <ParkingCircle color="#FFF" size={20} style={{ marginRight: 10 }} />
                  <Text style={styles.submitText}>GENERATE TICKET & OPEN GATE</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Stats Strip */}
          <Animated.View entering={FadeInDown.delay(150).duration(350)} style={styles.statsStrip}>
            <View style={styles.statItem}>
              <ClipboardList color={colors.textSecondary} size={16} />
              <Text style={styles.statLabel}>ENTRY GATE OPERATOR</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <RefreshCcw color={colors.textSecondary} size={16} />
              <Text style={styles.statLabel}>{user?.name ?? 'Operator'}</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  header:            {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle:       { color: colors.textSecondary, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  headerAction:      { fontSize: 13, fontWeight: 'bold' },
  gateBadge:         {
    backgroundColor: colors.success + '20',
    borderWidth: 1, borderColor: colors.success,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
  },
  gateBadgeText:     { color: colors.success, fontSize: 11, fontWeight: 'bold' },
  content:           { padding: 16, paddingBottom: 40 },

  // Form
  formCard:          {
    backgroundColor: colors.card, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16,
  },
  formTitle:         { color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  formSub:           { color: colors.textSecondary, fontSize: 12, marginBottom: 20 },
  fieldLabel:        { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  vehicleGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  vehicleCard:       {
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    width: 72, paddingVertical: 12, borderRadius: 6,
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
  },
  vehicleCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  vehicleLabel:      { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginTop: 6 },
  vehicleLabelActive:{ color: '#FFF' },
  plateInput:        {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 4, paddingHorizontal: 14, height: 50, marginBottom: 16,
  },
  plateTextInput:    { flex: 1, color: colors.text, fontSize: 18, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 3 },
  customerToggle:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  customerToggleText:{ color: colors.textSecondary, fontSize: 13 },
  submitButton:      {
    backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', height: 52, borderRadius: 6, marginTop: 12,
  },
  submitText:        { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

  // Stats strip
  statsStrip:        {
    backgroundColor: colors.card, borderRadius: 6, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', padding: 14,
  },
  statItem:          { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statDivider:       { width: 1, height: 20, backgroundColor: colors.border },
  statLabel:         { color: colors.textSecondary, fontSize: 11, fontWeight: 'bold' },

  // Success card
  successCard:       { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 20, overflow: 'hidden' },
  successBanner:     { backgroundColor: colors.success, padding: 20, alignItems: 'center', gap: 8 },
  successTitle:      { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
  offlinePill:       { backgroundColor: '#FBBF24', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  offlinePillText:   { color: '#000', fontSize: 10, fontWeight: 'bold' },
  ticketBody:        { padding: 20 },
  plateBox:          {
    backgroundColor: '#FFF', borderRadius: 4, padding: 14,
    alignItems: 'center', marginBottom: 16, elevation: 4,
  },
  plateText:         { color: '#000', fontSize: 26, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 4 },
  ticketInfoRow:     { flexDirection: 'row', marginBottom: 12 },
  ticketInfoCell:    { flex: 1 },
  ticketInfoLabel:   { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  ticketInfoValue:   { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  ticketIdRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  ticketIdText:      { color: colors.textSecondary, fontSize: 11, fontFamily: 'monospace', flex: 1 },
  qrContainer:       { alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  qrLabel:           { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginTop: 10, letterSpacing: 1 },
  newEntryButton:    {
    backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', height: 52, borderRadius: 6,
  },
  newEntryText:      { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  printBtn:          {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 6, marginBottom: 12,
  },
  printBtnText:      { color: colors.text, fontSize: 15, fontWeight: 'bold' },
});

export default EntryScreen;
