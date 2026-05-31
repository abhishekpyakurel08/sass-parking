import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { CarFront, CheckCircle2, Banknote, Scan, ArrowRight, ParkingCircle, LogOut, CloudUpload, TrendingUp } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { sw, sf } from '../theme/responsive';
import { useNavigation } from '@react-navigation/native';
import { useParkingStore } from '../store/parkingStore';
import { useAuthStore } from '../store/authStore';
import type { Ticket } from '../types/api.types';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ErrorBanner } from '../components/ErrorBanner';

const statusColor: Record<string, string> = {
  ACTIVE:          colors.success,
  PENDING_PAYMENT: colors.warning,
  PAID:            colors.textSecondary,
  EXPIRED:         colors.danger,
  LOST:            colors.danger,
};

const statusBg: Record<string, string> = {
  ACTIVE:          colors.successBg,
  PENDING_PAYMENT: colors.warningBg,
  PAID:            colors.inputBg,
  EXPIRED:         colors.dangerBg,
  LOST:            colors.dangerBg,
};

const TicketRow = ({ ticket, index }: { ticket: Ticket, index: number }) => (
  <Animated.View entering={FadeInDown.delay(80 * index).springify()} style={styles.activityItem}>
    <View style={styles.plateBadge}>
      <Text style={styles.plateText} numberOfLines={1}>{ticket.license_plate}</Text>
    </View>
    <View style={styles.activityDetails}>
      <Text style={styles.activityTitle}>
        {ticket.status === 'ACTIVE' ? 'Checked In' : ticket.status === 'PAID' ? 'Checked Out' : ticket.status}
      </Text>
      <Text style={styles.activityTime}>
        {new Date(ticket.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
    <View style={[styles.statusBadge, { backgroundColor: statusBg[ticket.status] ?? colors.inputBg }]}>
      <Text style={[styles.statusBadgeText, { color: statusColor[ticket.status] ?? colors.textSecondary }]}>
        {ticket.status === 'PENDING_PAYMENT' ? 'PENDING' : ticket.status}
      </Text>
    </View>
  </Animated.View>
);

const StatCard = ({ label, value, color, icon: Icon, delay = 0 }: {
  label: string; value: string | number; color: string; icon: any; delay?: number;
}) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
      <Icon color={color} size={20} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
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
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); } },
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

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.userName}>{user?.name ?? 'Operator'}</Text>
        </View>
        <View style={styles.headerRight}>
          {offlineQueueCount > 0 ? (
            <TouchableOpacity style={styles.syncBadge} onPress={syncOfflineQueue} disabled={isSyncing}>
              {isSyncing
                ? <ActivityIndicator color="#FFF" size="small" />
                : <><CloudUpload color="#FFF" size={14} /><Text style={styles.syncText}> {offlineQueueCount}</Text></>
              }
            </TouchableOpacity>
          ) : (
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoadingStats} onRefresh={onRefresh} tintColor={colors.primary} />}
      >

        {/* ── Stats Row ───────────────────────────────────────────────── */}
        {isLoadingStats && !stats ? (
          <ActivityIndicator color={colors.primary} style={styles.loadingSpinner} />
        ) : (
          <View style={styles.statsRow}>
            {user?.gate_assignment !== 'EXIT' && (
              <StatCard
                label="Check-ins"
                value={stats?.totalVehicles ?? 0}
                color={colors.success}
                icon={CarFront}
                delay={50}
              />
            )}
            {user?.gate_assignment !== 'ENTRY' && (
              <StatCard
                label="Check-outs"
                value={stats?.completedSessions ?? 0}
                color={colors.warning}
                icon={CheckCircle2}
                delay={100}
              />
            )}
            <StatCard
              label="Revenue"
              value={fmtRevenue(stats?.totalRevenue ?? 0)}
              color={colors.primary}
              icon={Banknote}
              delay={150}
            />
          </View>
        )}

        {/* ── Quick Actions ───────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsRow}>
          {user?.gate_assignment !== 'EXIT' && (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.actionItemLeft}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Entry' as never)}
              >
                <View style={styles.actionIconWrap}>
                  <ParkingCircle color="#FFF" size={28} />
                </View>
                <Text style={styles.actionLabel}>Check In</Text>
                <Text style={styles.actionSub}>Register vehicle</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          {user?.gate_assignment !== 'ENTRY' && (
            <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.actionItemRight}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.secondary }]}
                onPress={() => navigation.navigate('Exit' as never)}
              >
                <View style={styles.actionIconWrap}>
                  <Scan color="#FFF" size={28} />
                </View>
                <Text style={styles.actionLabel}>Check Out</Text>
                <Text style={styles.actionSub}>Process exit</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* ── Recent Activity ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <TrendingUp color={colors.primary} size={16} />
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('History' as never)}
            >
              <Text style={styles.viewAllText}>See all</Text>
              <ArrowRight color={colors.primary} size={14} />
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            {recentTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No activity yet today</Text>
              </View>
            ) : (
              recentTickets.slice(0, 5).map((ticket, i) => (
                <TicketRow key={ticket._id} ticket={ticket} index={i} />
              ))
            )}
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },

  // ── Header
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: sw(20), paddingTop: sw(16), paddingBottom: sw(12), backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  greeting:         { color: colors.textSecondary, fontSize: sf(13), fontWeight: '500', marginBottom: 2 },
  userName:         { color: colors.text, fontSize: sf(20), fontWeight: '700', letterSpacing: -0.3 },
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: sw(10) },
  onlinePill:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successBg, paddingHorizontal: sw(10), paddingVertical: sw(5), borderRadius: sw(20) },
  onlineDot:        { width: sw(6), height: sw(6), borderRadius: sw(3), backgroundColor: colors.success, marginRight: sw(5) },
  onlineText:       { color: colors.success, fontSize: sf(12), fontWeight: '600' },
  syncBadge:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning, paddingHorizontal: sw(10), paddingVertical: sw(5), borderRadius: sw(20) },
  syncText:         { color: '#FFF', fontSize: sf(12), fontWeight: '600' },
  logoutBtn:        { padding: sw(4) },

  // ── Content
  scrollContent:    { padding: sw(20), paddingBottom: sw(32) },

  // ── Stats
  statsRow:         { flexDirection: 'row', gap: sw(10), marginBottom: sw(28) },
  statCard:         { flex: 1, backgroundColor: colors.card, borderRadius: sw(16), padding: sw(16), alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statIconWrap:     { width: sw(38), height: sw(38), borderRadius: sw(12), justifyContent: 'center', alignItems: 'center', marginBottom: sw(10) },
  statValue:        { fontSize: sf(22), fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  statLabel:        { fontSize: sf(11), color: colors.textSecondary, fontWeight: '600' },

  // ── Actions
  sectionTitle:     { color: colors.text, fontSize: sf(16), fontWeight: '700', letterSpacing: -0.2, marginBottom: sw(12) },
  actionsRow:       { flexDirection: 'row', gap: sw(12), marginBottom: sw(28) },
  actionCard:       { borderRadius: sw(18), padding: sw(20), flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 6 },
  actionIconWrap:   { width: sw(50), height: sw(50), backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: sw(16), justifyContent: 'center', alignItems: 'center', marginBottom: sw(16) },
  actionLabel:      { color: '#FFF', fontSize: sf(16), fontWeight: '700', marginBottom: 2 },
  actionSub:        { color: 'rgba(255,255,255,0.75)', fontSize: sf(12), fontWeight: '500' },

  // ── Activity
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sw(12) },
  sectionTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: sw(6) },
  viewAllBtn:       { flexDirection: 'row', alignItems: 'center', gap: sw(4) },
  viewAllText:      { color: colors.primary, fontSize: sf(13), fontWeight: '600' },
  activityCard:     { backgroundColor: colors.card, borderRadius: sw(18), overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  activityItem:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: sw(16), paddingVertical: sw(14), borderBottomWidth: 1, borderBottomColor: colors.border },
  plateBadge:       { backgroundColor: colors.accent, borderRadius: sw(8), paddingHorizontal: sw(8), paddingVertical: sw(6), width: sw(82), alignItems: 'center' },
  plateText:        { color: colors.primary, fontSize: sf(11), fontFamily: 'monospace', fontWeight: '800', letterSpacing: 0.5 },
  activityDetails:  { flex: 1, marginLeft: sw(12) },
  activityTitle:    { color: colors.text, fontSize: sf(14), fontWeight: '600' },
  activityTime:     { color: colors.textSecondary, fontSize: sf(12), marginTop: 2 },
  statusBadge:      { paddingHorizontal: sw(8), paddingVertical: sw(4), borderRadius: sw(8) },
  statusBadgeText:  { fontSize: sf(10), fontWeight: '700', letterSpacing: 0.3 },
  emptyState:       { padding: sw(32), alignItems: 'center' },
  emptyText:        { color: colors.textSecondary, fontSize: sf(14) },
  loadingSpinner:   { marginVertical: sw(32) },
  actionItemLeft:   { flex: 1, marginRight: sw(8) },
  actionItemRight:  { flex: 1, marginLeft: sw(8) },
});

export default DashboardScreen;

