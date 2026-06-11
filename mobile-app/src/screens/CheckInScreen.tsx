import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';

const VEHICLES = [
  { id: 'CAR', icon: 'car-outline', label: 'Car' },
  { id: 'BIKE', icon: 'bicycle-outline', label: 'Bike' },
  { id: 'SUV', icon: 'car-sport-outline', label: 'SUV' },
  { id: 'TRUCK', icon: 'bus-outline', label: 'Truck / Bus' },
];

export default function CheckInScreen({ navigation }: any) {
  const [vehicleType, setVehicleType] = useState('CAR');
  const [licensePlate, setLicensePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const res = await api.post('/operator/check-in', {
        vehicle_type: vehicleType,
        license_plate: licensePlate.trim() || undefined
      });
      setTicket(res.data.ticket);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (ticket) {
    return (
      <LinearGradient colors={['#0B0F0E', '#0F1412']} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Feather name="x" size={24} color="#F4F6F4" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ticket Issued</Text>
            <View style={{width: 40}} />
          </View>
          
          <View style={styles.successView}>
            <View style={styles.ticketCardWrapper}>
              <View style={styles.ticketHoleLeft} />
              <View style={styles.ticketHoleRight} />
              
              <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Ionicons name="checkmark-circle" size={48} color="#34D399" />
                  <Text style={styles.ticketTitle}>Success</Text>
                </View>
                
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code" size={100} color="#0B0F0E" />
                  <Text style={styles.qrText}>QR: {ticket.ticket_number}</Text>
                </View>
                
                <Text style={styles.ticketCode}>{ticket.ticket_number}</Text>
                <View style={styles.ticketDivider} />
                
                <View style={styles.ticketRow}>
                  <View>
                    <Text style={styles.ticketLabel}>Vehicle</Text>
                    <Text style={styles.ticketValue}>{ticket.vehicle_type}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.ticketLabel}>Plate</Text>
                    <Text style={styles.ticketValue}>{ticket.license_plate || 'N/A'}</Text>
                  </View>
                </View>
                
                <View style={[styles.ticketRow, { marginTop: 16 }]}>
                  <View>
                    <Text style={styles.ticketLabel}>Entry Time</Text>
                    <Text style={styles.ticketValue}>{new Date(ticket.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.ticketLabel}>Date</Text>
                    <Text style={styles.ticketValue}>{new Date(ticket.check_in_time).toLocaleDateString()}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <TouchableOpacity style={styles.button} onPress={() => { setTicket(null); setLicensePlate(''); }}>
              <LinearGradient colors={['#34D399', '#10B981']} style={styles.gradientBtn}>
                <Text style={styles.buttonText}>New Check-In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0B0F0E', '#0F1412']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={24} color="#F4F6F4" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Entry</Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>SELECT VEHICLE TYPE</Text>
          <View style={styles.grid}>
            {VEHICLES.map(v => {
              const isActive = vehicleType === v.id;
              return (
                <TouchableOpacity 
                  key={v.id} 
                  activeOpacity={0.7}
                  style={[styles.typeBtn, isActive && styles.typeBtnActive]}
                  onPress={() => setVehicleType(v.id)}
                >
                  <Ionicons name={v.icon as any} size={32} color={isActive ? '#fff' : '#9DAFA8'} />
                  <Text style={[styles.typeText, isActive && styles.typeTextActive]}>{v.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 32 }]}>LICENSE PLATE (OPTIONAL)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="car-sport" size={20} color="#9DAFA8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. BA 1 PA 1234"
              placeholderTextColor="#9DAFA8"
              value={licensePlate}
              onChangeText={setLicensePlate}
              autoCapitalize="characters"
            />
          </View>

          <View style={{ flex: 1 }} />
          
          <TouchableOpacity style={styles.button} onPress={handleCheckIn} disabled={loading}>
            <LinearGradient colors={['#34D399', '#10B981']} style={styles.gradientBtn}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.buttonText}>Generate Ticket</Text>
                  <Feather name="printer" size={20} color="#fff" />
                </>
              )}
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
  content: { padding: 24, flexGrow: 1 },
  label: { color: '#9DAFA8', fontSize: 12, fontWeight: '800', marginBottom: 16, letterSpacing: 1 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  typeBtn: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.04)', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#34D399', borderColor: '#34D399', shadowColor: 'rgba(52,211,153,0.4)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  typeText: { color: '#9DAFA8', fontWeight: '600', fontSize: 14, marginTop: 12 },
  typeTextActive: { color: '#fff', fontWeight: '700' },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24 },
  inputIcon: { paddingLeft: 16 },
  input: { flex: 1, color: '#F4F6F4', padding: 16, fontSize: 18, fontWeight: '700' },
  
  button: { borderRadius: 16, overflow: 'hidden', marginTop: 'auto', shadowColor: 'rgba(52,211,153,0.4)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  gradientBtn: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  
  successView: { flex: 1, padding: 24, justifyContent: 'space-between' },
  ticketCardWrapper: { position: 'relative', marginTop: 20 },
  ticketCard: { borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10 },
  ticketHoleLeft: { position: 'absolute', top: 180, left: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: '#0B0F0E', zIndex: 10 },
  ticketHoleRight: { position: 'absolute', top: 180, right: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: '#0B0F0E', zIndex: 10 },
  ticketHeader: { alignItems: 'center', marginBottom: 24 },
  ticketTitle: { fontSize: 24, fontWeight: '800', color: '#0B0F0E', marginTop: 8 },
  qrPlaceholder: { width: 160, height: 160, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0' },
  qrText: { color: '#9DAFA8', fontWeight: '700', fontSize: 12, marginTop: 8 },
  ticketCode: { fontSize: 36, fontWeight: '900', color: '#0B0F0E', marginBottom: 24, letterSpacing: 4 },
  ticketDivider: { width: '100%', height: 2, backgroundColor: '#e2e8f0', borderStyle: 'dashed', marginBottom: 24 },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  ticketLabel: { fontSize: 12, color: '#9DAFA8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  ticketValue: { fontSize: 18, color: '#0B0F0E', fontWeight: '800' },
});
