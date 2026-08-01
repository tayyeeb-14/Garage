import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BadgeCheck,
  Battery,
  Bell,
  BookOpen,
  Car,
  Circle,
  Clock3,
  Cog,
  Droplets,
  Gauge,
  Gift,
  LayoutGrid,
  MapPin,
  Navigation,
  Recycle,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Truck,
  Wrench,
  CircleStop,
} from 'lucide-react-native';
import { TabKey } from '../components/BottomTabBar';
import HeroBannerCarousel from '../components/home/HeroBannerCarousel';
import IconCircle from '../components/ui/IconCircle';
import PremiumButton from '../components/ui/PremiumButton';
import SectionHeader from '../components/ui/SectionHeader';
import { colors, iconSize, iconStroke, radius, shadow, spacing, typography } from '../theme/tokens';
import {
  DashboardOrder,
  DashboardStats,
  fetchDashboardStats,
  fetchPublicServices,
  fetchRecentOrders,
  fetchTopServices,
  fetchUserProfile,
  fetchVehicles,
  Profile,
  PublicPart,
  PublicService,
  Vehicle,
} from '../services/dashboardService';
import { getPublicPartsCached } from '../hooks/usePublicParts';
import { formatCurrency } from '../utils/currency';
import { fetchActiveBanners, MobileBanner } from '../services/bannerService';

const categoryItems = [
  { label: 'Full Service', icon: Wrench },
  { label: 'Oil Change', icon: Droplets },
  { label: 'Brake', icon: CircleStop },
  { label: 'Battery', icon: Battery },
  { label: 'Engine', icon: Cog },
  { label: 'Tyre', icon: Circle },
  { label: 'Washing', icon: Sparkles },
  { label: 'Pickup', icon: Truck },
  { label: 'Scrap', icon: Recycle },
  { label: 'View All', icon: LayoutGrid },
];

const whyChooseUs = [
  { title: 'Expert Mechanics', description: 'Certified technicians for every service.', icon: Wrench },
  { title: 'Genuine Parts', description: 'Original components you can trust.', icon: Shield },
  { title: 'Transparent Pricing', description: 'Clear quotes with no hidden fees.', icon: Tag },
  { title: 'Doorstep Pickup', description: 'We collect and return your vehicle.', icon: Truck },
  { title: 'Fast Service', description: 'Quick turnaround without compromise.', icon: Clock3 },
  { title: 'Warranty', description: 'Work backed by reliable aftercare.', icon: ShieldCheck },
];

const quickActions = [
  { label: 'Book Service', icon: Wrench, tab: 'services' as TabKey },
  { label: 'Bookings', icon: BookOpen, openBookings: true },
  { label: 'Track Service', icon: Navigation, openBookings: true },
  { label: 'Offers', icon: Gift, tab: null },
];

type HomeDashboardProps = {
  onNavigateTab?: (tab: TabKey) => void;
  onOpenMyBookings?: () => void;
  onOpenServiceDetail?: (serviceId: string) => void;
};

