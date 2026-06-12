import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { saveApiKey } from '../lib/auth';
import { api } from '../lib/api';
import { Colors, Gradients } from '../lib/colors';
import Button from '../components/Button';
import Input from '../components/Input';
import GradientButton from '../components/GradientButton';
import Card from '../components/Card';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Please enter your Email and Password');
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const token = res.data?.data?.access_token;
      if (token) {
        await saveApiKey(token);
        // Verify token works
        await api.get('/operator/config');
        navigation.replace('Main');
      } else {
        throw new Error('No access token received');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || err.message || 'Invalid credentials or Network Error');
      await saveApiKey('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradients */}
      <LinearGradient colors={[Colors.dark.background, '#1a1a2e', Colors.dark.background]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowOrb1, { backgroundColor: Colors.primary }]} />
      <View style={[styles.glowOrb2, { backgroundColor: Colors.accent }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
          
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <LinearGradient colors={Gradients.primary as any} style={StyleSheet.absoluteFill} />
              <Feather name="shield" size={40} color="#fff" />
            </View>
            <Text style={styles.logo}>ParkSaaS</Text>
            <Text style={styles.subtitle}>Secure Operator Terminal</Text>
          </View>

          <BlurView intensity={40} tint="dark" style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.label}>OPERATOR CREDENTIALS</Text>
              
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={Colors.dark.textMuted} />
                </TouchableOpacity>
              </View>
              
              <GradientButton
                title="Sign In"
                onPress={handleLogin}
                gradient="primary"
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
              />
            </View>
          </BlurView>
          
          <Text style={styles.footerText}>
            Protected by enterprise-grade security.{'\n'}Contact your administrator for account access.
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  glowOrb1: { position: 'absolute', top: -100, left: -50, width: width, height: width, borderRadius: width/2, backgroundColor: `${Colors.primary}26`, transform: [{ scale: 1.5 }], filter: 'blur(50px)' },
  glowOrb2: { position: 'absolute', bottom: -100, right: -50, width: width, height: width, borderRadius: width/2, backgroundColor: `${Colors.accent}26`, transform: [{ scale: 1.5 }], filter: 'blur(50px)' },
  
  inner: { flex: 1, justifyContent: 'center', padding: 24, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 48 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  logo: { fontSize: 48, fontWeight: '900', color: Colors.dark.text, letterSpacing: -2, marginBottom: 4 },
  subtitle: { fontSize: 16, color: Colors.dark.textSecondary, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  
  formContainer: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 },
  form: { padding: 32, backgroundColor: 'rgba(255,255,255,0.04)' },
  label: { color: Colors.dark.text, fontSize: 13, fontWeight: '800', marginBottom: 16, letterSpacing: 1.5 },
  
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 24 },
  passwordInput: { flex: 1, color: Colors.dark.text, padding: 16, fontSize: 16, fontWeight: '600' },
  eyeBtn: { padding: 16 },
  loginButton: { marginTop: 8 },
  
  footerText: { textAlign: 'center', color: Colors.dark.textSecondary, fontSize: 13, marginTop: 40, lineHeight: 22, fontWeight: '500' },
});
