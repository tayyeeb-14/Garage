import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { formatCurrency } from '../utils/currency';

interface ServiceItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  thumbnailImage?: string;
  featured?: boolean;
  popular?: boolean;
}

const MobileServiceScreen = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadServices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services/public');
      const payload = await response.json();
      setServices(payload.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const filteredServices = services.filter((service) => service.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Services</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search services" style={styles.input} />
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadServices(); }} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.thumbnailImage ? <Image source={{ uri: item.thumbnailImage }} style={styles.image} /> : null}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardText} numberOfLines={2}>{item.description ?? 'Premium service for your vehicle.'}</Text>
                <View style={styles.row}>
                  <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderColor: '#cbd5e1', borderWidth: 1, marginBottom: 12 },
  list: { paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  image: { width: '100%', height: 140, backgroundColor: '#e2e8f0' },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  cardText: { color: '#64748b', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { fontSize: 15, fontWeight: '700', color: '#2563eb' },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default MobileServiceScreen;
