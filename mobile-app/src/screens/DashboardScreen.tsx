import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { removeApiKey } from '../lib/auth';
import { brandingService } from '../lib/branding';
import { Colors } from '../lib/colors';

export default function DashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const branding = brandingService.getBranding();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/operator/stats');
      setStats(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        await removeApiKey();
        navigation.replace('Login');
      } else {
        Alert.alert('Network Error', 'Could not load today\'s stats.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  return (
    <LinearGradient colors={[Colors.dark.background, '#1a1a2e', Colors.dark.background]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Terminal Active <View style={[styles.statusDot, { backgroundColor: Colors.success }]} /></Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={Colors.primary} />}
        >
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          
          <View style={styles.statsGrid}>
            <BlurView intensity={20} tint="dark" style={styles.statCardHalf}>
              <View style={styles.statInner}>
                <View style={[styles.iconBg, { backgroundColor: `${Colors.primary}26` }]}>
                  <Feather name="log-in" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{stats?.totalVehicles ?? 0}</Text>
                <Text style={styles.statLabel}>Check-ins</Text>
              </View>
            </BlurView>
            
            <BlurView intensity={20} tint="dark" style={styles.statCardHalf}>
              <View style={styles.statInner}>
                <View style={[styles.iconBg, { backgroundColor: `${Colors.success}26` }]}>
                  <Feather name="log-out" size={20} color={Colors.success} />
                </View>
                <Text style={styles.statValue}>{stats?.completedSessions ?? 0}</Text>
                <Text style={styles.statLabel}>Check-outs</Text>
              </View>
            </BlurView>
            
            <BlurView intensity={20} tint="dark" style={styles.statCardFull}>
              <LinearGradient colors={[`${Colors.success}14`, 'transparent']} style={styles.statInnerFull}>
                <View style={[styles.iconBg, { backgroundColor: `${Colors.success}26`, marginBottom: 12 }]}>
                  <Feather name="dollar-sign" size={24} color={Colors.success} />
                </View>
                <Text style={styles.statLabelFull}>Revenue Collected</Text>
                <Text style={styles.statValueFull}>Rs. {(stats?.totalRevenue ?? 0).toLocaleString()}</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('CheckIn')} style={styles.actionWrapper}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.actionCard}>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Vehicle Entry</Text>
                <Text style={styles.actionDesc}>Generate a new parking ticket</Text>
              </View>
              <View style={styles.actionIconWrapper}>
                <Ionicons name="car" size={32} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Scan')} style={styles.actionWrapper}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.actionCard}>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Scan & Checkout</Text>
                <Text style={styles.actionDesc}>Process payment via QR Code</Text>
              </View>
              <View style={styles.actionIconWrapper}>
                <Ionicons name="qr-code-outline" size={32} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('ManualExit')} style={styles.actionWrapper}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.actionCard}>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Manual Exit</Text>
                <Text style={styles.actionDesc}>Enter ticket number or plate</Text>
              </View>
              <View style={styles.actionIconWrapper}>
                <Feather name="edit-2" size={32} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('HistoryTab')} style={styles.actionWrapper}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.actionCard}>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Recent History</Text>
                <Text style={styles.actionDesc}>View active and paid tickets</Text>
              </View>
              <View style={styles.actionIconWrapper}>
                <Feather name="clock" size={32} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.dark.text, alignItems: 'center', flexDirection: 'row' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  date: { fontSize: 14, color: Colors.dark.textSecondary, marginTop: 4, fontWeight: '500' },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark.textSecondary, marginBottom: 16, letterSpacing: 0.5 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  statCardHalf: { flex: 1, minWidth: 140, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statInner: { padding: 20, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'flex-start' },
  iconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statValue: { color: Colors.dark.text, fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '600' },
  
  statCardFull: { width: '100%', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.success}33` },
  statInnerFull: { padding: 24, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center' },
  statLabelFull: { color: Colors.dark.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  statValueFull: { color: Colors.success, fontSize: 40, fontWeight: '900', textShadowColor: `${Colors.success}4D`, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  
  actionWrapper: { marginBottom: 16, marginHorizontal: 24, shadowColor: `${Colors.primary}4D`, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  actionCard: { borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionContent: { flex: 1 },
  actionTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  actionDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  actionIconWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
});
