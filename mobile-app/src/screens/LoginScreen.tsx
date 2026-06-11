import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { saveApiKey } from '../lib/auth';
import { api } from '../lib/api';

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
      <LinearGradient colors={['#020617', '#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
          
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <LinearGradient colors={['#38bdf8', '#3b82f6']} style={StyleSheet.absoluteFill} />
              <Feather name="shield" size={40} color="#fff" />
            </View>
            <Text style={styles.logo}>ParkSaaS</Text>
            <Text style={styles.subtitle}>Secure Operator Terminal</Text>
          </View>

          <BlurView intensity={40} tint="dark" style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.label}>OPERATOR CREDENTIALS</Text>
              
              <View style={[styles.inputWrapper, email ? styles.inputWrapperActive : null, { marginBottom: 16 }]}>
                <Feather name="mail" size={20} color={email ? '#38bdf8' : '#64748b'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={[styles.inputWrapper, password ? styles.inputWrapperActive : null]}>
                <Feather name="lock" size={20} color={password ? '#38bdf8' : '#64748b'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                <LinearGradient colors={['#0ea5e9', '#2563eb']} style={styles.gradientBtn} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.buttonText}>Authenticate</Text>
                      <Feather name="arrow-right" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#020617' },
  glowOrb1: { position: 'absolute', top: -100, left: -50, width: width, height: width, borderRadius: width/2, backgroundColor: 'rgba(56, 189, 248, 0.15)', transform: [{ scale: 1.5 }], filter: 'blur(50px)' },
  glowOrb2: { position: 'absolute', bottom: -100, right: -50, width: width, height: width, borderRadius: width/2, backgroundColor: 'rgba(59, 130, 246, 0.15)', transform: [{ scale: 1.5 }], filter: 'blur(50px)' },
  
  inner: { flex: 1, justifyContent: 'center', padding: 24, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 48 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden', shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  logo: { fontSize: 48, fontWeight: '900', color: '#ffffff', letterSpacing: -2, marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#94a3b8', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  
  formContainer: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 },
  form: { padding: 32, backgroundColor: 'rgba(15, 23, 42, 0.6)' },
  label: { color: '#e2e8f0', fontSize: 13, fontWeight: '800', marginBottom: 16, letterSpacing: 1.5 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 32 },
  inputWrapperActive: { borderColor: 'rgba(56, 189, 248, 0.4)', backgroundColor: 'rgba(56, 189, 248, 0.05)' },
  inputIcon: { paddingLeft: 20 },
  input: { flex: 1, color: '#fff', padding: 20, fontSize: 16, fontWeight: '600' },
  eyeBtn: { padding: 20 },
  
  button: { borderRadius: 20, overflow: 'hidden', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  gradientBtn: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  
  footerText: { textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 40, lineHeight: 22, fontWeight: '500' },
});
