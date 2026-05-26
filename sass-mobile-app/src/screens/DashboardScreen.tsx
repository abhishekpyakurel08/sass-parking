import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { RefreshCcw, CircleUser, CarFront, CheckCircle2, Banknote, Scan, ArrowRight, ParkingCircle, LogOut } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useParkingStore } from '../store/parkingStore';
import { useAuthStore } from '../store/authStore';
import type { Ticket } from '../types/api.types';

const statusColor: Record<string, string> = {
  ACTIVE: colors.success,
  PENDING_PAYMENT: '#FDBA74',
  PAID: colors.textSecondary,
  EXPIRED: colors.danger,
  LOST: colors.danger,
};

const TicketRow = ({ ticket }: { ticket: Ticket }) => (
  <View style={styles.activityItem}>
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
  </View>
);

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { stats, recentTickets, isLoadingStats, fetchDashboard } = useParkingStore();
  const { user, logout } = useAuthStore();

  useEffect(() => { fetchDashboard(); }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          await logout();
          navigation.navigate('Login' as never);
        }},
    ]);
  };

  const onRefresh = useCallback(() => { fetchDashboard(); }, []);

  const fmtRevenue = (n: number) => {
    if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)}k`;
    return `Rs. ${n.toFixed(0)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Operator Status */}
        <View style={styles.operatorCard}>
          <View>
            <Text style={styles.label}>OPERATOR STATUS</Text>
            <Text style={styles.operatorName}>{user?.name ?? 'Operator'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineText}>ONLINE</Text>
            </View>
            <Text style={styles.roleText}>{user?.role?.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.checkInButton} onPress={() => navigation.navigate('CheckIn' as never)}>
          <ParkingCircle color="#FFF" size={32} style={{ marginBottom: 8 }} />
          <Text style={styles.actionButtonText}>CHECK IN VEHICLE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Scanner' as never)}>
          <Scan color="#000" size={32} style={{ marginBottom: 8 }} />
          <Text style={[styles.actionButtonText, { color: '#000' }]}>SCAN TO CHECK OUT</Text>
        </TouchableOpacity>

        {/* Shift Overview */}
        <Text style={styles.sectionTitle}>SHIFT OVERVIEW</Text>

        {isLoadingStats && !stats ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <>
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Text style={styles.label}>VEHICLES TODAY</Text>
                <CarFront color={colors.success} size={20} />
              </View>
              <Text style={[styles.overviewValue, { color: colors.success }]}>
                {stats?.totalVehicles ?? 0}
              </Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Text style={styles.label}>SESSIONS DONE</Text>
                <CheckCircle2 color="#FDBA74" size={20} />
              </View>
              <Text style={[styles.overviewValue, { color: '#FDBA74' }]}>
                {stats?.completedSessions ?? 0}
              </Text>
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

        {/* Recent Activity */}
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                <TicketRow ticket={ticket} />
              </View>
            ))
          )}
        </View>
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
  roleText:        { color: colors.textSecondary, fontSize: 10 },
  checkInButton:   { backgroundColor: colors.primary, borderRadius: 4, padding: 24, alignItems: 'center', marginBottom: 12 },
  scanButton:      { backgroundColor: colors.secondary, borderRadius: 4, padding: 24, alignItems: 'center', marginBottom: 32 },
  actionButtonText:{ color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  sectionTitle:    { color: colors.text, fontSize: 14, marginBottom: 12 },
  overviewCard:    { backgroundColor: colors.card, borderRadius: 4, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  overviewHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  overviewValue:   { fontSize: 36, fontWeight: 'bold' },
  activityHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  viewAllText:     { color: colors.primary, fontSize: 12, fontWeight: 'bold' },
  activityCard:    { backgroundColor: colors.card, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  activityItem:    { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  plateBadge:      { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, width: 80, alignItems: 'center' },
  plateText:       { color: colors.text, fontSize: 11, fontFamily: 'monospace' },
  activityDetails: { flex: 1, marginLeft: 16 },
  activityTitle:   { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  activityTime:    { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  statusBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 9, fontWeight: 'bold' },
});

export default DashboardScreen;
