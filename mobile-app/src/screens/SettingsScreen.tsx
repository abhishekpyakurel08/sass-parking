import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { removeApiKey } from '../lib/auth';

export default function SettingsScreen({ navigation }: any) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/operator/config');
      setConfig(res.data.config);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await removeApiKey();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      ]
    );
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Operator Settings</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <View style={styles.content}>
            <BlurView intensity={20} tint="dark" style={styles.profileCard}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="#3b82f6" />
              </View>
              <Text style={styles.profileName}>{config?.tenant?.name || 'ParkSaaS Tenant'}</Text>
              <Text style={styles.profileRole}>Gate Operator</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Feather name="user" size={16} color="#94a3b8" />
                <Text style={styles.infoLabel}>Operator Name:</Text>
                <Text style={styles.infoValue}>{config?.operator?.name || 'N/A'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={16} color="#94a3b8" />
                <Text style={styles.infoLabel}>Gate Assignment:</Text>
                <Text style={styles.infoValue}>{config?.operator?.gate_assignment || 'N/A'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Feather name="hash" size={16} color="#94a3b8" />
                <Text style={styles.infoLabel}>Ticket Prefix:</Text>
                <Text style={styles.infoValue}>{config?.operator?.ticket_prefix || 'None'}</Text>
              </View>
            </BlurView>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={handleLogout}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                <Feather name="log-out" size={20} color="#f43f5e" />
              </View>
              <Text style={styles.actionText}>Sign Out</Text>
              <Feather name="chevron-right" size={20} color="#64748b" />
            </TouchableOpacity>

            <Text style={styles.versionText}>ParkSaaS v1.0.0</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20 },
  
  profileCard: { borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(30, 41, 59, 0.4)', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  profileRole: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', marginVertical: 20 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 12 },
  infoLabel: { color: '#94a3b8', fontSize: 14, marginLeft: 8, flex: 1 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.6)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionText: { flex: 1, color: '#f43f5e', fontSize: 16, fontWeight: '600' },
  
  versionText: { color: '#475569', textAlign: 'center', marginTop: 40, fontSize: 12, fontWeight: '600' }
});
