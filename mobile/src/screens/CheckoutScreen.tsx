import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { orderService, OrderPartPayload } from '../services/orderService';
import { CartItem } from './CartScreen';
import { formatCurrency } from '../utils/currency';

interface CheckoutScreenProps {
  cartItems: CartItem[];
  onOrderPlaced: () => void;
  onBack: () => void;
}

const CheckoutScreen = ({ cartItems, onOrderPlaced, onBack }: CheckoutScreenProps) => {
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const orderTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.part.sellingPrice * item.quantity, 0), [cartItems]);

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      Alert.alert('Shipping address is required');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const parts: OrderPartPayload[] = cartItems.map((item) => ({
        item: item.part._id,
        quantity: item.quantity,
        price: item.part.sellingPrice,
        name: item.part.itemName,
        sku: item.part.sku,
      }));

      await orderService.createOrder({
        parts,
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
        notes: notes.trim() || undefined,
        totalAmount: orderTotal,
      });

      Alert.alert('Order placed', 'Your parts order has been submitted successfully.');
      onOrderPlaced();
    } catch (error) {
      Alert.alert('Order failed', error instanceof Error ? error.message : 'Unable to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Checkout</Text>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Shipping Address</Text>
          <TextInput
            value={shippingAddress}
            onChangeText={setShippingAddress}
            placeholder="Enter delivery or pickup address"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            multiline
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Payment Method</Text>
          {(['cash', 'upi', 'card'] as const).map((method) => (
            <Pressable
              key={method}
              style={[styles.optionButton, paymentMethod === method ? styles.optionButtonActive : null]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text style={[styles.optionText, paymentMethod === method ? styles.optionTextActive : null]}>{method.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Order Summary</Text>
          <Text style={styles.value}>{cartItems.length} part(s)</Text>
          <Text style={[styles.value, styles.total]}>Total: {formatCurrency(orderTotal)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any order notes or instructions"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            multiline
          />
        </View>
        <Pressable style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handlePlaceOrder} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Placing Order...' : 'Place Order'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heading: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  backButton: { paddingHorizontal: 12, paddingVertical: 8 },
  backText: { color: '#2563eb', fontWeight: '700' },
  card: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 14 },
  label: { color: '#64748b', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  input: { backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, color: '#0f172a', minHeight: 52 },
  optionButton: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10, backgroundColor: '#ffffff' },
  optionButtonActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionText: { color: '#0f172a', fontWeight: '700' },
  optionTextActive: { color: '#2563eb' },
  value: { color: '#0f172a', fontWeight: '700', marginBottom: 8 },
  total: { marginTop: 6, fontSize: 18 },
  submitButton: { backgroundColor: '#2563eb', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  submitButtonDisabled: { backgroundColor: '#93c5fd' },
  submitText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
});

export default CheckoutScreen;
