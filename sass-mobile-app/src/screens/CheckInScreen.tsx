import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Modal, Image
} from 'react-native';
import { RefreshCcw, CircleUser, Car, Bike, Truck, Ticket, ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useParkingStore } from '../store/parkingStore';
import type { VehicleType } from '../types/api.types';
import QRCode from 'react-native-qrcode-svg';

type Category = { type: VehicleType; label: string; icon: React.ReactNode };

const CATEGORIES: Category[] = [
  { type: 'CAR',  label: 'CAR',  icon: null },
  { type: 'BIKE', label: 'BIKE', icon: null },
  { type: 'VAN',  label: 'VAN',  icon: null },
];

const CheckInScreen = () => {
  const navigation = useNavigation();
  const { checkIn, lastCheckIn, isLoading, clearError } = useParkingStore();

  const [plate, setPlate]           = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [customerCode, setCustomerCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCheckIn = async () => {
    if (!plate.trim()) {
      Alert.alert('Missing License Plate', 'Please enter a license plate number.');
      return;
    }
    try {
      clearError();
      await checkIn(plate.trim().toUpperCase(), vehicleType, customerCode.trim() || undefined);
      setShowSuccess(true);
      setPlate('');
      setCustomerCode('');
    } catch (err: any) {
      Alert.alert('Check-In Failed', err.message);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    navigation.goBack();
  };

  const CategoryButton = ({ item }: { item: Category }) => {
    const active = vehicleType === item.type;
    const Icon = item.type === 'CAR' ? Car : item.type === 'BIKE' ? Bike : Truck;
    return (
      <TouchableOpacity
        style={[styles.categoryCard, active && styles.categoryCardActive]}
        onPress={() => setVehicleType(item.type)}
      >
        <Icon color={active ? '#FFF' : colors.textSecondary} size={24} style={{ marginBottom: 8 }} />
        <Text style={active ? styles.categoryTextActive : styles.categoryText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <ChevronLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <RefreshCcw color={colors.primary} size={20} />
          <Text style={styles.logoText}>PARKSAAS</Text>
        </View>
        <CircleUser color={colors.textSecondary} size={24} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Vehicle Check-In</Text>
          <Text style={styles.subtitle}>Register new entry</Text>

          {/* License Plate */}
          <Text style={styles.labelBlue}>LICENSE PLATE</Text>
          <View style={styles.plateInputContainer}>
            <TextInput
              style={styles.plateInput}
              placeholder="ENTER PLATE"
              placeholderTextColor="#333"
              autoCapitalize="characters"
              value={plate}
              onChangeText={(t) => setPlate(t.toUpperCase())}
              maxLength={12}
            />
            <Car color={colors.textSecondary} size={24} />
          </View>
          <View style={styles.ocrRow}>
            <Text style={styles.ocrText}>MANUAL ENTRY</Text>
            {plate.length >= 4 && <Text style={styles.validatedText}>VALIDATED</Text>}
          </View>

          {/* Vehicle Category */}
          <Text style={styles.labelBlue}>VEHICLE CATEGORY</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((item) => <CategoryButton key={item.type} item={item} />)}
          </View>

          {/* Customer Code */}
          <Text style={styles.labelBlue}>CUSTOMER CODE (OPTIONAL)</Text>
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="SCAN OR TYPE CODE"
              placeholderTextColor={colors.textSecondary}
              value={customerCode}
              onChangeText={setCustomerCode}
              autoCapitalize="characters"
            />
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, isLoading && { opacity: 0.6 }]}
            onPress={handleCheckIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.generateButtonText}>GENERATE TICKET</Text>
                <Ticket color="#FFF" size={20} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccess} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <CheckCircle2 color={colors.success} size={48} />
              <Text style={styles.modalTitle}>Check-In Successful</Text>
              {lastCheckIn?.isOffline && (
                <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
                  (Offline Mode — Synced Later)
                </Text>
              )}
            </View>

            <View style={styles.qrContainer}>
              {lastCheckIn?.isOffline || !lastCheckIn?.qr_code_url ? (
                <QRCode
                  value={lastCheckIn?.ticket_number || 'UNKNOWN'}
                  size={150}
                />
              ) : (
                <Image
                  source={{ uri: lastCheckIn.qr_code_url }}
                  style={{ width: 150, height: 150 }}
                />
              )}
            </View>
            
            <View style={styles.ticketDetailsBox}>
              <Text style={styles.ticketDetailsText}>
                Ticket: #{lastCheckIn?.ticket_number?.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.ticketDetailsText}>
                Plate: {lastCheckIn?.license_plate}
              </Text>
              <Text style={styles.ticketDetailsText}>
                Time: {lastCheckIn?.check_in_time ? new Date(lastCheckIn.check_in_time).toLocaleTimeString() : ''}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseSuccess}>
              <Text style={styles.closeBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: colors.background },
  header:               { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoContainer:        { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoText:             { color: colors.primary, fontSize: 18, fontWeight: 'bold', marginLeft: 8, letterSpacing: 1 },
  content:              { padding: 20, paddingBottom: 40 },
  title:                { color: colors.text, fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle:             { color: colors.textSecondary, fontSize: 14, marginBottom: 32 },
  labelBlue:            { color: colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  plateInputContainer:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 16, height: 72 },
  plateInput:           { flex: 1, color: colors.text, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 4 },
  ocrRow:               { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 16 },
  ocrText:              { color: colors.textSecondary, fontSize: 10, letterSpacing: 0.5 },
  validatedText:        { color: colors.success, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  categoryRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  categoryCard:         { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 16, alignItems: 'center', justifyContent: 'center' },
  categoryCardActive:   { backgroundColor: colors.secondary, borderColor: colors.secondary },
  categoryText:         { color: colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
  categoryTextActive:   { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  codeInputContainer:   { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 16, height: 48, justifyContent: 'center', marginBottom: 32 },
  codeInput:            { color: colors.text, fontSize: 14 },
  generateButton:       { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 4 },
  generateButtonText:   { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent:         { width: '100%', backgroundColor: colors.card, borderRadius: 16, padding: 24, alignItems: 'center' },
  modalTitle:           { color: colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 12 },
  qrContainer:          { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 20 },
  ticketDetailsBox:     { width: '100%', backgroundColor: colors.inputBg, padding: 16, borderRadius: 8, marginBottom: 24 },
  ticketDetailsText:    { color: colors.text, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  closeBtn:             { width: '100%', backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
  closeBtnText:         { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default CheckInScreen;
