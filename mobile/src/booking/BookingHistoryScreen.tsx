import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, CheckCircle2, Clock3, MessageCircle, Phone } from 'lucide-react-native';

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
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.eyebrow}>Bookings</Text>
          <Text style={styles.title}>Track every service visit</Text>
          <Text style={styles.subtitle}>Stay updated on progress, schedule, and support.</Text>
        </View>
        <View style={styles.iconWrap}>
          <CalendarDays size={20} color="#2563eb" />
        </View>
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.code}>{item.bookingId}</Text>
                <Text style={styles.meta}>{new Date(item.bookingDate).toLocaleDateString()} • {item.preferredTime}</Text>
              </View>
              <View style={styles.statusChip}>
                <CheckCircle2 size={14} color="#0f766e" />
                <Text style={styles.status}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.address}>{item.address}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.ghostButton} activeOpacity={0.85}>
                <Clock3 size={14} color="#2563eb" />
                <Text style={styles.ghostText}>Track</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostButton} activeOpacity={0.85}>
                <Phone size={14} color="#2563eb" />
                <Text style={styles.ghostText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostButton} activeOpacity={0.85}>
                <MessageCircle size={14} color="#2563eb" />
                <Text style={styles.ghostText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16, paddingBottom: 140 },
  headerCard: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', padding: 18, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  eyebrow: { color: '#2563eb', fontWeight: '800', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  subtitle: { color: '#64748b', lineHeight: 20 },
  iconWrap: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 14, marginBottom: 12, borderColor: '#e2e8f0', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  code: { fontWeight: '800', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4 },
  statusChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, gap: 4 },
  status: { color: '#0f766e', fontWeight: '800', textTransform: 'capitalize' },
  address: { color: '#475569', marginBottom: 12, lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 8 },
  ghostButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, gap: 6 },
  ghostText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
});

export default BookingHistoryScreen;
