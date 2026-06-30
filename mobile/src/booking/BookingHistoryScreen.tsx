import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

interface BookingItem {
  _id: string;
  bookingId: string;
  bookingDate: string;
  preferredTime: string;
  status: string;
  address: string;
}

const BookingHistoryScreen = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/bookings/customer/000000000000000000000000');
        const payload = await response.json();
        setBookings(payload.data ?? []);
      } finally {
        setLoading(false);
      }
    };

    void loadBookings();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 32 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking History</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.code}>{item.bookingId}</Text>
            <Text style={styles.meta}>{new Date(item.bookingDate).toLocaleDateString()} • {item.preferredTime}</Text>
            <Text style={styles.meta}>{item.address}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  list: { paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderColor: '#e2e8f0', borderWidth: 1 },
  code: { fontWeight: '700', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4 },
  status: { marginTop: 8, color: '#2563eb', fontWeight: '600', textTransform: 'capitalize' },
});

export default BookingHistoryScreen;
