import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  fetchDashboardStats,
  fetchPublicServices,
  fetchRecentOrders,
  fetchUserProfile,
  fetchVehicles,
  DashboardOrder,
  DashboardStats,
  PublicService,
  Profile,
  Vehicle,
} from '../services/dashboardService';
import { formatCurrency } from '../utils/currency';

const categories = [
  { label: 'Oil Change', icon: '🛢️' },
  { label: 'Car Wash', icon: '🚿' },
  { label: 'Battery', icon: '🔋' },
  { label: 'AC', icon: '❄️' },
  { label: 'Tyres', icon: '🧱' },
  { label: 'Engine', icon: '⚙️' },
  { label: 'Detailing', icon: '✨' },
  { label: 'Emergency', icon: '🚨' },
];

const featureCards = [
  { title: 'Certified Mechanics', description: 'Service handled by trained professionals.' },
  { title: 'Genuine Parts', description: 'Original parts for a reliable repair.' },
  { title: 'Doorstep Service', description: 'Pickup and delivery for complete convenience.' },
  { title: 'Service Warranty', description: 'Work backed by trusted aftercare.' },
];

const mockReviews = [] as Array<{ title: string; details: string; rating: number; author: string }>;

const HomeDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [currentBooking, setCurrentBooking] = useState<DashboardOrder | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const loadContent = async () => {
      setError('');
      const loadStartTime = Date.now();
      try {
        setLoading(true);
        const [userProfile, serviceList, vehicleList, orderList, dashboardStats] = await Promise.all([
          fetchUserProfile(),
          fetchPublicServices(),
          fetchVehicles(),
          fetchRecentOrders(),
          fetchDashboardStats(),
        ]);

        setProfile(userProfile);
        setServices(serviceList);
        setVehicles(vehicleList);
        setRecentOrders(orderList);
        setStats(dashboardStats);

        const activeBooking = orderList.find((order) =>
          ['pending', 'confirmed', 'in_service', 'ready_for_pickup'].includes(order.orderStatus)
        );
        setCurrentBooking(activeBooking ?? null);

        setNotificationCount(orderList.filter((order) => !['completed', 'cancelled'].includes(order.orderStatus)).length);
      } catch (fetchError) {
        setError('Unable to load dashboard data. Pull to refresh or try again.');
      } finally {
        const elapsed = Date.now() - loadStartTime;
        const minimumDelay = 400;
        if (elapsed < minimumDelay) {
          setTimeout(() => {
            setLoading(false);
            setRefreshing(false);
          }, minimumDelay - elapsed);
        } else {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void loadContent();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const topServices = useMemo(() => services.filter((item) => item.popular || item.featured).slice(0, 4), [services]);
  const filteredServices = useMemo(
    () => services.filter((service) => service.name.toLowerCase().includes(searchText.toLowerCase())),
    [searchText, services]
  );
  const displayServices = searchText.trim().length ? filteredServices : topServices;

  const activeVehicle = vehicles[0];

  const heroImage = displayServices[0]?.thumbnailImage;

  const onRefresh = () => {
    setRefreshing(true);
    setError('');
    void (async () => {
      try {
        const [userProfile, serviceList, vehicleList, orderList, dashboardStats] = await Promise.all([
          fetchUserProfile(),
          fetchPublicServices(),
          fetchVehicles(),
          fetchRecentOrders(),
          fetchDashboardStats(),
        ]);

        setProfile(userProfile);
        setServices(serviceList);
        setVehicles(vehicleList);
        setRecentOrders(orderList);
        setStats(dashboardStats);

        const activeBooking = orderList.find((order) =>
          ['pending', 'confirmed', 'in_service', 'ready_for_pickup'].includes(order.orderStatus)
        );
        setCurrentBooking(activeBooking ?? null);

        setNotificationCount(orderList.filter((order) => !['completed', 'cancelled'].includes(order.orderStatus)).length);
      } catch {
        setError('Unable to refresh dashboard content. Try again later.');
      } finally {
        setRefreshing(false);
      }
    })();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      >
        <View style={styles.topHeader}>
          <View style={styles.titleBlock}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{profile?.fullName ?? 'Customer'}</Text>
          </View>
          <View style={styles.metaActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Text style={styles.iconText}>🔔</Text>
              {notificationCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{profile?.fullName?.[0]?.toUpperCase() ?? 'M'}</Text>
            </View>
          </View>
        </View>

        <TextInput
          placeholder="Search services..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />

        <View style={styles.heroCard}>
          <View style={styles.heroText}>
            <Text style={styles.heroBadge}>Free Pickup & Drop</Text>
            <Text style={styles.heroTitle}>Book Professional Car Service</Text>
            <Text style={styles.heroSubtitle}>Premium care for every ride, right at your doorstep.</Text>
            <TouchableOpacity style={styles.heroButton} activeOpacity={0.8}>
              <Text style={styles.heroButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Text style={styles.heroImageLabel}>Car</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Vehicle</Text>
          </View>
          {loading ? (
            <View style={styles.skeletonCard}>
              <View style={styles.skeletonBlockLarge} />
              <View style={styles.skeletonBlockMedium} />
              <View style={[styles.skeletonBlockMedium, { width: '70%' }]} />
            </View>
          ) : activeVehicle ? (
            <View style={styles.vehicleCard}>
              <View style={styles.vehicleImage}>
                <Text style={styles.vehicleImageLabel}>Vehicle</Text>
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{`${activeVehicle.make} ${activeVehicle.modelName}`}</Text>
                <Text style={styles.vehicleMeta}>{activeVehicle.plateNumber}</Text>
                <Text style={styles.vehicleMeta}>{`Last serviced ${activeVehicle.lastServiceDate ?? 'not available'}`}</Text>
                <TouchableOpacity style={styles.quickBookButton} activeOpacity={0.85}>
                  <Text style={styles.quickBookText}>Quick Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Add Your First Vehicle</Text>
              <Text style={styles.emptyText}>Register a vehicle to get the most relevant service recommendations.</Text>
              <TouchableOpacity style={styles.solidButton} activeOpacity={0.85}>
                <Text style={styles.solidButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((category) => (
              <TouchableOpacity key={category.label} style={styles.categoryChip} activeOpacity={0.8}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Services</Text>
            <Text style={styles.sectionAction}>See all</Text>
          </View>
          {loading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <View key={index} style={styles.skeletonServiceCard} />
            ))
          ) : displayServices.length > 0 ? (
            displayServices.map((service) => (
              <View key={service._id} style={styles.serviceCard}>
                {service.thumbnailImage ? (
                  <Image source={{ uri: service.thumbnailImage }} style={styles.serviceCardImage} />
                ) : (
                  <View style={styles.serviceCardImage}>
                    <Text style={styles.serviceCardImageLabel}>Service</Text>
                  </View>
                )}
                <View style={styles.serviceCardContent}>
                  <Text style={styles.serviceCardTitle}>{service.name}</Text>
                  <Text style={styles.serviceCardDescription}>{service.description ?? 'Premium vehicle service designed for your needs.'}</Text>
                  <View style={styles.serviceStatsRow}>
                    <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
                    <Text style={styles.serviceTime}>45 min</Text>
                  </View>
                  <View style={styles.serviceFooter}>
                    <Text style={styles.serviceRating}>⭐ {service.rating ?? 4.8}</Text>
                    <TouchableOpacity style={styles.bookNowButton} activeOpacity={0.85}>
                      <Text style={styles.bookNowText}>Book Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No services match your search</Text>
              <Text style={styles.emptyStateText}>Try another keyword or browse popular service categories.</Text>
            </View>
          )}
        </View>

        {currentBooking ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Booking</Text>
            <View style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingStatus}>{currentBooking.orderStatus.replace(/_/g, ' ')}</Text>
                <Text style={styles.bookingAmount}>{formatCurrency(currentBooking.totalAmount ?? 0)}</Text>
              </View>
              <Text style={styles.bookingTitle}>{currentBooking.orderId}</Text>
              <Text style={styles.bookingMeta}>{`${currentBooking.booking?.bookingDate ? new Date(currentBooking.booking.bookingDate).toLocaleDateString() : 'No date'} • ${currentBooking.booking?.preferredTime ?? 'N/A'}`}</Text>
              <Text style={styles.bookingMeta}>{currentBooking.booking?.address ?? currentBooking.vehicle?.plateNumber ?? 'No address available'}</Text>
              <TouchableOpacity style={styles.bookingButton} activeOpacity={0.85}>
                <Text style={styles.bookingButtonText}>View Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose M Enterprises</Text>
          <View style={styles.featureGrid}>
            {featureCards.map((item) => (
              <View key={item.title} style={styles.featureCard}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureText}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {loading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <View key={index} style={styles.skeletonOrderCard} />
            ))
          ) : recentOrders.length > 0 ? (
            recentOrders.slice(0, 3).map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderRow}>
                  <Text style={styles.orderId}>{order.orderId}</Text>
                  <Text style={styles.orderStatus}>{order.orderStatus.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.orderMeta}>{order.booking?.bookingDate ? new Date(order.booking.bookingDate).toLocaleDateString() : 'No schedule yet'}</Text>
                <Text style={styles.orderMeta}>{order.booking?.address ?? order.vehicle?.plateNumber ?? 'No details available'}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No recent orders yet</Text>
              <Text style={styles.emptyStateText}>Completed service orders will appear here when available.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}> 
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {mockReviews.length > 0 ? (
            mockReviews.map((review) => (
              <View key={review.title} style={styles.reviewCard}>
                <Text style={styles.reviewAuthor}>{review.author}</Text>
                <Text style={styles.reviewTitle}>{review.title}</Text>
                <Text style={styles.reviewText}>{review.details}</Text>
                <Text style={styles.reviewRating}>⭐ {review.rating.toFixed(1)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>Reviews will appear here</Text>
              <Text style={styles.emptyStateText}>Customer feedback will show once bookings are completed.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.emergencyButton} activeOpacity={0.85}>
        <View style={styles.emergencyRow}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <View>
            <Text style={styles.emergencyTitle}>Emergency Assistance</Text>
            <Text style={styles.emergencySubtitle}>Roadside help whenever you need it.</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 200,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  userName: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
  },
  metaActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  iconText: {
    fontSize: 18,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563eb',
  },
  searchInput: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#0f172a',
    fontSize: 15,
  },
  heroCard: {
    backgroundColor: '#2563eb',
    borderRadius: 28,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
    paddingRight: 14,
  },
  heroBadge: {
    color: '#dbeafe',
    fontWeight: '700',
    marginBottom: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
    lineHeight: 32,
  },
  heroSubtitle: {
    color: '#dbeafe',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  heroButtonText: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
  heroImagePlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageLabel: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '900',
  },
  sectionAction: {
    color: '#2563eb',
    fontWeight: '700',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  heroImage: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  skeletonCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
  },
  skeletonBlockLarge: {
    height: 18,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
    width: '80%',
  },
  skeletonBlockMedium: {
    height: 14,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    marginBottom: 10,
    width: '60%',
  },
  skeletonServiceCard: {
    height: 160,
    backgroundColor: '#e2e8f0',
    borderRadius: 22,
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  vehicleImage: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleImageLabel: {
    color: '#1d4ed8',
    fontSize: 15,
    fontWeight: '900',
  },
  vehicleDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  vehicleName: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  vehicleMeta: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 4,
  },
  quickBookButton: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickBookText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 16,
  },
  solidButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  solidButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  categoryScroll: {
    paddingVertical: 8,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 110,
  },
  categoryIcon: {
    fontSize: 18,
    marginBottom: 8,
  },
  categoryLabel: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  serviceCardImage: {
    height: 160,
    backgroundColor: '#e0efff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCardImageLabel: {
    color: '#1d4ed8',
    fontSize: 18,
    fontWeight: '900',
  },
  serviceCardContent: {
    padding: 18,
  },
  serviceCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  serviceCardDescription: {
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 14,
  },
  serviceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  servicePrice: {
    color: '#2563eb',
    fontWeight: '900',
    fontSize: 16,
  },
  serviceTime: {
    color: '#64748b',
    fontWeight: '700',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceRating: {
    color: '#0f172a',
    fontWeight: '700',
  },
  bookNowButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  bookNowText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bookingStatus: {
    color: '#2563eb',
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  bookingAmount: {
    color: '#0f172a',
    fontWeight: '900',
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  bookingMeta: {
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 10,
  },
  bookingButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookingButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  skeletonOrderCard: {
    height: 100,
    backgroundColor: '#e2e8f0',
    borderRadius: 22,
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 14,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderId: {
    color: '#0f172a',
    fontWeight: '900',
  },
  orderStatus: {
    color: '#2563eb',
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  orderMeta: {
    color: '#64748b',
    lineHeight: 20,
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '900',
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#64748b',
    lineHeight: 22,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  featureText: {
    color: '#64748b',
    lineHeight: 20,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 14,
  },
  reviewAuthor: {
    color: '#2563eb',
    fontWeight: '800',
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  reviewText: {
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewRating: {
    color: '#0f172a',
    fontWeight: '800',
  },
  emergencyButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 104,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    padding: 18,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emergencyIcon: {
    fontSize: 24,
  },
  emergencyTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  emergencySubtitle: {
    color: '#64748b',
    marginTop: 4,
  },
});

export default HomeDashboard;
