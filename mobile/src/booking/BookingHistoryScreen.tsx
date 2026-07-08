import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { CustomerBooking, fetchCustomerBookings, fetchPublicServices, fetchUserProfile, PublicService } from '../services/dashboardService';
import { formatCurrency } from '../utils/currency';

type FilterKey = 'all' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
type ViewMode = 'list' | 'details';

const filterTabs: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const normalizeStatus = (status?: string) => (status ?? '').toLowerCase();
const mapStatusToFilter = (status?: string): FilterKey => {
  const value = normalizeStatus(status);
  if (['pending', 'confirmed'].includes(value)) return 'upcoming';
  if (['in_service', 'ready_for_pickup', 'in_progress'].includes(value)) return 'in_progress';
  if (value === 'completed') return 'completed';
  if (value === 'cancelled') return 'cancelled';
  return 'all';
};

const renderStatusLabel = (status?: string) => normalizeStatus(status).replace(/_/g, ' ') || 'pending';
const statusColor = (status?: string) => {
  const value = mapStatusToFilter(status);
  if (value === 'completed') return { bg: '#ecfdf5', text: '#0f766e' };
  if (value === 'cancelled') return { bg: '#fef2f2', text: '#b91c1c' };
  if (value === 'in_progress') return { bg: '#eff6ff', text: '#1d4ed8' };
  return { bg: '#fff7ed', text: '#b45309' };
};