const HomeDashboard = ({ onNavigateTab, onOpenMyBookings, onOpenServiceDetail }: HomeDashboardProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [topServices, setTopServices] = useState<PublicService[]>([]);
  const [spareParts, setSpareParts] = useState<PublicPart[]>([]);
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
  const [banners, setBanners] = useState<MobileBanner[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const offerSectionY = useRef(0);

  const loadDashboard = async (isRefresh = false) => {
    setError('');
    const loadStartTime = Date.now();
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const [userProfile, serviceList, topServiceList, productList, vehicleList, orderList, dashboardStats, activeBanners] = await Promise.all([
        fetchUserProfile(),
        fetchPublicServices(),
        fetchTopServices(),
        getPublicPartsCached({ limit: 8 }),
        fetchVehicles(),
        fetchRecentOrders(),
        fetchDashboardStats(),
        fetchActiveBanners(),
      ]);

      setProfile(userProfile);
      setServices(serviceList);
      setTopServices(topServiceList);
      setSpareParts(productList);
      setVehicles(vehicleList);
      setRecentOrders(orderList);
      setStats(dashboardStats);
      setBanners(activeBanners);

      const activeBooking = orderList.find((order) =>
        ['pending', 'confirmed', 'in_service', 'ready_for_pickup'].includes(order.orderStatus),
      );
      setCurrentBooking(activeBooking ?? null);
      setNotificationCount(orderList.filter((order) => !['completed', 'cancelled'].includes(order.orderStatus)).length);
    } catch {
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

  useEffect(() => {
    void loadDashboard();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const activeVehicle = vehicles[0];
  const activeBanner = banners[bannerIndex] ?? null;
  const offerBanner = banners.length > 1 ? banners[(bannerIndex + 1) % banners.length] : activeBanner;

  const nextServiceDate = useMemo(() => {
    if (!activeVehicle?.lastServiceDate) return null;
    const parsedDate = new Date(activeVehicle.lastServiceDate);
    if (Number.isNaN(parsedDate.getTime())) return null;
    const nextDate = new Date(parsedDate);
    nextDate.setMonth(nextDate.getMonth() + 6);
    return nextDate;
  }, [activeVehicle]);

  const daysUntilReminder = useMemo(() => {
    if (!nextServiceDate) return null;
    return Math.max(0, Math.ceil((nextServiceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [nextServiceDate]);

  const filteredServices = useMemo(
    () => services.filter((service) => service.name.toLowerCase().includes(searchText.toLowerCase())),
    [searchText, services],
  );

  const popularServices = useMemo(() => {
    if (searchText.trim().length) return filteredServices;
    if (topServices.length) return topServices;
    return services.filter((item) => item.isFeatured || item.popular || item.featured).slice(0, 6);
  }, [filteredServices, searchText, services, topServices]);

  const heroFallbackImage = popularServices[0]?.thumbnailImage;

  useEffect(() => {
    if (!banners.length) return undefined;
    const timer = setInterval(() => setBannerIndex((value) => (value + 1) % banners.length), 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadDashboard(true);
  };

  const scrollToOffers = () => {
    scrollRef.current?.scrollTo({ y: offerSectionY.current, animated: true });
  };

  const formatServiceDuration = (service: PublicService) => {
    const minutes = service.estimatedDuration ?? 60;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  };

  const reviewOrders = useMemo(
    () => recentOrders.filter((order) => order.orderStatus === 'completed').slice(0, 3),
    [recentOrders],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBright} />}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* 1. Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{profile?.fullName ?? 'Customer'}</Text>
            <Pressable style={styles.locationRow}>
              <IconCircle size={28} backgroundColor={colors.secondary}>
                <MapPin size={14} color={colors.primaryBright} strokeWidth={iconStroke} />
              </IconCircle>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationLabel}>Service location</Text>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {profile?.phone ? `Registered • ${profile.phone}` : 'Doorstep garage service'}
                </Text>
              </View>
            </Pressable>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressed]}
              onPress={() => onNavigateTab?.('notifications')}
            >
              <Bell size={iconSize} color={colors.text} strokeWidth={iconStroke} />
              {notificationCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
              onPress={() => onNavigateTab?.('profile')}
            >
              <Text style={styles.avatarText}>{profile?.fullName?.[0]?.toUpperCase() ?? 'M'}</Text>
            </Pressable>
          </View>
        </View>

        {/* 2. Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={iconSize} color={colors.textMuted} strokeWidth={iconStroke} />
            <TextInput
              placeholder="Search services, parts..."
              placeholderTextColor={colors.textLight}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
            <Pressable style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}>
              <SlidersHorizontal size={18} color={colors.primaryBright} strokeWidth={iconStroke} />
            </Pressable>
          </View>
          <Pressable style={({ pressed }) => [styles.locationChip, pressed && styles.pressed]}>
            <MapPin size={14} color={colors.primaryBright} strokeWidth={iconStroke} />
            <Text style={styles.locationChipText}>Near me</Text>
          </Pressable>
        </View>

        {/* 3. Hero Banner */}
        <HeroBannerCarousel
          banners={banners}
          bannerIndex={bannerIndex}
          onIndexChange={setBannerIndex}
          fallbackImage={heroFallbackImage}
          onBookPress={() => onNavigateTab?.('services')}
        />

        {/* 4. Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Pressable
                  key={action.label}
                  style={({ pressed }) => [styles.quickActionCard, pressed && styles.pressed]}
                  onPress={() => {
                    if (action.openBookings) onOpenMyBookings?.();
                    else if (action.tab) onNavigateTab?.(action.tab);
                    else scrollToOffers();
                  }}
                >
                  <IconCircle size={58} backgroundColor={colors.primarySoft}>
                    <Icon size={26} color={colors.primaryBright} strokeWidth={iconStroke} />
                  </IconCircle>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 5. Service Categories */}
        <View style={styles.section}>
          <SectionHeader title="Service Categories" actionLabel="View all" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {categoryItems.map((category) => {
              const Icon = category.icon;
              return (
                <Pressable
                  key={category.label}
                  style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}
                  onPress={() => onNavigateTab?.('services')}
                >
                  <IconCircle size={60} backgroundColor={colors.primarySoft}>
                    <Icon size={26} color={colors.primaryBright} strokeWidth={iconStroke} />
                  </IconCircle>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 6. My Vehicle */}
        <View style={styles.section}>
          <SectionHeader title="My Vehicle" />
          {loading ? (
            <View style={styles.skeletonCard}>
              <View style={styles.skeletonLineLarge} />
              <View style={styles.skeletonLineMedium} />
              <View style={styles.skeletonLineSmall} />
            </View>
          ) : activeVehicle ? (
            <View style={styles.vehicleCard}>
              <View style={styles.vehicleImageSection}>
                <View style={styles.vehicleImageBg}>
                  <Car size={48} color={colors.primaryBright} strokeWidth={iconStroke} />
                </View>
                <View style={styles.vehicleStatusBadge}>
                  <Text style={styles.vehicleStatusText}>Primary</Text>
                </View>
              </View>
              <View style={styles.vehicleBody}>
                <Text style={styles.vehicleName}>{`${activeVehicle.make} ${activeVehicle.modelName}`}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>{activeVehicle.plateNumber}</Text>
                  </View>
                  {activeVehicle.year ? (
                    <View style={[styles.infoBadge, styles.infoBadgeMuted]}>
                      <Text style={styles.infoBadgeTextMuted}>{activeVehicle.year}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.vehicleMetaRow}>
                  <Clock3 size={14} color={colors.textMuted} strokeWidth={iconStroke} />
                  <Text style={styles.vehicleMeta}>
                    Last service: {activeVehicle.lastServiceDate
                      ? new Date(activeVehicle.lastServiceDate).toLocaleDateString()
                      : 'Not recorded'}
                  </Text>
                </View>
                <View style={styles.vehicleMetaRow}>
                  <Gauge size={14} color={colors.textMuted} strokeWidth={iconStroke} />
                  <Text style={styles.vehicleMeta}>
                    Next reminder: {nextServiceDate ? nextServiceDate.toLocaleDateString() : 'Schedule soon'}
                  </Text>
                </View>
                <PremiumButton
                  label="Book Again"
                  compact
                  onPress={() => onNavigateTab?.('services')}
                  style={styles.vehicleCta}
                />
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <IconCircle size={64} backgroundColor={colors.primarySoft}>
                <Car size={28} color={colors.primaryBright} strokeWidth={iconStroke} />
              </IconCircle>
              <Text style={styles.emptyTitle}>Add your first vehicle</Text>
              <Text style={styles.emptyText}>Register a vehicle to get personalised service recommendations.</Text>
            </View>
          )}
        </View>

        {/* 7. Upcoming Service Reminder */}
        <View style={styles.section}>
          <SectionHeader title="Upcoming Service Reminder" />
          <View style={styles.reminderCard}>
            <View style={styles.reminderTop}>
              <View>
                <Text style={styles.reminderCountdown}>
                  {daysUntilReminder !== null ? `${daysUntilReminder} days` : '--'}
                </Text>
                <Text style={styles.reminderCaption}>until recommended service</Text>
              </View>
              <IconCircle size={52} backgroundColor={colors.accent}>
                <Clock3 size={22} color={colors.primaryBright} strokeWidth={iconStroke} />
              </IconCircle>
            </View>
            <Text style={styles.reminderText}>
              {currentBooking
                ? `Active order ${currentBooking.orderId} is in progress.`
                : nextServiceDate
                  ? `Recommended service by ${nextServiceDate.toLocaleDateString()}`
                  : 'Schedule your next service to keep your vehicle in top condition.'}
            </Text>
            <PremiumButton
              label="Schedule Service"
              variant="secondary"
              compact
              onPress={() => onNavigateTab?.('services')}
            />
          </View>
        </View>

        {/* 8. Popular Services */}
        <View style={styles.section}>
          <SectionHeader title="Popular Services" actionLabel="See all" onActionPress={() => onNavigateTab?.('services')} />
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={styles.skeletonServiceCard} />
              ))}
            </ScrollView>
          ) : popularServices.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {popularServices.map((service) => (
                <Pressable
                  key={service._id}
                  style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
                  onPress={() => onOpenServiceDetail?.(service._id) ?? onNavigateTab?.('services')}
                >
                  <View style={styles.serviceImageWrap}>
                    {service.thumbnailImage ? (
                      <Image source={{ uri: service.thumbnailImage }} style={styles.serviceImage} />
                    ) : (
                      <View style={styles.serviceImagePlaceholder}>
                        <Wrench size={32} color={colors.primaryBright} strokeWidth={iconStroke} />
                      </View>
                    )}
                    {service.rating ? (
                      <View style={styles.serviceRatingBadge}>
                        <Star size={11} color={colors.warning} fill={colors.warning} strokeWidth={0} />
                        <Text style={styles.serviceRatingText}>{service.rating.toFixed(1)}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.serviceBody}>
                    <View style={styles.serviceTitleRow}>
                      <Text style={styles.serviceName} numberOfLines={2}>{service.name}</Text>
                    </View>
                    <Text style={styles.servicePriceLabel}>Starting at</Text>
                    <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
                    <View style={styles.serviceMetaRow}>
                      <Clock3 size={13} color={colors.textMuted} strokeWidth={iconStroke} />
                      <Text style={styles.serviceMeta}>{formatServiceDuration(service)}</Text>
                      {service.bookings ? (
                        <Text style={styles.serviceMeta}>• {service.bookings} bookings</Text>
                      ) : null}
                    </View>
                    <PremiumButton
                      label="Book Now"
                      compact
                      onPress={() => onOpenServiceDetail?.(service._id) ?? onNavigateTab?.('services')}
                      style={styles.serviceCta}
                    />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No services available</Text>
              <Text style={styles.emptyText}>Check back soon for new service offerings.</Text>
            </View>
          )}
        </View>

        {/* 9. Offer Banner */}
        <View
          style={styles.section}
          onLayout={(event) => {
            offerSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <SectionHeader title="Special Offers" />
          <View style={styles.offerCard}>
            <View style={styles.offerGlow} />
            <View style={styles.offerBadge}>
              <Gift size={14} color="#FFFFFF" strokeWidth={iconStroke} />
              <Text style={styles.offerBadgeText}>Limited offer</Text>
            </View>
            <Text style={styles.offerTitle}>{offerBanner?.title ?? 'Premium care packages'}</Text>
            <Text style={styles.offerSubtitle}>
              {offerBanner?.subtitle ?? 'Exclusive deals on full service and doorstep pickup.'}
            </Text>
            <PremiumButton
              label={offerBanner?.ctaText ?? 'Explore Offers'}
              onPress={() => {
                if (offerBanner?.ctaAction === 'external' && offerBanner.targetUrl) {
                  void Linking.openURL(offerBanner.targetUrl);
                } else {
                  onNavigateTab?.('services');
                }
              }}
              style={styles.offerCta}
            />
          </View>
        </View>

        {/* 10. Spare Parts */}
        <View style={styles.section}>
          <SectionHeader title="Spare Parts" actionLabel="See all" onActionPress={() => onNavigateTab?.('parts')} />
          {loading ? (
            <ActivityIndicator color={colors.primaryBright} style={{ marginVertical: spacing.md }} />
          ) : spareParts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {spareParts.map((part) => (
                <View key={part._id} style={styles.partCard}>
                  <View style={styles.partImageWrap}>
                    {part.image ? (
                      <Image source={{ uri: part.image }} style={styles.partImage} />
                    ) : (
                      <Wrench size={28} color={colors.primaryBright} strokeWidth={iconStroke} />
                    )}
                    {part.isFeatured ? (
                      <View style={styles.partFeaturedBadge}>
                        <Text style={styles.partFeaturedText}>Featured</Text>
                      </View>
                    ) : null}
                    {part.status === 'Low Stock' ? (
                      <View style={styles.partLowStockBadge}>
                        <Text style={styles.partLowStockText}>Low Stock</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.partBrand}>{part.brand || part.category || 'Genuine part'}</Text>
                  <Text style={styles.partName} numberOfLines={2}>{part.itemName}</Text>
                  <Text style={styles.partPrice}>{formatCurrency(part.sellingPrice)}</Text>
                  {part.originalPrice && part.originalPrice > part.sellingPrice ? (
                    <Text style={styles.partOldPrice}>{formatCurrency(part.originalPrice)}</Text>
                  ) : null}
                  <View style={styles.partFooter}>
                    <Text style={[styles.partStock, part.status === 'Low Stock' && styles.partStockLow]}>
                      {part.status === 'Low Stock' ? `Only ${part.quantity} left` : `${part.quantity} in stock`}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No spare parts listed</Text>
              <Text style={styles.emptyText}>Parts from our inventory will appear here when available.</Text>
            </View>
          )}
        </View>

        {/* 11. Why Choose Us */}
        <View style={styles.section}>
          <SectionHeader title="Why Choose Us" />
          <View style={styles.featureGrid}>
            {whyChooseUs.map((feature) => {
              const Icon = feature.icon;
              return (
                <View key={feature.title} style={styles.featureCard}>
                  <IconCircle size={44} backgroundColor={colors.primarySoft}>
                    <Icon size={20} color={colors.primaryBright} strokeWidth={iconStroke} />
                  </IconCircle>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureText}>{feature.description}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 12. Customer Reviews */}
        <View style={styles.section}>
          <SectionHeader title="Customer Reviews" />
          {reviewOrders.length > 0 ? (
            reviewOrders.map((order) => (
              <View key={order._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAuthorRow}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>
                        {(order.customer?.fullName ?? profile?.fullName ?? 'C')[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <View style={styles.verifiedRow}>
                        <Text style={styles.reviewAuthor}>{order.customer?.fullName ?? profile?.fullName ?? 'Customer'}</Text>
                        <BadgeCheck size={14} color={colors.primaryBright} strokeWidth={iconStroke} />
                      </View>
                      <Text style={styles.reviewDate}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewService}>
                  {order.services?.map((item) => item.name).filter(Boolean).join(', ') || 'Garage service'}
                </Text>
                <Text style={styles.reviewText}>
                  Completed service order {order.orderId} with transparent pricing and professional care.
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptyText}>Verified customer reviews will appear after completed services.</Text>
            </View>
          )}
        </View>

        {/* 13. Emergency Assistance */}
        <View style={styles.section}>
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyGradientTop} />
            <View style={styles.emergencyGradientBottom} />
            <View style={styles.emergencyTop}>
              <View style={styles.emergencyCopy}>
                <Text style={styles.emergencyTitle}>Emergency Assistance</Text>
                <Text style={styles.emergencySubtitle}>Roadside help whenever you need it.</Text>
              </View>
              <View style={styles.emergencyBadge}>
                <Text style={styles.emergencyBadgeText}>24×7</Text>
              </View>
            </View>
            <View style={styles.emergencyIllustration}>
              <View style={styles.emergencyTruckCircle}>
                <Truck size={40} color="#FFFFFF" strokeWidth={iconStroke} />
              </View>
            </View>
            <View style={styles.emergencyActions}>
              <PremiumButton
                label="Call Now"
                compact
                onPress={() => void Linking.openURL('tel:+911800000000')}
                style={styles.emergencyBtn}
              />
              <PremiumButton
                label="WhatsApp"
                compact
                variant="outline"
                onPress={() => void Linking.openURL('https://wa.me/911800000000')}
                style={styles.emergencyBtn}
              />
            </View>
          </View>
        </View>

        {/* 14. Recent Orders */}
        <View style={styles.section}>
          <SectionHeader title="Recent Orders" actionLabel="View all" onActionPress={() => onOpenMyBookings?.()} />
          {loading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <View key={index} style={styles.skeletonOrderCard} />
            ))
          ) : recentOrders.length > 0 ? (
            recentOrders.slice(0, 4).map((order, index) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderTimeline}>
                  <View style={[styles.timelineDot, index === 0 ? styles.timelineDotActive : null]} />
                  {index < Math.min(recentOrders.length, 4) - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.orderBody}>
                  <View style={styles.orderHeader}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{order.orderStatus.replace(/_/g, ' ')}</Text>
                    </View>
                    <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount ?? 0)}</Text>
                  </View>
                  <Text style={styles.orderId}>{order.orderId}</Text>
                  <Text style={styles.orderMeta}>
                    {order.booking?.bookingDate
                      ? new Date(order.booking.bookingDate).toLocaleDateString()
                      : 'No schedule'}{' '}
                    • {order.booking?.preferredTime ?? 'N/A'}
                  </Text>
                  <Text style={styles.orderMeta} numberOfLines={1}>
                    {order.services?.map((item) => item.name).filter(Boolean).join(', ')
                      || order.booking?.address
                      || order.vehicle?.plateNumber
                      || 'Service details'}
                  </Text>
                  <PremiumButton
                    label="Track"
                    compact
                    variant="secondary"
                    onPress={() => onOpenMyBookings?.()}
                    style={styles.trackBtn}
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No recent orders</Text>
              <Text style={styles.emptyText}>Your completed service orders will appear here.</Text>
            </View>
          )}
        </View>

        {stats ? (
          <Text style={styles.statsCaption}>
            {stats.services} services • {stats.orders} orders served
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: spacing.lg, paddingHorizontal: spacing.md, paddingBottom: 184 },
  contentWide: { paddingHorizontal: spacing.lg },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  heroCluster: { gap: spacing.md, marginBottom: spacing.lg },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 24,
    paddingVertical: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    ...shadow.float,
  },
  headerLeft: { flex: 1, paddingRight: spacing.xs },
  greeting: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  userName: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  heroSubtitle: { ...typography.subtitle, marginBottom: spacing.md },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: { flex: 1 },
  locationLabel: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  locationValue: { color: colors.textMuted, fontWeight: '600', fontSize: 13, lineHeight: 18, marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start' },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#DCE7FF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  avatarText: { color: colors.primaryBright, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  searchCard: { gap: spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.card,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, color: colors.text, fontSize: 15, fontWeight: '500', paddingVertical: spacing.sm },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  locationChipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  bannerFrame: { borderRadius: radius.xl, overflow: 'hidden', ...shadow.float },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryCard: {
    flexGrow: 1,
    flexBasis: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    ...shadow.card,
  },
  summaryLabel: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 6 },
  summaryMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  quickRail: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  quickActionCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  quickActionLabel: { ...typography.cardTitle, fontSize: 14, textAlign: 'center' },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  horizontalScroll: { paddingVertical: spacing.xs, gap: spacing.md },
  categoryCard: {
    width: 108,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: { color: colors.text, fontWeight: '700', fontSize: 12, textAlign: 'center' },
  dualGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap' },
  vehicleCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  vehicleImageSection: { width: 112, alignItems: 'center', justifyContent: 'center' },
  vehicleImageBg: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleStatusBadge: {
    position: 'absolute',
    top: -4,
    backgroundColor: colors.primaryBright,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  vehicleStatusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  vehicleBody: { flex: 1 },
  vehicleName: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  infoBadgeMuted: { backgroundColor: colors.secondary },
  infoBadgeText: { color: colors.primaryBright, fontWeight: '800', fontSize: 12 },
  infoBadgeTextMuted: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  vehicleMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  vehicleMeta: { color: colors.textMuted, fontSize: 13, fontWeight: '500', flex: 1 },
  vehicleCta: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  reminderCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  reminderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  reminderCountdown: { fontSize: 30, fontWeight: '800', color: colors.primaryBright, letterSpacing: -0.5 },
  reminderCaption: { color: colors.textMuted, fontWeight: '600', fontSize: 13, marginTop: 4 },
  reminderText: { ...typography.subtitle, marginBottom: spacing.md },
  serviceCard: {
    width: 300,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  serviceImageWrap: { position: 'relative', width: '100%', height: 180 },
  serviceImage: { width: '100%', height: 180, backgroundColor: colors.secondary },
  serviceImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRatingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  serviceRatingText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  serviceBody: { padding: spacing.md },
  serviceName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  servicePriceLabel: { ...typography.caption, color: colors.textLight },
  servicePrice: { color: colors.primaryBright, fontSize: 20, fontWeight: '800', marginBottom: spacing.sm },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md, flexWrap: 'wrap' },
  serviceMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  serviceCta: { alignSelf: 'stretch' },
  partCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadow.card,
  },
  partImageWrap: {
    height: 120,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  partImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  partFeaturedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primaryBright,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  partFeaturedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  partLowStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  partLowStockText: { color: '#92400e', fontSize: 10, fontWeight: '800' },
  partBrand: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  partName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4, paddingHorizontal: spacing.md },
  partPrice: { color: colors.primaryBright, fontSize: 18, fontWeight: '800', marginBottom: 2, paddingHorizontal: spacing.md },
  partOldPrice: {
    color: colors.textLight,
    fontSize: 13,
    textDecorationLine: 'line-through',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  partFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  partStock: { color: colors.success, fontSize: 11, fontWeight: '700', flex: 1 },
  partStockLow: { color: '#d97706' },
  promoCard: { backgroundColor: '#0F172A', borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden', minHeight: 220 },
  promoGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37,99,235,0.35)',
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  promoBadgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  promoTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', lineHeight: 26, marginBottom: spacing.sm },
  promoSubtitle: { ...typography.subtitle, color: 'rgba(255,255,255,0.88)', marginBottom: spacing.md },
  promoCta: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', minWidth: 140 },
  emergencyCard: { backgroundColor: '#1E3A8A', borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden', minHeight: 220 },
  emergencyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  emergencyCopy: { flex: 1, paddingRight: spacing.md },
  emergencyTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  emergencySubtitle: { ...typography.subtitle, marginTop: spacing.xs, color: 'rgba(255,255,255,0.82)' },
  emergencyBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  emergencyBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  emergencyIllustration: { alignItems: 'center', marginBottom: spacing.md },
  emergencyTruckCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyActions: { flexDirection: 'row', gap: spacing.sm },
  emergencyBtn: { flex: 1 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  featureCard: {
    width: '48%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
  },
  featureTitle: { ...typography.cardTitle },
  featureText: { ...typography.subtitle, fontSize: 13 },
  reviewCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  reviewAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { color: colors.primaryBright, fontWeight: '800', fontSize: 16 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewAuthor: { color: colors.text, fontWeight: '800', fontSize: 14 },
  reviewDate: { color: colors.textLight, fontSize: 12, fontWeight: '600', marginTop: 2 },
  reviewService: { color: colors.primaryBright, fontWeight: '700', fontSize: 13, marginBottom: spacing.sm },
  reviewText: { ...typography.subtitle },
  orderCard: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  orderTimeline: { alignItems: 'center', width: 20, paddingTop: 6 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  timelineDotActive: { backgroundColor: colors.primaryBright },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
    minHeight: 80,
  },
  orderBody: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  statusBadge: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statusBadgeText: { color: colors.primaryBright, fontWeight: '800', fontSize: 11, textTransform: 'capitalize' },
  orderAmount: { color: colors.text, fontWeight: '800', fontSize: 15 },
  orderId: { color: colors.text, fontWeight: '800', fontSize: 15, marginBottom: 4 },
  orderMeta: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  trackBtn: { alignSelf: 'flex-start', marginTop: spacing.sm },
  emptyCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptyText: { ...typography.subtitle, textAlign: 'center' },
  skeletonCard: { backgroundColor: colors.secondary, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  skeletonLineLarge: { height: 20, width: '70%', backgroundColor: colors.border, borderRadius: radius.sm },
  skeletonLineMedium: { height: 14, width: '50%', backgroundColor: colors.border, borderRadius: radius.sm },
  skeletonLineSmall: { height: 14, width: '40%', backgroundColor: colors.border, borderRadius: radius.sm },
  skeletonServiceCard: { width: 280, height: 280, backgroundColor: colors.secondary, borderRadius: radius.xl, marginRight: spacing.md },
  skeletonOrderCard: { height: 110, backgroundColor: colors.secondary, borderRadius: radius.lg, marginBottom: spacing.md },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});

const styles = {
  ...baseStyles,
  container: baseStyles.screen,
  header: baseStyles.headerCard,
  headerIconBtn: baseStyles.iconButton,
  searchSection: baseStyles.searchCard,
  filterBtn: baseStyles.filterButton,
  section: baseStyles.sectionCard,
  quickActionsGrid: baseStyles.quickRail,
  serviceTitleRow: { marginBottom: spacing.xs },
  offerCard: baseStyles.promoCard,
  offerGlow: baseStyles.promoGlow,
  offerBadge: baseStyles.promoBadge,
  offerBadgeText: baseStyles.promoBadgeText,
  offerTitle: baseStyles.promoTitle,
  offerSubtitle: baseStyles.promoSubtitle,
  offerCta: baseStyles.promoCta,
  emergencyGradientTop: {
    position: 'absolute',
    top: -28,
    left: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emergencyGradientBottom: {
    position: 'absolute',
    bottom: -36,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statsCaption: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
} as const;

export default HomeDashboard;
