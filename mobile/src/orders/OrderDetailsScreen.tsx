import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { orderService, OrderItem } from '../services/orderService';
import { formatCurrency } from '../utils/currency';

interface OrderDetailsScreenProps {
  orderId: string;
  onClose: () => void;
}

const OrderDetailsScreen = ({ orderId, onClose }: OrderDetailsScreenProps) => {
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const fetched = await orderService.getOrderById(orderId);
        setOrder(fetched);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Unable to load order');
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />;
  }

  if (!order) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Order details are not available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Order Details</Text>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Order ID</Text>
        <Text style={styles.value}>{order.orderId}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Order Status</Text>
        <Text style={styles.value}>{order.orderStatus.replace(/_/g, ' ')}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Payment Status</Text>
        <Text style={styles.value}>{order.paymentStatus}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Shipping Address</Text>
        <Text style={styles.value}>{order.shippingAddress ?? 'Not provided'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Parts</Text>
        {order.parts?.length ? (
          order.parts.map((part, index) => (
            <View key={`${part.item._id}-${index}`} style={styles.lineItem}>
              <Text style={styles.partName}>{part.name ?? part.item.itemName}</Text>
              <Text style={styles.partMeta}>{part.quantity} × {formatCurrency(part.price)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.value}>No parts in this order.</Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Total Amount</Text>
        <Text style={styles.value}>{formatCurrency(order.totalAmount)}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc', paddingBottom: 120 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  emptyText: { color: '#64748b' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heading: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  closeButton: { paddingHorizontal: 12, paddingVertical: 8 },
  closeText: { color: '#2563eb', fontWeight: '700' },
  card: { marginBottom: 14, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  value: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  partName: { color: '#0f172a', fontWeight: '700', flex: 1, marginRight: 12 },
  partMeta: { color: '#64748b' },
});

export default OrderDetailsScreen;
