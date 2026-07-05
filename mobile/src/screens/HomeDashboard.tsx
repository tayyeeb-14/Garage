import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Bell, Car, ChevronRight, MapPin, Search, Sparkles, Star, Wrench } from 'lucide-react-native';
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
  { label: 'Battery', icon: '🔋' },
  { label: 'Brake', icon: '🛑' },
  { label: 'Tyres', icon: '🧱' },
  { label: 'Engine', icon: '⚙️' },
  { label: 'Wash', icon: '🚿' },
  { label: 'Inspection', icon: '🔍' },
  { label: 'Pickup', icon: '🚐' },
];

const banners = [
  { title: 'Premium doorstep service', subtitle: 'Trusted garage care at your location', accent: '#2563eb' },
  { title: 'Weekend offers', subtitle: 'Save on essential maintenance', accent: '#0f766e' },
  { title: 'Certified technicians', subtitle: 'Fast turnaround and quality checks', accent: '#7c3aed' },
];

const popularParts = [
  { name: 'Engine Oil', brand: 'Castrol', price: 1290, stock: 'In Stock' },
  { name: 'Brake Pads', brand: 'Gremi', price: 2450, stock: 'Limited' },
  { name: 'Battery', brand: 'Amaron', price: 3890, stock: 'In Stock' },
];

const reviewCards = [
  { title: 'Fast and reliable', details: 'Booked doorstep service and it arrived right on time.', rating: 4.9, author: 'Asha' },
  { title: 'Excellent support', details: 'Transparent pricing and very professional technicians.', rating: 5.0, author: 'Rahul' },
];

const featureCards = [
  { title: 'Certified Mechanics', description: 'Service handled by trained professionals.' },
  { title: 'Genuine Parts', description: 'Original parts for a reliable repair.' },
  { title: 'Doorstep Service', description: 'Pickup and delivery for complete convenience.' },
  { title: 'Service Warranty', description: 'Work backed by trusted aftercare.' },
];

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
  const [bannerIndex, setBannerIndex] = useState(0);

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

  useEffect(() => {
    const timer = setInterval(() => setBannerIndex((value) => (value + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, []);

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
            <View style={styles.locationRow}>
              <MapPin size={14} color="#64748b" />
              <Text style={styles.locationText}>Doorstep garage service • Mumbai</Text>
            </View>
          </View>
          <View style={styles.metaActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Bell size={18} color="#334155" />
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

        <View style={styles.searchWrap}>
          <Search size={18} color="#64748b" />
          <TextInput
            placeholder="Search services..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroText}>
            <View style={styles.heroBadgeRow}>
              <Sparkles size={14} color="#fff" />
              <Text style={styles.heroBadge}>Premium doorstep care</Text>
            </View>
            <Text style={styles.heroTitle}>{banners[bannerIndex].title}</Text>
            <Text style={styles.heroSubtitle}>{banners[bannerIndex].subtitle}</Text>
            <TouchableOpacity style={styles.heroButton} activeOpacity={0.8}>
              <Text style={styles.heroButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Car size={28} color="#2563eb" />
              <Text style={styles.heroImageLabel}>Garage</Text>
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
              <TouchableOpacity key={service._id} activeOpacity={0.9} style={styles.serviceCard}>
                {service.thumbnailImage ? (
                  <Image source={{ uri: service.thumbnailImage }} style={styles.serviceCardImage} />
                ) : (
                  <View style={styles.serviceCardImage}>
                    <Wrench size={28} color="#2563eb" />
                  </View>
                )}
                <View style={styles.serviceCardContent}>
                  <View style={styles.serviceCardHeaderRow}>
                    <Text style={styles.serviceCardTitle}>{service.name}</Text>
                    <View style={styles.ratingChip}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text style={styles.ratingText}>{service.rating ?? '4.8'}</Text>
                    </View>
                  </View>
                  <Text style={styles.serviceCardDescription}>{service.description ?? 'Premium vehicle service designed for your needs.'}</Text>
                  <View style={styles.serviceStatsRow}>
                    <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
                    <Text style={styles.serviceTime}>45 min</Text>
                  </View>
                  <View style={styles.serviceFooter}>
                    <Text style={styles.serviceMeta}>Doorstep pickup available</Text>
                    <TouchableOpacity style={styles.bookNowButton} activeOpacity={0.85}>
                      <Text style={styles.bookNowText}>Book Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <Text style={styles.sectionAction}>View all</Text>
          </View>
          <View style={styles.offerCard}>
            <View style={styles.offerGlow} />
            <Text style={styles.offerTag}>Limited this week</Text>
            <Text style={styles.offerTitle}>Free pickup and 10% off full service</Text>
            <Text style={styles.offerText}>Enjoy premium care with transparent pricing and quick turnaround.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Spare Parts</Text>
            <Text style={styles.sectionAction}>See parts</Text>
          </View>
          {popularParts.map((part) => (
            <View key={part.name} style={styles.partCard}>
              <View style={styles.partIconWrap}>
                <Wrench size={18} color="#2563eb" />
              </View>
              <View style={styles.partBody}>
                <Text style={styles.partName}>{part.name}</Text>
                <Text style={styles.partBrand}>{part.brand}</Text>
                <Text style={styles.partMeta}>{part.stock}</Text>
              </View>
              <View style={styles.partRight}>
                <Text style={styles.partPrice}>{formatCurrency(part.price)}</Text>
                <TouchableOpacity style={styles.partButton} activeOpacity={0.85}>
                  <Text style={styles.partButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {reviewCards.map((review) => (
            <View key={review.author} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{review.author}</Text>
                <View style={styles.ratingChip}>
                  <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.reviewTitle}>{review.title}</Text>
              <Text style={styles.reviewText}>{review.details}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Need help with a booking?</Text>
            <Text style={styles.supportText}>Our support team can help with scheduling, payments, and service updates.</Text>
            <TouchableOpacity style={styles.supportButton} activeOpacity={0.85}>
              <Text style={styles.supportButtonText}>Talk to support</Text>
            </TouchableOpacity>
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    color: '#64748b',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '600',
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
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
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadge: {
    color: '#dbeafe',
    fontWeight: '700',
    marginLeft: 6,
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
  serviceCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  ratingText: {
    color: '#92400e',
    fontWeight: '800',
    marginLeft: 4,
    fontSize: 12,
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
  serviceMeta: {
    color: '#64748b',
    fontWeight: '700',
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
  offerCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  offerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  offerTag: {
    color: '#bfdbfe',
    fontWeight: '800',
    marginBottom: 8,
  },
  offerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  offerText: {
    color: '#dbeafe',
    lineHeight: 20,
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
  partCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partBody: {
    flex: 1,
  },
  partName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  partBrand: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  partMeta: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  partRight: {
    alignItems: 'flex-end',
  },
  partPrice: {
    color: '#0f172a',
    fontWeight: '900',
    marginBottom: 8,
  },
  partButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  partButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 12,
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  supportCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  supportTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  supportText: {
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  supportButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  supportButtonText: {
    color: '#ffffff',
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