const BookingHistoryScreen = ({ onBookService }: { onBookService?: () => void }) => {
  const [orders, setOrders] = useState<CustomerBooking[]>([]);
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await fetchUserProfile();
        const customerId = profile?._id;
        const [orderData, serviceData] = await Promise.all([
          customerId ? fetchCustomerBookings(customerId) : Promise.resolve([]),
          fetchPublicServices(),
        ]);
        setOrders(orderData);
        setServices(serviceData);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const serviceImageMap = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((service) => {
      if (service.thumbnailImage) map.set(service.name.toLowerCase(), service.thumbnailImage);
    });
    return map;
  }, [services]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const mapped = mapStatusToFilter(order.status);
      const matchesFilter = activeFilter === 'all' ? true : mapped === activeFilter;
      if (!matchesFilter) return false;
      if (!query) return true;
      const serviceNames = (order.services ?? []).map((item) => item.name ?? '').join(' ').toLowerCase();
      const bookingId = (order.bookingId ?? '').toLowerCase();
      const vehicle = (order.vehicle?.plateNumber ?? '').toLowerCase();
      return serviceNames.includes(query) || bookingId.includes(query) || vehicle.includes(query);
    });
  }, [orders, search, activeFilter]);

  const actionsForStatus = (status?: string) => {
    const filter = mapStatusToFilter(status);
    if (filter === 'upcoming') return ['View Details', 'Reschedule', 'Cancel Booking'];
    if (filter === 'in_progress') return ['Track Service', 'Contact Garage'];
    if (filter === 'completed') return ['View Invoice', 'Book Again', 'Rate Service'];
    if (filter === 'cancelled') return ['Book Again'];
    return ['View Details'];
  };

  const onAction = (label: string, order: CustomerBooking) => {
    if (label === 'View Details' || label === 'Track Service') {
      setSelectedOrder(order);
      setViewMode('details');
      return;
    }
    if (label === 'Contact Garage') {
      Alert.alert('Contact Garage', 'Please call garage support at +91 90000 00000');
      return;
    }
    Alert.alert(label, 'This action is available in this module flow.');
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 32 }} />;
  }

  if (viewMode === 'details' && selectedOrder) {
    const timeline = ['pending', 'confirmed', 'in_service', 'ready_for_pickup', 'completed'];
    const activeIndex = Math.max(timeline.indexOf(normalizeStatus(selectedOrder.status)), 0);
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setViewMode('list')}>
          <Text style={styles.backText}>← Back to History</Text>
        </TouchableOpacity>
        <FlatList
          data={[selectedOrder]}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 140 }}
          renderItem={({ item }) => (
            <View style={styles.detailsCard}>
              <Text style={styles.title}>Booking Details</Text>
              <Text style={styles.detailRow}>Booking ID: {item.bookingId}</Text>
              <Text style={styles.detailRow}>Status: {renderStatusLabel(item.status)}</Text>
              <Text style={styles.sectionTitle}>Status Timeline</Text>
              {timeline.map((step, index) => (
                <Text key={step} style={[styles.timelineText, index <= activeIndex ? styles.timelineActive : null]}>
                  {index <= activeIndex ? '●' : '○'} {step.replace(/_/g, ' ')}
                </Text>
              ))}
              <Text style={styles.sectionTitle}>Service Details</Text>
              {(item.services ?? []).map((service, index) => (
                <Text key={`${service.name}-${index}`} style={styles.detailRow}>• {service.name ?? 'Service'} - {formatCurrency(service.price ?? 0)}</Text>
              ))}
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
              <Text style={styles.detailRow}>{item.vehicle?.plateNumber ?? 'N/A'} • {item.vehicle?.make ?? ''} {item.vehicle?.modelName ?? ''}</Text>
              <Text style={styles.sectionTitle}>Address</Text>
              <Text style={styles.detailRow}>{item.address ?? 'Address not available'}</Text>
              <Text style={styles.sectionTitle}>Pickup Status</Text>
              <Text style={styles.detailRow}>{item.pickupRequired ? 'Pickup scheduled' : 'Standard drop-off service'}</Text>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.detailRow}>{item.notes ?? 'No additional notes'}</Text>
              <Text style={styles.sectionTitle}>Total Amount</Text>
              <Text style={styles.totalAmount}>{formatCurrency((item.services ?? []).reduce((sum, service) => sum + Number(service.price ?? 0), 0))}</Text>
              <TouchableOpacity style={styles.primaryAction} onPress={() => Alert.alert('Contact Garage', 'Garage support: +91 90000 00000')}>
                <Text style={styles.primaryActionText}>Contact Garage</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.eyebrow}>Bookings</Text>
          <Text style={styles.title}>Service History</Text>
          <Text style={styles.subtitle}>Search, filter, and track all your service appointments.</Text>
        </View>
        <View style={styles.iconWrap}>
          <CalendarDays size={20} color="#2563eb" />
        </View>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by service, booking ID, or vehicle"
        placeholderTextColor="#94a3b8"
        style={styles.searchInput}
      />

      <FlatList
        data={filterTabs}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabs}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item.key ? styles.filterChipActive : null]}
            onPress={() => setActiveFilter(item.key)}
          >
            <Text style={[styles.filterChipText, activeFilter === item.key ? styles.filterChipTextActive : null]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🛠️</Text>
          <Text style={styles.emptyTitle}>No bookings found</Text>
          <Text style={styles.emptyText}>You have no bookings in this section yet. Start a new service booking to see it here.</Text>
          <TouchableOpacity style={styles.primaryAction} onPress={() => onBookService?.()}>
            <Text style={styles.primaryActionText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const primaryService = item.services?.[0];
            const serviceName = primaryService?.name ?? 'Service';
            const imageUrl = serviceImageMap.get(serviceName.toLowerCase());
            const colors = statusColor(item.status);
            const totalAmount = (item.services ?? []).reduce((sum, service) => sum + Number(service.price ?? 0), 0);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.serviceImage} />
                  ) : (
                    <View style={[styles.serviceImage, styles.serviceImageFallback]}>
                      <Text style={styles.serviceImageFallbackText}>Service</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{serviceName}</Text>
                    <Text style={styles.meta}>Booking ID: {item.bookingId}</Text>
                    <Text style={styles.meta}>Vehicle: {item.vehicle?.plateNumber ?? 'N/A'}</Text>
                    <Text style={styles.meta}>
                      {item.bookingDate ? new Date(item.bookingDate).toLocaleDateString() : 'Date N/A'} • {item.preferredTime ?? 'Time N/A'}
                    </Text>
                    <Text style={styles.amount}>{formatCurrency(totalAmount)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statusText, { color: colors.text }]}>{renderStatusLabel(item.status)}</Text>
                  </View>
                </View>
                <View style={styles.actionRow}>
                  {actionsForStatus(item.status).map((action) => (
                    <TouchableOpacity key={action} style={styles.ghostButton} onPress={() => onAction(action, item)}>
                      <Text style={styles.ghostText}>{action}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16, paddingBottom: 140 },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  eyebrow: { color: '#2563eb', fontWeight: '800', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  subtitle: { color: '#64748b', lineHeight: 20 },
  iconWrap: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#0f172a',
  },
  filterTabs: { paddingBottom: 10, gap: 8 },
  filterChip: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterChipText: { color: '#475569', fontWeight: '700', fontSize: 12 },
  filterChipTextActive: { color: '#ffffff' },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  serviceImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#e2e8f0' },
  serviceImageFallback: { alignItems: 'center', justifyContent: 'center' },
  serviceImageFallbackText: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  serviceName: { fontWeight: '900', color: '#0f172a', fontSize: 16, marginBottom: 4 },
  meta: { color: '#64748b', fontSize: 12, marginBottom: 2 },
  amount: { color: '#2563eb', fontWeight: '800', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontWeight: '800', textTransform: 'capitalize', fontSize: 11 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  ghostButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ghostText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  emptyWrap: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 44, marginBottom: 8 },
  emptyTitle: { color: '#0f172a', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptyText: { color: '#64748b', textAlign: 'center', lineHeight: 21, marginBottom: 14 },
  primaryAction: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  primaryActionText: { color: '#fff', fontWeight: '700' },
  backButton: { alignSelf: 'flex-start', marginBottom: 10, backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  backText: { color: '#2563eb', fontWeight: '700' },
  detailsCard: { backgroundColor: '#fff', borderRadius: 20, borderColor: '#e2e8f0', borderWidth: 1, padding: 16 },
  sectionTitle: { marginTop: 12, marginBottom: 6, color: '#0f172a', fontWeight: '800', fontSize: 16 },
  detailRow: { color: '#334155', marginBottom: 4, lineHeight: 20 },
  timelineText: { color: '#94a3b8', marginBottom: 2, textTransform: 'capitalize' },
  timelineActive: { color: '#1d4ed8', fontWeight: '700' },
  totalAmount: { color: '#2563eb', fontSize: 20, fontWeight: '900' },
});

export default BookingHistoryScreen;
