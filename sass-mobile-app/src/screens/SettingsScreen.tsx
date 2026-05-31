import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import {
  User, Mail, Shield, LogOut, ChevronRight,
  Info, Building2, Tag,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { sw, sf } from '../theme/responsive';
import { useAuthStore } from '../store/authStore';

// ── Small building-block components ──────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const InfoRow = ({
  icon: Icon,
  label,
  value,
  iconColor = colors.primary,
}: {
  icon: any; label: string; value?: string; iconColor?: string;
}) => (
  <View style={styles.infoRow}>
    <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
      <Icon color={iconColor} size={16} />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>{value ?? '—'}</Text>
  </View>
);

const ActionRow = ({
  icon: Icon,
  label,
  onPress,
  iconColor = colors.primary,
  destructive = false,
  loading = false,
}: {
  icon: any; label: string; onPress: () => void;
  iconColor?: string; destructive?: boolean; loading?: boolean;
}) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconWrap, { backgroundColor: (destructive ? colors.danger : iconColor) + '18' }]}>
      <Icon color={destructive ? colors.danger : iconColor} size={16} />
    </View>
    <Text style={[styles.actionLabel, destructive && { color: colors.danger }]}>{label}</Text>
    {loading
      ? <ActivityIndicator size="small" color={colors.textSecondary} />
      : <ChevronRight color={colors.border} size={16} />
    }
  </TouchableOpacity>
);



// ── Main Screen ───────────────────────────────────────────────────────────────
const SettingsScreen = () => {
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => { await logout(); },
        },
      ],
    );
  };

  const gateLabel = () => {
    if (user?.gate_assignment === 'ENTRY') return '🟢 Entry Gate';
    if (user?.gate_assignment === 'EXIT')  return '🔴 Exit Gate';
    if (user?.gate_assignment === 'BOTH')  return '🔵 Dual Gate';
    return '⚫ General';
  };

  const roleLabel = () => user?.role?.replace(/_/g, ' ') ?? '—';

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>Account & preferences</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── Profile card ───────────────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() ?? 'O'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Operator'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel()}</Text>
            </View>
          </View>
        </View>

        {/* ── Account Info ───────────────────────────────────────────────── */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <InfoRow icon={User}      label="Full Name"       value={user?.name}            iconColor={colors.primary} />
          <View style={styles.divider} />
          <InfoRow icon={Mail}      label="Email"           value={user?.email}           iconColor={colors.primary} />
          <View style={styles.divider} />
          <InfoRow icon={Shield}    label="Role"            value={roleLabel()}           iconColor={colors.warning} />
          <View style={styles.divider} />
          <InfoRow icon={Building2} label="Gate Assignment" value={gateLabel()}           iconColor={colors.success} />
          <View style={styles.divider} />
          <InfoRow icon={Tag}       label="Tenant ID"       value={user?.tenant_id}       iconColor={colors.textSecondary} />
        </View>

        <SectionHeader title="Security" />
        <View style={styles.card}>
          <ActionRow
            icon={Info}
            label="About ParkSaaS"
            onPress={() => Alert.alert('ParkSaaS Operator', 'Version 1.0.0\n\nSecure parking management platform.')}
            iconColor={colors.textSecondary}
          />
        </View>

        {/* ── Sign Out ───────────────────────────────────────────────────── */}
        <SectionHeader title="" />
        <View style={styles.card}>
          <ActionRow
            icon={LogOut}
            label="Sign Out"
            onPress={handleLogout}
            destructive
            loading={isLoading}
          />
        </View>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <Text style={styles.footer}>ParkSaaS Operator · v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { paddingHorizontal: sw(20), paddingVertical: sw(16), backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:     { color: colors.text, fontSize: sf(20), fontWeight: '700', letterSpacing: -0.3 },
  headerSub:       { color: colors.textSecondary, fontSize: sf(12), marginTop: 2 },
  scroll:          { padding: sw(16), paddingBottom: 40 },

  // Profile card
  profileCard:     { backgroundColor: colors.card, borderRadius: sw(18), padding: sw(20), flexDirection: 'row', alignItems: 'center', gap: sw(16), marginBottom: sw(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  avatarCircle:    { width: sw(56), height: sw(56), borderRadius: sw(28), backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText:      { color: '#FFF', fontSize: sf(24), fontWeight: '800' },
  profileInfo:     { flex: 1 },
  profileName:     { color: colors.text, fontSize: sf(17), fontWeight: '700', marginBottom: 2 },
  profileEmail:    { color: colors.textSecondary, fontSize: sf(12), marginBottom: sw(8) },
  roleBadge:       { alignSelf: 'flex-start', backgroundColor: colors.accent, paddingHorizontal: sw(10), paddingVertical: 3, borderRadius: sw(12) },
  roleBadgeText:   { color: colors.primary, fontSize: sf(10), fontWeight: '700' },

  // Section
  sectionHeader:   { color: colors.textSecondary, fontSize: sf(11), fontWeight: '700', letterSpacing: 0.5, marginTop: sw(20), marginBottom: sw(8), marginLeft: sw(4) },

  // Card
  card:            { backgroundColor: colors.card, borderRadius: sw(16), overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  divider:         { height: 1, backgroundColor: colors.border, marginLeft: sw(54) },

  // Info row
  infoRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: sw(14), paddingHorizontal: sw(16), gap: sw(12) },
  iconWrap:        { width: sw(34), height: sw(34), borderRadius: sw(10), justifyContent: 'center', alignItems: 'center' },
  infoLabel:       { color: colors.textSecondary, fontSize: sf(13), flex: 1 },
  infoValue:       { color: colors.text, fontSize: sf(13), fontWeight: '600', maxWidth: '50%', textAlign: 'right' },

  // Action row
  actionRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: sw(14), paddingHorizontal: sw(16), gap: sw(12) },
  actionLabel:     { color: colors.text, fontSize: sf(14), fontWeight: '500', flex: 1 },

  // Footer
  footer:          { color: colors.textSecondary, fontSize: sf(11), textAlign: 'center', marginTop: sw(24) },
});

export default SettingsScreen;
