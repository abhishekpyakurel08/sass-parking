import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { RefreshCcw, Mail, Eye, EyeOff, LogIn, Shield, ShieldCheck, ShieldAlert } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';

const LoginScreen = () => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [pin, setPin]           = useState('');
  const [showPin, setShowPin]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !pin.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and PIN.');
      return;
    }
    try {
      clearError();
      await login(email.trim(), pin);
      // Navigation is now handled conditionally in AppNavigator based on isAuthenticated state
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <RefreshCcw color={colors.primary} size={20} />
            <Text style={styles.logoText}>PARKSAAS</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>CONNECTED</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>OPERATOR{'\n'}LOGIN</Text>
          <Text style={styles.subtitle}>Access secure zone management tools.</Text>

          <View style={styles.formCard}>
            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>OPERATOR EMAIL</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@parksaas.io"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Mail color={colors.textSecondary} size={20} />
            </View>

            <Text style={styles.label}>SECURITY PIN</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                secureTextEntry={!showPin}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity onPress={() => setShowPin(!showPin)}>
                {showPin
                  ? <EyeOff color={colors.textSecondary} size={20} />
                  : <Eye color={colors.textSecondary} size={20} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>LOGIN</Text>
                  <LogIn color="#FFF" size={18} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <TouchableOpacity>
                <Text style={styles.linkTextBlue}>FORGOT ACCESS</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.linkTextWhite}>REGISTER DEVICE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.shieldsRow}>
            <ShieldAlert color={colors.textSecondary} size={16} />
            <Shield color={colors.textSecondary} size={16} />
            <ShieldCheck color={colors.textSecondary} size={16} />
          </View>
          <Text style={styles.footerText}>END-TO-END ENCRYPTED TUNNEL ACTIVE</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoContainer:      { flexDirection: 'row', alignItems: 'center' },
  logoText:           { color: colors.primary, fontSize: 18, fontWeight: 'bold', marginLeft: 8, letterSpacing: 1 },
  statusBadge:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  statusDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 6 },
  statusText:         { color: colors.success, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  content:            { flex: 1, padding: 24, justifyContent: 'center' },
  title:              { color: colors.text, fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 36, marginBottom: 8, letterSpacing: -1 },
  subtitle:           { color: colors.textSecondary, textAlign: 'center', fontSize: 14, marginBottom: 32, letterSpacing: 0.5 },
  formCard:           { backgroundColor: colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 5 },
  errorBanner:        { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: colors.danger, borderRadius: 4, padding: 10, marginBottom: 12 },
  errorText:          { color: colors.danger, fontSize: 12 },
  label:              { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  inputContainer:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, height: 52 },
  input:              { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  loginButton:        { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 12, marginTop: 32, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  loginButtonDisabled:{ opacity: 0.6 },
  loginButtonText:    { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  linksRow:           { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  linkTextBlue:       { color: colors.primary, fontSize: 10, fontWeight: 'bold', textDecorationLine: 'underline' },
  linkTextWhite:      { color: colors.text, fontSize: 10, fontWeight: 'bold' },
  footer:             { padding: 20, alignItems: 'center', paddingBottom: 40 },
  shieldsRow:         { flexDirection: 'row', gap: 16, marginBottom: 12 },
  footerText:         { color: colors.textSecondary, fontSize: 10, letterSpacing: 1, fontWeight: 'bold' },
});

export default LoginScreen;
