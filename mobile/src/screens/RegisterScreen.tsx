import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authApi, storeAuthTokens } from '../services/authService';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateLogin: () => void;
}

const RegisterScreen = ({ onRegisterSuccess, onNavigateLogin }: RegisterScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fullNameError = useMemo(() => {
    if (!fullName) return 'Full name is required';
    if (fullName.trim().length < 2) return 'Please enter your full name';
    return '';
  }, [fullName]);

  const emailError = useMemo(() => {
    if (!email) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email';
    return '';
  }, [email]);

  const phoneError = useMemo(() => {
    if (!phone) return 'Mobile number is required';
    if (!/^\+?\d{7,15}$/.test(phone)) return 'Enter a valid phone number';
    return '';
  }, [phone]);

  const passwordError = useMemo(() => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }, [password]);

  const confirmError = useMemo(() => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  }, [confirmPassword, password]);

  const canSubmit = !fullNameError && !emailError && !phoneError && !passwordError && !confirmError;

  const handleRegister = async () => {
    setError('');
    if (!canSubmit) {
      setError('Please fix validation errors before creating your account.');
      return;
    }

    setLoading(true);
    try {
      const auth = await authApi.register(fullName.trim(), email.trim(), phone.trim(), password);
      await storeAuthTokens(auth.accessToken, auth.refreshToken, auth.user);
      onRegisterSuccess();
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.header}>Create Account</Text>
          <Text style={styles.subtitle}>Set up your profile and start managing service bookings.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Full Name" placeholderTextColor="#94a3b8" style={[styles.input, fullNameError ? styles.inputError : null]} autoCapitalize="words" />
            {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#94a3b8" style={[styles.input, emailError ? styles.inputError : null]} keyboardType="email-address" autoCapitalize="none" />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="Mobile Number" placeholderTextColor="#94a3b8" style={[styles.input, phoneError ? styles.inputError : null]} keyboardType="phone-pad" autoCapitalize="none" />
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput value={password} onChangeText={setPassword} placeholder="Create a password" placeholderTextColor="#94a3b8" style={[styles.input, passwordError ? styles.inputError : null]} secureTextEntry={!showPassword} autoCapitalize="none" />
            <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword((value) => !value)}>
              <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor="#94a3b8" style={[styles.input, confirmError ? styles.inputError : null]} secureTextEntry={!showConfirm} autoCapitalize="none" />
            <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowConfirm((value) => !value)}>
              <Text style={styles.passwordToggleText}>{showConfirm ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}
          </View>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <TouchableOpacity style={[styles.button, !canSubmit || loading ? styles.buttonDisabled : null]} onPress={handleRegister} disabled={!canSubmit || loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={onNavigateLogin}>
              <Text style={styles.footerLink}>Login</Text>
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
  header: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 22 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a' },
  inputError: { borderColor: '#ef4444' },
  passwordToggle: { position: 'absolute', right: 18, top: 56 },
  passwordToggleText: { color: '#2563eb', fontWeight: '700' },
  errorText: { color: '#dc2626', marginTop: 8, fontSize: 13 },
  errorBanner: { color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: 14, padding: 14, marginBottom: 16, marginTop: 4 },
  button: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22, gap: 8 },
  footerText: { color: '#64748b' },
  footerLink: { color: '#2563eb', fontWeight: '700' },
});

export default RegisterScreen;
