import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCurrency } from '../utils/currency';
import { PublicPart } from '../services/dashboardService';

export interface CartItem {
  part: PublicPart;
  quantity: number;
}

interface CartScreenProps {
  cartItems: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onCheckout: () => void;
  onBack: () => void;
}

const CartScreen = ({ cartItems, onRemoveItem, onUpdateQuantity, onCheckout, onBack }: CartScreenProps) => {
  const totalAmount = cartItems.reduce((sum, item) => sum + item.part.sellingPrice * item.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cart</Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add genuine parts from the catalog to place an order.</Text>
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.part._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>{item.part.itemName}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.part.sellingPrice * item.quantity)}</Text>
              </View>
              <Text style={styles.itemMeta}>{item.part.brand || item.part.category}</Text>
              <View style={styles.quantityRow}>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => onUpdateQuantity(item.part._id, Math.max(1, item.quantity - 1))}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </Pressable>
                <Text style={styles.quantityValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => onUpdateQuantity(item.part._id, Math.min(item.part.quantity, item.quantity + 1))}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </Pressable>
                <Pressable style={styles.removeButton} onPress={() => onRemoveItem(item.part._id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        <Pressable style={[styles.checkoutButton, cartItems.length === 0 && styles.checkoutButtonDisabled]} onPress={onCheckout} disabled={cartItems.length === 0}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  backButton: { paddingHorizontal: 12, paddingVertical: 8 },
  backText: { color: '#2563eb', fontWeight: '700' },
  emptyCard: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#64748b' },
  list: { paddingBottom: 24 },
  itemCard: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontWeight: '800', fontSize: 15, color: '#0f172a', flex: 1, marginRight: 12 },
  itemPrice: { fontWeight: '700', color: '#2563eb' },
  itemMeta: { color: '#64748b', marginBottom: 12 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityButton: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  quantityButtonText: { fontSize: 18, color: '#2563eb', fontWeight: '700' },
  quantityValue: { minWidth: 28, textAlign: 'center', color: '#0f172a', fontWeight: '700' },
  removeButton: { marginLeft: 'auto' },
  removeText: { color: '#ef4444', fontWeight: '700' },
  footer: { paddingTop: 16, borderTopWidth: 1, borderColor: '#e2e8f0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { color: '#64748b', fontSize: 15, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  checkoutButton: { backgroundColor: '#2563eb', borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  checkoutButtonDisabled: { backgroundColor: '#93c5fd' },
  checkoutText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
});

export default CartScreen;
