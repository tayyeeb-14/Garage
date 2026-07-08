import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Package, Sparkles } from 'lucide-react-native';
import { PublicPart } from '../services/dashboardService';
import { usePublicParts } from '../hooks/usePublicParts';
import { formatCurrency } from '../utils/currency';

const PARTS_PARAMS = { limit: 50, sort: 'name-asc' } as const;

const stockLabel = (part: PublicPart) => {
  if (part.status === 'Low Stock') return `Only ${part.quantity} left`;
  return `${part.quantity} in stock`;
};

const stockColor = (status: PublicPart['status']) => {
  if (status === 'Low Stock') return '#d97706';
  return '#0f766e';
};

const PartCard = React.memo(({ part }: { part: PublicPart }) => (
  <View style={styles.card}>
    {part.image ? (
      <Image source={{ uri: part.image }} style={styles.image} resizeMode="cover" />
    ) : (
      <View style={styles.imagePlaceholder}>
        <Package size={28} color="#2563eb" />
      </View>
    )}
    <View style={styles.cardBody}>
      <View style={styles.rowBetween}>
        <Text style={styles.partName}>{part.itemName}</Text>
        <View style={styles.badgeRow}>
          {part.isFeatured ? (
            <View style={styles.featuredChip}>
              <Sparkles size={12} color="#2563eb" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          ) : null}
          {part.status === 'Low Stock' ? (
            <View style={styles.lowStockChip}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.brand}>{part.brand || part.category}</Text>
      <Text style={styles.meta}>
        {part.compatibleVehicles?.length ? part.compatibleVehicles[0] : part.category}
      </Text>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.price}>{formatCurrency(part.sellingPrice)}</Text>
          {part.originalPrice && part.originalPrice > part.sellingPrice ? (
            <Text style={styles.oldPrice}>{formatCurrency(part.originalPrice)}</Text>
          ) : null}
        </View>
        <Text style={[styles.stock, { color: stockColor(part.status) }]}>{stockLabel(part)}</Text>
      </View>
    </View>
  </View>
));

const PartsScreen = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { parts, loading, error, refresh } = usePublicParts(
    debouncedSearch ? { ...PARTS_PARAMS, search: debouncedSearch } : PARTS_PARAMS,
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const listHeader = useMemo(() => (
    <View>
      <View style={styles.headerCard}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.eyebrow}>Spare Parts</Text>
          <Text style={styles.title}>Genuine spares for every service</Text>
          <Text style={styles.subtitle}>Premium quality components delivered fast for your bike or car.</Text>
        </View>
        <View style={styles.iconWrap}>
          <Package size={24} color="#2563eb" />
        </View>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search parts by name, brand, category, or SKU"
        placeholderTextColor="#94a3b8"
        style={styles.searchInput}
      />
    </View>
  ), [search]);

  const listEmpty = useMemo(() => {
    if (loading) {
      return <ActivityIndicator color="#2563eb" style={{ marginTop: 24 }} />;
    }
    if (error) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{error}</Text>
          <Text style={styles.emptyText}>Pull down to retry.</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No parts available</Text>
        <Text style={styles.emptyText}>Spare parts will appear here once added from the admin panel.</Text>
      </View>
    );
  }, [loading, error]);

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : parts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PartCard part={item} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={(
          <View style={styles.offerCard}>
            <Sparkles size={18} color="#2563eb" />
            <Text style={styles.offerText}>Fast delivery and verified compatibility with your vehicle.</Text>
          </View>
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 16, paddingBottom: 140 },
  headerCard: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  headerTextWrap: { flex: 1, paddingRight: 12 },
  eyebrow: { color: '#2563eb', fontWeight: '800', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  subtitle: { color: '#64748b', lineHeight: 20 },
  iconWrap: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  searchInput: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, color: '#0f172a' },
  card: { backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  image: { width: '100%', height: 160, backgroundColor: '#e2e8f0' },
  imagePlaceholder: { width: '100%', height: 160, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  partName: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 4, flex: 1 },
  brand: { color: '#64748b', marginBottom: 4 },
  meta: { color: '#94a3b8', marginBottom: 12, fontSize: 13 },
  price: { color: '#2563eb', fontWeight: '900', fontSize: 16 },
  oldPrice: { color: '#94a3b8', textDecorationLine: 'line-through', fontSize: 13, marginTop: 2 },
  stock: { fontWeight: '700' },
  featuredChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  featuredText: { color: '#2563eb', fontWeight: '800', fontSize: 11 },
  lowStockChip: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  lowStockText: { color: '#92400e', fontWeight: '800', fontSize: 11 },
  offerCard: { marginTop: 8, borderRadius: 20, backgroundColor: '#eff6ff', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  offerText: { color: '#1d4ed8', flex: 1, fontWeight: '700' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 20, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyText: { color: '#64748b', textAlign: 'center' },
});

export default PartsScreen;
