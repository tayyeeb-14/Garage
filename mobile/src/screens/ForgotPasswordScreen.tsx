import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

const ForgotPasswordScreen = ({ onBackToLogin }: ForgotPasswordScreenProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const emailError = useMemo(() => {
    if (!email) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email';
    return '';
  }, [email]);

  const handleSend = async () => {
    setError('');
    setMessage('');
    if (emailError) {
      setError('Please fix the email field first.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage('If this email is registered, a reset link will be sent shortly.');
    } catch {
      setError('Unable to send reset link. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.header}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email and we’ll send a reset link to your inbox.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#94a3b8" style={[styles.input, emailError ? styles.inputError : null]} keyboardType="email-address" autoCapitalize="none" />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          {message ? <Text style={styles.successBanner}>{message}</Text> : null}

          <TouchableOpacity style={[styles.button, loading ? styles.buttonDisabled : null]} onPress={handleSend} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={onBackToLogin}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
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
  errorText: { color: '#dc2626', marginTop: 8, fontSize: 13 },
  errorBanner: { color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: 14, padding: 14, marginBottom: 16, marginTop: 4 },
  successBanner: { color: '#0f5132', backgroundColor: '#d1fae5', borderRadius: 14, padding: 14, marginBottom: 16, marginTop: 4 },
  button: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  linkButton: { alignItems: 'center', marginTop: 20 },
  linkText: { color: '#2563eb', fontWeight: '700' },
});

export default ForgotPasswordScreen;
