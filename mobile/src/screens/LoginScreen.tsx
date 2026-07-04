import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authApi, storeAuthTokens } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateRegister: () => void;
  onNavigateForgot: () => void;
}

const LoginScreen = ({ onLoginSuccess, onNavigateRegister, onNavigateForgot }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const emailError = useMemo(() => {
    if (!email) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email';
    return '';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }, [password]);

  const canSubmit = !emailError && !passwordError;

  const handleLogin = async () => {
    setError('');
    if (!canSubmit) {
      setError('Please fix validation errors before signing in.');
      return;
    }

    setLoading(true);
    try {
      const auth = await authApi.login(email.trim(), password);
      await storeAuthTokens(auth.accessToken, auth.refreshToken);
      onLoginSuccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.header}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to manage your vehicle services.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              style={[styles.input, emailError ? styles.inputError : null]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
              style={[styles.input, passwordError ? styles.inputError : null]}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
            />
            <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword((value) => !value)}>
              <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <TouchableOpacity onPress={onNavigateForgot} style={styles.linkButton}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, !canSubmit || loading ? styles.buttonDisabled : null]} onPress={handleLogin} disabled={!canSubmit || loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to M Enterprises?</Text>
            <TouchableOpacity onPress={onNavigateRegister}>
              <Text style={styles.footerLink}>Create New Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 28, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  header: { fontSize: 30, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 22 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a' },
  inputError: { borderColor: '#ef4444' },
  passwordToggle: { position: 'absolute', right: 18, top: 56 },
  passwordToggleText: { color: '#2563eb', fontWeight: '700' },
  errorText: { color: '#dc2626', marginTop: 8, fontSize: 13 },
  errorBanner: { color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: 14, padding: 14, marginBottom: 16, marginTop: 4 },
  linkButton: { alignSelf: 'flex-end', marginBottom: 16 },
  linkText: { color: '#2563eb', fontWeight: '700' },
  button: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22, gap: 8 },
  footerText: { color: '#64748b' },
  footerLink: { color: '#2563eb', fontWeight: '700' },
});

export default LoginScreen;
