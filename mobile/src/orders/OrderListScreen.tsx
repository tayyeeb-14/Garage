import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

interface OrderItem {
  _id: string;
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  paymentMethod: string;
  notes?: string;
  customer?: { fullName?: string; phone?: string };
  vehicle?: { plateNumber?: string; make?: string; modelName?: string };
  services?: Array<{ name?: string }>;
  booking?: { bookingId?: string; bookingDate?: string; preferredTime?: string; address?: string };
}

const OrderListScreen = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/customer/000000000000000000000000');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to load orders');
      }
      setOrders(payload.data ?? []);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const openWhatsApp = (order: OrderItem) => {
    const message = [
      `Order ID: ${order.orderId}`,
      `Booking ID: ${order.booking?.bookingId ?? 'N/A'}`,
      `Customer: ${order.customer?.fullName ?? 'N/A'}`,
      `Phone: ${order.customer?.phone ?? 'N/A'}`,
      `Vehicle: ${order.vehicle ? `${order.vehicle.make ?? ''} ${order.vehicle.modelName ?? ''} (${order.vehicle.plateNumber ?? ''})`.trim() : 'N/A'}`,
      `Services: ${order.services?.map((service) => service.name).join(', ') ?? 'N/A'}`,
      `Date: ${order.booking?.bookingDate ?? 'N/A'}`,
      `Time: ${order.booking?.preferredTime ?? 'N/A'}`,
      `Address: ${order.booking?.address ?? 'N/A'}`,
      `Total: ${order.totalAmount}`,
      `Payment: ${order.paymentMethod}`,
      `Status: ${order.orderStatus}`,
    ].join('\n');
    const url = `https://wa.me/15551234567?text=${encodeURIComponent(message)}`;
    void Linking.openURL(url);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 32 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      {orders.length === 0 ? (
        <Text style={styles.empty}>No orders yet.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.code}>{item.orderId}</Text>
                <Text style={styles.status}>{item.orderStatus}</Text>
              </View>
              <Text style={styles.meta}>Vehicle: {item.vehicle?.plateNumber ?? 'N/A'}</Text>
              <Text style={styles.meta}>Services: {item.services?.map((service) => service.name).join(', ') ?? 'N/A'}</Text>
              <Text style={styles.meta}>Total: ${item.totalAmount}</Text>
              <Text style={styles.meta}>Payment: {item.paymentStatus}</Text>
              <Pressable style={styles.button} onPress={() => openWhatsApp(item)}>
                <Text style={styles.buttonText}>Contact Support</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  empty: { color: '#64748b' },
  list: { paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderColor: '#e2e8f0', borderWidth: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  code: { fontWeight: '700', color: '#0f172a' },
  status: { color: '#2563eb', fontWeight: '600', textTransform: 'capitalize' },
  meta: { color: '#64748b', marginTop: 2 },
  button: { marginTop: 10, backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

export default OrderListScreen;
