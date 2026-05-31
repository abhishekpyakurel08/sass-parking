import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import { Mail, Eye, EyeOff, LogIn, Shield, ShieldCheck, Lock } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { sw, sf } from '../theme/responsive';
import { useAuthStore } from '../store/authStore';

const LoginScreen = () => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail]     = useState('');
  const [pin, setPin]         = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !pin.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and PIN.');
      return;
    }
    try {
      clearError();
      await login(email.trim(), pin);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand ─────────────────────────────────────────────── */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Shield color="#FFF" size={sw(28)} />
            </View>
            <Text style={styles.brandName}>ParkSaaS</Text>
            <Text style={styles.brandTagline}>Operator Portal</Text>
          </View>

          {/* ── Card ──────────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSub}>Enter your credentials to continue</Text>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrap}>
              <Mail color={colors.textSecondary} size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@parksaas.io"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* PIN */}
            <Text style={styles.label}>Security PIN</Text>
            <View style={styles.inputWrap}>
              <Lock color={colors.textSecondary} size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                secureTextEntry={!showPin}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeBtn}>
                {showPin
                  ? <EyeOff color={colors.textSecondary} size={18} />
                  : <Eye color={colors.textSecondary} size={18} />}
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <LogIn color="#FFF" size={18} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Footer ────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <ShieldCheck color={colors.border} size={14} />
            <Text style={styles.footerText}>End-to-end encrypted · Secure operator access</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  scroll:          { flexGrow: 1, justifyContent: 'center', paddingHorizontal: sw(24), paddingVertical: sw(32) },

  // Brand section
  brandSection:    { alignItems: 'center', marginBottom: sw(32) },
  logoCircle:      { width: sw(64), height: sw(64), borderRadius: sw(20), backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: sw(14), shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  brandName:       { color: colors.text, fontSize: sf(28), fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  brandTagline:    { color: colors.textSecondary, fontSize: sf(14), fontWeight: '500' },

  // Card
  card:            { backgroundColor: colors.card, borderRadius: sw(20), padding: sw(24), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5, marginBottom: sw(24) },
  cardTitle:       { color: colors.text, fontSize: sf(22), fontWeight: '700', marginBottom: 4 },
  cardSub:         { color: colors.textSecondary, fontSize: sf(13), marginBottom: sw(24) },

  // Error
  errorBanner:     { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.danger, borderRadius: 10, padding: sw(12), marginBottom: sw(16) },
  errorText:       { color: colors.danger, fontSize: sf(13), fontWeight: '500' },

  // Form
  label:           { color: colors.text, fontSize: sf(13), fontWeight: '600', marginBottom: sw(6), marginTop: sw(16) },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border, borderRadius: sw(12), paddingHorizontal: sw(14), height: sw(52) },
  inputIcon:       { marginRight: sw(10) },
  input:           { flex: 1, color: colors.text, fontSize: sf(15), fontWeight: '500' },
  eyeBtn:          { padding: 4 },

  // Button
  loginBtn:        { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: sw(52), borderRadius: sw(14), marginTop: sw(28), shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  loginBtnDisabled:{ opacity: 0.65 },
  loginBtnText:    { color: '#FFF', fontSize: sf(16), fontWeight: '700' },

  // Footer
  footer:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  footerText:      { color: colors.textSecondary, fontSize: sf(11) },
});

export default LoginScreen;
