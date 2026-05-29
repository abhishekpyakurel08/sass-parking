import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { RefreshCcw, CarFront, CheckCircle2, Banknote, Scan, ArrowRight, ParkingCircle, LogOut, CloudUpload } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useParkingStore } from '../store/parkingStore';
import { useAuthStore } from '../store/authStore';
import type { Ticket } from '../types/api.types';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ErrorBanner } from '../components/ErrorBanner';

const statusColor: Record<string, string> = {
  ACTIVE: colors.success,
  PENDING_PAYMENT: '#FDBA74',
  PAID: colors.textSecondary,
  EXPIRED: colors.danger,
  LOST: colors.danger,
};

const TicketRow = ({ ticket, index }: { ticket: Ticket, index: number }) => (
  <Animated.View entering={FadeInDown.delay(100 * index).springify()} style={styles.activityItem}>
    <View style={styles.plateBadge}>
      <Text style={styles.plateText} numberOfLines={1}>{ticket.license_plate}</Text>
    </View>
    <View style={styles.activityDetails}>
      <Text style={styles.activityTitle}>{ticket.status === 'ACTIVE' ? 'Check-in' : ticket.status === 'PAID' ? 'Check-out' : ticket.status}</Text>
      <Text style={styles.activityTime}>{new Date(ticket.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
    <View style={[styles.statusBadge, { backgroundColor: statusColor[ticket.status] + '30' }]}>
      <Text style={[styles.statusBadgeText, { color: statusColor[ticket.status] }]}>{ticket.status}</Text>
    </View>
  </Animated.View>
);

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { stats, recentTickets, isLoadingStats, fetchDashboard, offlineQueueCount, isSyncing, syncOfflineQueue, error, clearError } = useParkingStore();
  const { user, logout } = useAuthStore();

  useEffect(() => { 
    fetchDashboard(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          await logout();
          // Navigation to Login is handled automatically by AppNavigator
        }},
    ]);
  };

  const onRefresh = useCallback(() => { 
    fetchDashboard(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtRevenue = (n: number) => {
    if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)}k`;
    return `Rs. ${n.toFixed(0)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ErrorBanner error={error} clearError={clearError} />
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <RefreshCcw color={colors.primary} size={20} />
          <Text style={styles.logoText}>PARKSAAS</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut color={colors.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoadingStats} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Terminal Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={[
          styles.terminalCard,
          user?.gate_assignment === 'ENTRY' && styles.terminalEntry,
          user?.gate_assignment === 'EXIT' && styles.terminalExit,
          user?.gate_assignment === 'BOTH' && styles.terminalBoth,
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[
              styles.terminalIndicator,
              user?.gate_assignment === 'ENTRY' && { backgroundColor: colors.success },
              user?.gate_assignment === 'EXIT' && { backgroundColor: '#EF4444' },
              user?.gate_assignment === 'BOTH' && { backgroundColor: colors.primary },
            ]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.terminalTitle}>
                {user?.gate_assignment === 'ENTRY' && '🟢 ENTRY GATE TERMINAL'}
                {user?.gate_assignment === 'EXIT' && '🔴 EXIT GATE TERMINAL'}
                {user?.gate_assignment === 'BOTH' && '🔵 DUAL GATE TERMINAL'}
                {!user?.gate_assignment && '⚫ GENERAL OPERATOR CONSOLE'}
              </Text>
              <Text style={styles.terminalSub}>
                {user?.gate_assignment === 'ENTRY' && 'Authorized for vehicle entry registrations & ticket creation.'}
                {user?.gate_assignment === 'EXIT' && 'Authorized for vehicle checkouts & payment processing.'}
                {user?.gate_assignment === 'BOTH' && 'Full dual access for entry and checkout operations.'}
                {!user?.gate_assignment && 'General access operator console.'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Operator Status */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.operatorCard}>
          <View>
            <Text style={styles.label}>ACTIVE OPERATOR</Text>
            <Text style={styles.operatorName}>{user?.name ?? 'Operator'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {offlineQueueCount > 0 ? (
              <TouchableOpacity style={styles.offlineBadge} onPress={syncOfflineQueue} disabled={isSyncing}>
                {isSyncing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <CloudUpload color="#FFF" size={12} style={{ marginRight: 4 }} />
                    <Text style={styles.offlineText}>{offlineQueueCount} PENDING</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineText}>ONLINE</Text>
              </View>
            )}
            <Text style={styles.roleText}>{user?.role?.replace('_', ' ')}</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        {user?.gate_assignment !== 'EXIT' && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <TouchableOpacity style={styles.checkInButton} onPress={() => navigation.navigate('Entry' as never)}>
              <ParkingCircle color="#FFF" size={32} style={{ marginBottom: 8 }} />
              <Text style={styles.actionButtonText}>CHECK IN VEHICLE</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {user?.gate_assignment !== 'ENTRY' && (
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Exit' as never)}>
              <Scan color="#FFF" size={32} style={{ marginBottom: 8 }} />
              <Text style={[styles.actionButtonText, { color: '#FFF' }]}>SCAN TO CHECK OUT</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Shift Overview */}
        <Text style={styles.sectionTitle}>SHIFT OVERVIEW</Text>

        {isLoadingStats && !stats ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            {user?.gate_assignment === 'ENTRY' && (
              <View style={styles.statsRow}>
                <View style={[styles.overviewCard, { flex: 1, marginBottom: 0 }]}>
                  <View style={styles.overviewHeader}>
                    <Text style={styles.label}>CHECK-INS TODAY</Text>
                    <CarFront color={colors.success} size={20} />
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.success }]}>
                    {stats?.totalVehicles ?? 0}
                  </Text>
                </View>
                <View style={[styles.overviewCard, { flex: 1, marginLeft: 12, marginBottom: 0 }]}>
                  <View style={styles.overviewHeader}>
                    <Text style={styles.label}>ACTIVE VEHICLES</Text>
                    <ParkingCircle color={colors.primary} size={20} />
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.primary }]}>
                    {Math.max(0, (stats?.totalVehicles ?? 0) - (stats?.completedSessions ?? 0))}
                  </Text>
                </View>
              </View>
            )}

            {user?.gate_assignment === 'EXIT' && (
              <View style={styles.statsRow}>
                <View style={[styles.overviewCard, { flex: 1, marginBottom: 0 }]}>
                  <View style={styles.overviewHeader}>
                    <Text style={styles.label}>CHECK-OUTS TODAY</Text>
                    <CheckCircle2 color="#FDBA74" size={20} />
                  </View>
                  <Text style={[styles.overviewValue, { color: '#FDBA74' }]}>
                    {stats?.completedSessions ?? 0}
                  </Text>
                </View>
                <View style={[styles.overviewCard, { flex: 1, marginLeft: 12, marginBottom: 0 }]}>
                  <View style={styles.overviewHeader}>
                    <Text style={styles.label}>TOTAL REVENUE</Text>
                    <Banknote color={colors.success} size={20} />
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.success }]}>
                    {fmtRevenue(stats?.totalRevenue ?? 0)}
                  </Text>
                </View>
              </View>
            )}

            {(user?.gate_assignment === 'BOTH' || !user?.gate_assignment) && (
              <>
                <View style={styles.statsRow}>
                  <View style={[styles.overviewCard, { flex: 1 }]}>
                    <View style={styles.overviewHeader}>
                      <Text style={styles.label}>VEHICLES TODAY</Text>
                      <CarFront color={colors.success} size={20} />
                    </View>
                    <Text style={[styles.overviewValue, { color: colors.success }]}>
                      {stats?.totalVehicles ?? 0}
                    </Text>
                  </View>
                  <View style={[styles.overviewCard, { flex: 1, marginLeft: 12 }]}>
                    <View style={styles.overviewHeader}>
                      <Text style={styles.label}>SESSIONS DONE</Text>
                      <CheckCircle2 color="#FDBA74" size={20} />
                    </View>
                    <Text style={[styles.overviewValue, { color: '#FDBA74' }]}>
                      {stats?.completedSessions ?? 0}
                    </Text>
                  </View>
                </View>
                <View style={styles.overviewCard}>
                  <View style={styles.overviewHeader}>
                    <Text style={styles.label}>TOTAL REVENUE</Text>
                    <Banknote color={colors.primary} size={20} />
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.primary }]}>
                    {fmtRevenue(stats?.totalRevenue ?? 0)}
                  </Text>
                </View>
              </>
            )}
          </Animated.View>
        )}

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => navigation.navigate('History' as never)}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
              <ArrowRight color={colors.primary} size={14} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            {recentTickets.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>No activity yet today</Text>
              </View>
            ) : (
              recentTickets.slice(0, 5).map((ticket, i) => (
                <View key={ticket._id} style={i === Math.min(recentTickets.length, 5) - 1 ? { borderBottomWidth: 0 } : {}}>
                  <TicketRow ticket={ticket} index={i} />
                </View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoContainer:   { flexDirection: 'row', alignItems: 'center' },
  logoText:        { color: colors.textSecondary, fontSize: 18, fontWeight: 'bold', marginLeft: 8, letterSpacing: 1 },
  scrollContent:   { padding: 20, paddingBottom: 40 },
  operatorCard:    { backgroundColor: colors.card, borderRadius: 4, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  label:           { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  operatorName:    { color: colors.text, fontSize: 18 },
  onlineBadge:     { backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2, marginBottom: 4 },
  onlineText:      { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  offlineBadge:    { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
  offlineText:     { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  roleText:        { color: colors.textSecondary, fontSize: 10 },
  gateText:        { color: colors.primary, fontSize: 9, fontWeight: 'bold', marginTop: 2, letterSpacing: 0.5 },
  checkInButton:   { backgroundColor: colors.primary, borderRadius: 4, padding: 24, alignItems: 'center', marginBottom: 12 },
  scanButton:      { backgroundColor: colors.secondary, borderRadius: 4, padding: 24, alignItems: 'center', marginBottom: 32 },
  actionButtonText:{ color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  sectionTitle:    { color: colors.text, fontSize: 14, marginBottom: 12 },
  overviewCard:    { backgroundColor: colors.card, borderRadius: 4, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  overviewHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  overviewValue:   { fontSize: 36, fontWeight: 'bold' },
  statsRow:        { flexDirection: 'row', marginBottom: 12 },
  activityHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  viewAllText:     { color: colors.primary, fontSize: 12, fontWeight: 'bold' },
  activityCard:    { backgroundColor: colors.card, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  activityItem:    { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  plateBadge:      { backgroundColor: colors.accent + '30', borderWidth: 1, borderColor: colors.accent, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, width: 80, alignItems: 'center' },
  plateText:       { color: colors.text, fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' },
  activityDetails: { flex: 1, marginLeft: 16 },
  activityTitle:   { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  activityTime:    { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  statusBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 9, fontWeight: 'bold' },
  // Terminal banner styles
  terminalCard:    { borderRadius: 6, padding: 14, borderWidth: 1, marginBottom: 14, borderColor: colors.border, backgroundColor: colors.card },
  terminalEntry:   { borderColor: colors.success, borderLeftWidth: 3 },
  terminalExit:    { borderColor: '#EF4444', borderLeftWidth: 3 },
  terminalBoth:    { borderColor: colors.primary, borderLeftWidth: 3 },
  terminalIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textSecondary, marginTop: 2 },
  terminalTitle:   { color: colors.text, fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 2 },
  terminalSub:     { color: colors.textSecondary, fontSize: 11 },
});

export default DashboardScreen;
