import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Package, Sparkles, Star } from 'lucide-react-native';

const parts = [
  { name: 'Engine Oil', brand: 'Castrol', price: 1290, stock: 'In Stock', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80' },
  { name: 'Brake Pads', brand: 'Gremi', price: 2450, stock: 'Limited', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Battery', brand: 'Amaron', price: 3890, stock: 'In Stock', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80' },
  { name: 'Spark Plug', brand: 'NGK', price: 890, stock: 'In Stock', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80' },
];

const PartsScreen = () => (
  <View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.eyebrow}>Popular parts</Text>
          <Text style={styles.title}>Genuine spares for every service</Text>
          <Text style={styles.subtitle}>Premium quality components delivered fast for your bike or car.</Text>
        </View>
        <View style={styles.iconWrap}>
          <Package size={24} color="#2563eb" />
        </View>
      </View>

      {parts.map((part) => (
        <View key={part.name} style={styles.card}>
          {part.image ? <Image source={{ uri: part.image }} style={styles.image} /> : null}
          <View style={styles.cardBody}>
            <View style={styles.rowBetween}>
              <Text style={styles.partName}>{part.name}</Text>
              <View style={styles.ratingChip}>
                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
            </View>
            <Text style={styles.brand}>{part.brand}</Text>
            <Text style={styles.stock}>{part.stock}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.price}>₹{part.price}</Text>
              <TouchableOpacity style={styles.button} activeOpacity={0.85}>
                <Text style={styles.buttonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.offerCard}>
        <Sparkles size={18} color="#2563eb" />
        <Text style={styles.offerText}>Fast delivery and verified compatibility with your vehicle.</Text>
      </View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 140 },
  headerCard: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  headerTextWrap: { flex: 1, paddingRight: 12 },
  eyebrow: { color: '#2563eb', fontWeight: '800', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  subtitle: { color: '#64748b', lineHeight: 20 },
  iconWrap: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  image: { width: '100%', height: 140, backgroundColor: '#e2e8f0' },
  cardBody: { padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  partName: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  brand: { color: '#64748b', marginBottom: 4 },
  stock: { color: '#0f766e', fontWeight: '700', marginBottom: 12 },
  price: { color: '#2563eb', fontWeight: '900', fontSize: 16 },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  buttonText: { color: '#ffffff', fontWeight: '800' },
  ratingChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  ratingText: { color: '#0f172a', fontWeight: '800', fontSize: 12 },
  offerCard: { marginTop: 8, borderRadius: 20, backgroundColor: '#eff6ff', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  offerText: { color: '#1d4ed8', flex: 1, fontWeight: '700' },
});

export default PartsScreen;
