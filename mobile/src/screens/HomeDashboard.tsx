import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Battery,
  Bell,
  BookOpen,
  Car,
  CalendarDays,
  Circle,
  CircleStop,
  Clock3,
  Droplets,
  Heart,
  Menu,
  Navigation,
  PhoneCall,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
  Wrench,
  X,
} from 'lucide-react-native';
import { TabKey } from '../components/BottomTabBar';
import HeroBannerCarousel from '../components/home/HeroBannerCarousel';
import IconCircle from '../components/ui/IconCircle';
import PremiumButton from '../components/ui/PremiumButton';
import SectionHeader from '../components/ui/SectionHeader';
import { colors, iconSize, iconStroke, radius, shadow, spacing } from '../theme/tokens';
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
  { label: 'Brake Service', icon: CircleStop },
  { label: 'Battery', icon: Battery },
  { label: 'Tyres', icon: Circle },
  { label: 'Wash & Cleaning', icon: Sparkles },
];

const quickActions = [
  { label: 'Book Service', subtitle: 'Schedule now', icon: Wrench, backgroundColor: colors.primarySoft, iconColor: colors.primaryBright, tab: 'services' as TabKey },
  { label: 'My Bookings', subtitle: 'View all', icon: CalendarDays, backgroundColor: colors.successSoft, iconColor: colors.success, openBookings: true },
  { label: 'Track Order', subtitle: 'Live status', icon: Navigation, backgroundColor: colors.accent, iconColor: colors.primaryBright, openBookings: true },
  { label: 'Emergency', subtitle: '24x7 Help', icon: PhoneCall, backgroundColor: colors.warningSoft, iconColor: colors.warning, emergency: true },
];

const normalizeText = (value: string) => value.toLowerCase().trim();

const uniqueValues = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim().length))));

type HomeDashboardProps = {
  onNavigateTab?: (tab: TabKey) => void;
  onOpenMyBookings?: () => void;
  onOpenServiceDetail?: (serviceId: string) => void;
  currentUserFullName?: string;
  unreadNotificationCount?: number;
};

type FilterType = 'category' | 'brand' | 'vehicle' | 'price' | 'availability';

const HomeDashboard = ({
  onNavigateTab,
  onOpenMyBookings,
  onOpenServiceDetail,
  currentUserFullName,
  unreadNotificationCount,
}: HomeDashboardProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [topServices, setTopServices] = useState<PublicService[]>([]);
  const [spareParts, setSpareParts] = useState<PublicPart[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [currentBooking, setCurrentBooking] = useState<DashboardOrder | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [banners, setBanners] = useState<MobileBanner[]>([]);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeBrand, setActiveBrand] = useState('');
  const [activeVehicleFilter, setActiveVehicleFilter] = useState('');
  const [activePriceFilter, setActivePriceFilter] = useState('');
  const [activeAvailabilityFilter, setActiveAvailabilityFilter] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const loadDashboard = async (isRefresh = false) => {
    setError('');
    const startedAt = Date.now();
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

      const activeBooking = orderList.find((order) => ['pending', 'confirmed', 'in_service', 'ready_for_pickup'].includes(order.orderStatus));
      setCurrentBooking(activeBooking ?? null);
    } catch {
      setError('Unable to load dashboard data. Pull to refresh or try again.');
    } finally {
      const elapsed = Date.now() - startedAt;
      const minimumDelay = 400;
      const remaining = minimumDelay - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          setLoading(false);
          setRefreshing(false);
        }, remaining);
      } else {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setSearchLoading(false);
      setDebouncedSearchText('');
      return undefined;
    }

    setSearchLoading(true);
    const timeout = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setSearchLoading(false);
    }, 260);

    return () => clearTimeout(timeout);
  }, [searchText]);

  useEffect(() => {
    if (!banners.length) return undefined;
    const timer = setInterval(() => setBannerIndex((value) => (value + 1) % banners.length), 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const activeVehicle = vehicles[0];
  const activeBanner = banners[bannerIndex] ?? null;
  const heroFallbackImage = topServices[0]?.thumbnailImage ?? services[0]?.thumbnailImage;

  const nextServiceDate = useMemo(() => {
    if (!activeVehicle?.lastServiceDate) return null;
    const parsedDate = new Date(activeVehicle.lastServiceDate);
    if (Number.isNaN(parsedDate.getTime())) return null;
    const nextDate = new Date(parsedDate);
    nextDate.setMonth(nextDate.getMonth() + 6);
    return nextDate;
  }, [activeVehicle]);

  const activeVehicleLabel = useMemo(() => {
    if (!activeVehicle) return '';
    return normalizeText(`${activeVehicle.make} ${activeVehicle.modelName}`);
  }, [activeVehicle]);

  const searchQuery = normalizeText(debouncedSearchText);
  const hasSearchQuery = searchQuery.length > 0;

  const searchableServices = useMemo(() => {
    const combined = [...topServices, ...services];
    return combined.filter((service, index, list) => list.findIndex((item) => item._id === service._id) === index);
  }, [services, topServices]);

  const filteredServices = useMemo(() => {
    const source = hasSearchQuery || activeCategory || activeVehicleFilter || activePriceFilter ? searchableServices : topServices.length ? topServices : services.filter((item) => item.isFeatured || item.popular || item.featured).slice(0, 6);

    return source.filter((service) => {
      const textBlob = normalizeText(
        [
          service.name,
          service.description,
          service.shortDescription,
          service.fullDescription,
          service.category,
          ...(service.compatibleVehicles ?? []),
        ]
          .filter(Boolean)
          .join(' '),
      );

      const matchesQuery = !hasSearchQuery || textBlob.includes(searchQuery);
      const matchesCategory = !activeCategory || normalizeText(service.category ?? '').includes(normalizeText(activeCategory));
      const matchesVehicle =
        !activeVehicleFilter ||
        textBlob.includes(normalizeText(activeVehicleFilter)) ||
        (activeVehicleLabel.length > 0 && textBlob.includes(activeVehicleLabel));
      const matchesPrice =
        !activePriceFilter ||
        (activePriceFilter === 'Under ₹500' && service.price < 500) ||
        (activePriceFilter === '₹500 - ₹1000' && service.price >= 500 && service.price <= 1000) ||
        (activePriceFilter === 'Above ₹1000' && service.price > 1000);

      return matchesQuery && matchesCategory && matchesVehicle && matchesPrice;
    });
  }, [activeCategory, activePriceFilter, activeVehicleFilter, activeVehicleLabel, hasSearchQuery, searchQuery, searchableServices, services, topServices]);

  const filteredParts = useMemo(() => {
    const source = hasSearchQuery || activeBrand || activeAvailabilityFilter ? spareParts : spareParts;

    return source.filter((part) => {
      const textBlob = normalizeText([part.itemName, part.brand, part.category, part.sku, part.shortDescription, part.description].filter(Boolean).join(' '));
      const matchesQuery = !hasSearchQuery || textBlob.includes(searchQuery);
      const matchesBrand = !activeBrand || normalizeText(part.brand).includes(normalizeText(activeBrand));
      const matchesAvailability =
        !activeAvailabilityFilter ||
        (activeAvailabilityFilter === 'All' && true) ||
        (activeAvailabilityFilter === 'In Stock' && part.status === 'In Stock') ||
        (activeAvailabilityFilter === 'Low Stock' && part.status === 'Low Stock');
      return matchesQuery && matchesBrand && matchesAvailability;
    });
  }, [activeAvailabilityFilter, activeBrand, hasSearchQuery, searchQuery, spareParts]);

  const filteredCategories = useMemo(() => {
    if (!hasSearchQuery) return categoryItems;
    return categoryItems.filter((item) => normalizeText(item.label).includes(searchQuery));
  }, [hasSearchQuery, searchQuery]);

  const searchSuggestions = useMemo(() => {
    if (!hasSearchQuery) return [];

    const serviceSuggestions = filteredServices.slice(0, 2).map((service) => service.name);
    const partSuggestions = filteredParts.slice(0, 2).map((part) => part.itemName);
    const categorySuggestions = filteredCategories.slice(0, 2).map((item) => item.label);
    const brandSuggestions = uniqueValues(filteredParts.slice(0, 4).map((part) => part.brand));

    return uniqueValues([...serviceSuggestions, ...partSuggestions, ...categorySuggestions, ...brandSuggestions]).slice(0, 6);
  }, [filteredCategories, filteredParts, filteredServices, hasSearchQuery]);

  const searchResultsCount = filteredServices.length + filteredParts.length + filteredCategories.length;

  const visibleServices = filteredServices.slice(0, 8);
  const visibleParts = filteredParts.slice(0, 8);
  const visibleCategories = filteredCategories.slice(0, 6);

  const filterCategories = useMemo(
    () => uniqueValues([...categoryItems.map((item) => item.label), ...services.map((service) => service.category)]).slice(0, 8),
    [services],
  );

  const filterBrands = useMemo(() => uniqueValues(spareParts.map((part) => part.brand)).slice(0, 8), [spareParts]);
  const filterVehicles = useMemo(
    () =>
      uniqueValues([
        activeVehicle ? `${activeVehicle.make} ${activeVehicle.modelName}` : undefined,
        ...vehicles.map((vehicle) => `${vehicle.make} ${vehicle.modelName}`),
      ]).slice(0, 8),
    [activeVehicle, vehicles],
  );
  const filterPriceOptions = ['Under ₹500', '₹500 - ₹1000', 'Above ₹1000'];
  const filterAvailabilityOptions = ['All', 'In Stock', 'Low Stock'];

  const resetSearchAndFilters = () => {
    setSearchText('');
    setDebouncedSearchText('');
    setActiveCategory('');
    setActiveBrand('');
    setActiveVehicleFilter('');
    setActivePriceFilter('');
    setActiveAvailabilityFilter('');
  };

  const handleFilterSelect = (type: FilterType, value: string) => {
    if (type === 'category') setActiveCategory(value === activeCategory ? '' : value);
    if (type === 'brand') setActiveBrand(value === activeBrand ? '' : value);
    if (type === 'vehicle') setActiveVehicleFilter(value === activeVehicleFilter ? '' : value);
    if (type === 'price') setActivePriceFilter(value === activePriceFilter ? '' : value);
    if (type === 'availability') setActiveAvailabilityFilter(value === activeAvailabilityFilter ? '' : value);
  };

  const hasActiveFilters = Boolean(activeCategory || activeBrand || activeVehicleFilter || activePriceFilter || activeAvailabilityFilter);

  const formatServiceDuration = (service: PublicService) => {
    const minutes = service.estimatedDuration ?? 60;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    void loadDashboard(true);
  };

  const openEmergency = () => void Linking.openURL('tel:+911800000000');
  const openWhatsApp = () => void Linking.openURL('https://wa.me/911800000000');

  const handleQuickAction = (action: (typeof quickActions)[number]) => {
    if (action.emergency) {
      openEmergency();
      return;
    }
    if (action.openBookings) {
      onOpenMyBookings?.();
      return;
    }
    if (action.tab) {
      onNavigateTab?.(action.tab);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryBright} />}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            onPress={() => onNavigateTab?.('profile')}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Menu size={24} color={colors.text} strokeWidth={2} />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>{`${greeting} 👋`}</Text>
            <Text style={styles.brandName}>{currentUserFullName?.trim() || profile?.fullName?.trim() || 'Guest'}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            onPress={() => onNavigateTab?.('notifications')}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
          >
            <Bell size={24} color={colors.text} strokeWidth={2} />
            {(unreadNotificationCount ?? 0) > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{(unreadNotificationCount ?? 0) > 9 ? '9+' : unreadNotificationCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={22} color={colors.textLight} strokeWidth={2.2} />
            <TextInput
              placeholder="Search services, parts..."
              placeholderTextColor={colors.textLight}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              keyboardAppearance="light"
              clearButtonMode="never"
              enablesReturnKeyAutomatically
            />
            {searchText.length > 0 ? (
              <Pressable
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
                onPress={resetSearchAndFilters}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <X size={16} color={colors.textLight} strokeWidth={2.4} />
              </Pressable>
            ) : searchLoading ? (
              <ActivityIndicator size="small" color={colors.primaryBright} style={styles.searchLoading} />
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
              onPress={() => setIsFilterSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Open filters"
            >
              <SlidersHorizontal size={18} color={colors.primaryBright} strokeWidth={2.2} />
            </Pressable>
          </View>

          {searchText.trim().length > 0 ? (
            <View style={styles.searchSurface}>
              <View style={styles.searchSurfaceHeader}>
                <Text style={styles.searchSurfaceTitle}>
                  {searchLoading ? 'Searching...' : searchResultsCount > 0 ? `${searchResultsCount} results found` : 'No results found'}
                </Text>
                {hasActiveFilters ? (
                  <Pressable onPress={resetSearchAndFilters} style={styles.clearFiltersButton}>
                    <Text style={styles.clearFiltersButtonText}>Reset</Text>
                  </Pressable>
                ) : null}
              </View>

              {searchLoading ? (
                <View style={styles.searchLoadingRow}>
                  <ActivityIndicator size="small" color={colors.primaryBright} />
                  <Text style={styles.searchLoadingText}>Updating services and parts...</Text>
                </View>
              ) : searchResultsCount > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRail}>
                  {searchSuggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      style={({ pressed }) => [styles.suggestionChip, pressed && styles.pressed]}
                      onPress={() => setSearchText(suggestion)}
                    >
                      <Text style={styles.suggestionChipText}>{suggestion}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.searchEmptyState}>
                  <Text style={styles.searchEmptyTitle}>Nothing matched that search</Text>
                  <Text style={styles.searchEmptyText}>Try a service, spare part, category, or brand.</Text>
                  <PremiumButton label="Clear Search" variant="secondary" compact onPress={resetSearchAndFilters} />
                </View>
              )}
            </View>
          ) : null}
        </View>

        <HeroBannerCarousel
          banners={banners}
          bannerIndex={bannerIndex}
          onIndexChange={setBannerIndex}
          fallbackImage={heroFallbackImage}
          onBookPress={() => onNavigateTab?.('services')}
        />

        <View style={styles.section}>
          <View style={styles.quickActionGrid}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Pressable
                  key={action.label}
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    { flexBasis: isWide ? '23%' : '48%' },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleQuickAction(action)}
                >
                  <IconCircle size={56} backgroundColor={action.backgroundColor}>
                    <Icon size={24} color={action.iconColor} strokeWidth={2} />
                  </IconCircle>
                  <Text style={styles.quickActionTitle}>{action.label}</Text>
                  <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Service Categories" actionLabel="View all" onActionPress={() => onNavigateTab?.('services')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRail}>
            {visibleCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Pressable
                  key={category.label}
                  style={({ pressed }) => [styles.categoryCard, { width: isWide ? 116 : 108 }, pressed && styles.pressed]}
                  onPress={() => onNavigateTab?.('services')}
                >
                  <IconCircle size={56} backgroundColor={colors.surfaceSoft}>
                    <Icon size={24} color={colors.text} strokeWidth={2} />
                  </IconCircle>
                  <Text style={styles.categoryLabel} numberOfLines={2}>
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="My Vehicle" actionLabel="View Details" onActionPress={() => onNavigateTab?.('profile')} />
          {loading ? (
            <View style={styles.vehicleSkeleton}>
              <View style={styles.skeletonVehicleGraphic} />
              <View style={styles.skeletonVehicleLines}>
                <View style={styles.skeletonLineLong} />
                <View style={styles.skeletonLineMedium} />
                <View style={styles.skeletonLineShort} />
              </View>
            </View>
          ) : activeVehicle ? (
            <View style={styles.vehicleCard}>
              <View style={styles.vehicleGraphic}>
                <View style={styles.vehicleGraphicCircle}>
                  <Car size={44} color={colors.primaryBright} strokeWidth={2} />
                </View>
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              </View>

              <View style={styles.vehicleBody}>
                <View style={styles.vehicleTitleRow}>
                  <Text style={styles.vehicleTitle} numberOfLines={1}>
                    {`${activeVehicle.make} ${activeVehicle.modelName}`}
                  </Text>
                </View>

                <View style={styles.vehicleMetaPills}>
                  <View style={styles.vehicleMetaPill}>
                    <Text style={styles.vehicleMetaPillText}>{activeVehicle.plateNumber}</Text>
                  </View>
                  {activeVehicle.year ? (
                    <View style={styles.vehicleMetaPillMuted}>
                      <Text style={styles.vehicleMetaPillMutedText}>{activeVehicle.year}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.vehicleInfoRow}>
                  <Clock3 size={14} color={colors.textMuted} strokeWidth={2} />
                  <Text style={styles.vehicleInfoText}>
                    Last Service: {activeVehicle.lastServiceDate ? new Date(activeVehicle.lastServiceDate).toLocaleDateString() : 'Not recorded'}
                  </Text>
                </View>
                <View style={styles.vehicleInfoRow}>
                  <Clock3 size={14} color={colors.textMuted} strokeWidth={2} />
                  <Text style={styles.vehicleInfoText}>
                    Next Service: {nextServiceDate ? nextServiceDate.toLocaleDateString() : 'Schedule soon'}
                  </Text>
                </View>
              </View>

              <View style={styles.vehicleActions}>
                <PremiumButton label="Book Again" compact onPress={() => onNavigateTab?.('services')} />
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <IconCircle size={64} backgroundColor={colors.primarySoft}>
                <Car size={28} color={colors.primaryBright} strokeWidth={2} />
              </IconCircle>
              <Text style={styles.emptyTitle}>Add your first vehicle</Text>
              <Text style={styles.emptyText}>Register a vehicle to unlock personalised service recommendations.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Popular Services" actionLabel="View all" onActionPress={() => onNavigateTab?.('services')} />
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRail}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={`service-skeleton-${index}`} style={styles.serviceSkeletonCard} />
              ))}
            </ScrollView>
          ) : visibleServices.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRail}>
              {visibleServices.map((service) => (
                <Pressable
                  key={service._id}
                  style={({ pressed }) => [styles.serviceCard, { width: isWide ? 260 : 230 }, pressed && styles.pressed]}
                  onPress={() => {
                    if (onOpenServiceDetail) {
                      onOpenServiceDetail(service._id);
                      return;
                    }
                    onNavigateTab?.('services');
                  }}
                >
                  <View style={styles.cardImageWrap}>
                    {service.thumbnailImage ? (
                      <Image source={{ uri: service.thumbnailImage }} style={styles.cardImage} />
                    ) : (
                      <View style={styles.cardImagePlaceholder}>
                        <Wrench size={32} color={colors.primaryBright} strokeWidth={2} />
                      </View>
                    )}
                    <View style={styles.wishlistButton}>
                      <Heart size={14} color="#FFFFFF" fill="transparent" strokeWidth={2} />
                    </View>
                    {service.rating ? (
                      <View style={styles.ratingBadge}>
                        <Star size={10} color={colors.warning} fill={colors.warning} strokeWidth={0} />
                        <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {service.name}
                    </Text>
                    <Text style={styles.cardLabel}>Starting at</Text>
                    <Text style={styles.cardPrice}>{formatCurrency(service.price)}</Text>
                    <View style={styles.cardMetaRow}>
                      <Clock3 size={13} color={colors.textMuted} strokeWidth={2} />
                      <Text style={styles.cardMeta}>{formatServiceDuration(service)}</Text>
                      {service.bookings ? <Text style={styles.cardMeta}>• {service.bookings} bookings</Text> : null}
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No services available</Text>
              <Text style={styles.emptyText}>Try a different search or check back soon.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Spare Parts" actionLabel="View all" onActionPress={() => onNavigateTab?.('parts')} />
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRail}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={`part-skeleton-${index}`} style={styles.partSkeletonCard} />
              ))}
            </ScrollView>
          ) : visibleParts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRail}>
              {visibleParts.map((part) => (
                <View key={part._id} style={[styles.partCard, { width: isWide ? 220 : 200 }]}>
                  <View style={styles.partImageWrap}>
                    {part.image ? (
                      <Image source={{ uri: part.image }} style={styles.partImage} />
                    ) : (
                      <View style={styles.partImagePlaceholder}>
                        <Wrench size={28} color={colors.primaryBright} strokeWidth={2} />
                      </View>
                    )}
                    <View style={styles.wishlistButtonPart}>
                      <Heart size={14} color={colors.textMuted} fill="transparent" strokeWidth={2} />
                    </View>
                    {part.isFeatured ? (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>Featured</Text>
                      </View>
                    ) : null}
                    {part.status === 'Low Stock' ? (
                      <View style={styles.lowStockBadge}>
                        <Text style={styles.lowStockBadgeText}>Low Stock</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.partBody}>
                    <Text style={styles.partBrand} numberOfLines={1}>
                      {part.brand}
                    </Text>
                    <Text style={styles.partTitle} numberOfLines={2}>
                      {part.itemName}
                    </Text>
                    <Text style={styles.partPrice}>{formatCurrency(part.sellingPrice)}</Text>
                    {part.originalPrice && part.originalPrice > part.sellingPrice ? (
                      <Text style={styles.partOldPrice}>{formatCurrency(part.originalPrice)}</Text>
                    ) : null}
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

        <View style={styles.section}>
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyGlowTop} />
            <View style={styles.emergencyGlowBottom} />
            <View style={styles.emergencyTopRow}>
              <View style={styles.emergencyCopy}>
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyBadgeText}>24x7 Available</Text>
                </View>
                <Text style={styles.emergencyTitle}>Emergency Assistance</Text>
                <Text style={styles.emergencySubtitle}>Roadside help whenever you need it.</Text>
              </View>
              <View style={styles.emergencyIconWrap}>
                <PhoneCall size={28} color="#FFFFFF" strokeWidth={2.2} />
              </View>
            </View>

            <View style={styles.emergencyActions}>
              <PremiumButton label="Call" compact onPress={openEmergency} style={styles.emergencyPrimaryButton} />
              <PremiumButton label="WhatsApp" compact variant="secondary" onPress={openWhatsApp} style={styles.emergencySecondaryButton} />
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={isFilterSheetVisible} transparent animationType="fade" onRequestClose={() => setIsFilterSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setIsFilterSheetVisible(false)}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <Pressable onPress={() => setIsFilterSheetVisible(false)} style={styles.sheetCloseButton}>
                <X size={18} color={colors.text} strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Category</Text>
                <View style={styles.sheetChipGrid}>
                  {filterCategories.map((value) => (
                    <Pressable
                      key={value}
                      style={[styles.sheetChip, activeCategory === value && styles.sheetChipActive]}
                      onPress={() => handleFilterSelect('category', value)}
                    >
                      <Text style={[styles.sheetChipText, activeCategory === value && styles.sheetChipTextActive]}>{value}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Brand</Text>
                <View style={styles.sheetChipGrid}>
                  {filterBrands.map((value) => (
                    <Pressable
                      key={value}
                      style={[styles.sheetChip, activeBrand === value && styles.sheetChipActive]}
                      onPress={() => handleFilterSelect('brand', value)}
                    >
                      <Text style={[styles.sheetChipText, activeBrand === value && styles.sheetChipTextActive]}>{value}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Vehicle</Text>
                <View style={styles.sheetChipGrid}>
                  {filterVehicles.map((value) => (
                    <Pressable
                      key={value}
                      style={[styles.sheetChip, activeVehicleFilter === value && styles.sheetChipActive]}
                      onPress={() => handleFilterSelect('vehicle', value)}
                    >
                      <Text style={[styles.sheetChipText, activeVehicleFilter === value && styles.sheetChipTextActive]}>{value}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Price</Text>
                <View style={styles.sheetChipGrid}>
                  {filterPriceOptions.map((value) => (
                    <Pressable
                      key={value}
                      style={[styles.sheetChip, activePriceFilter === value && styles.sheetChipActive]}
                      onPress={() => handleFilterSelect('price', value)}
                    >
                      <Text style={[styles.sheetChipText, activePriceFilter === value && styles.sheetChipTextActive]}>{value}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Availability</Text>
                <View style={styles.sheetChipGrid}>
                  {filterAvailabilityOptions.map((value) => (
                    <Pressable
                      key={value}
                      style={[styles.sheetChip, activeAvailabilityFilter === value && styles.sheetChipActive]}
                      onPress={() => handleFilterSelect('availability', value)}
                    >
                      <Text style={[styles.sheetChipText, activeAvailabilityFilter === value && styles.sheetChipTextActive]}>{value}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <PremiumButton label="Clear" variant="secondary" compact onPress={resetSearchAndFilters} style={styles.sheetFooterButton} />
              <PremiumButton label="Apply" compact onPress={() => setIsFilterSheetVisible(false)} style={styles.sheetFooterButton} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  greeting: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  brandName: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  searchSection: {
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingLeft: 16,
    paddingRight: 10,
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 0,
  },
  searchLoading: {
    marginRight: 8,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: colors.surfaceSoft,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  searchSurface: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  searchSurfaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  searchSurfaceTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  clearFiltersButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  clearFiltersButtonText: {
    color: colors.primaryBright,
    fontSize: 12,
    fontWeight: '700',
  },
  searchLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  searchLoadingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionRail: {
    gap: 10,
    paddingRight: 4,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  suggestionChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  searchEmptyState: {
    paddingVertical: 4,
    gap: 8,
  },
  searchEmptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  searchEmptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  section: {
    marginBottom: 20,
  },
  horizontalRail: {
    gap: 12,
    paddingVertical: 4,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flexGrow: 1,
    flexBasis: '48%',
    minHeight: 132,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.card,
  },
  quickActionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  quickActionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryCard: {
    width: 108,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
    ...shadow.card,
  },
  categoryLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  vehicleSkeleton: {
    flexDirection: 'row',
    gap: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  skeletonVehicleGraphic: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceSoft,
  },
  skeletonVehicleLines: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  skeletonLineLong: {
    height: 18,
    width: '72%',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
  },
  skeletonLineMedium: {
    height: 14,
    width: '56%',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
  },
  skeletonLineShort: {
    height: 14,
    width: '44%',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    ...shadow.card,
  },
  vehicleGraphic: {
    width: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleGraphicCircle: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    top: -4,
    left: 10,
    backgroundColor: colors.primaryBright,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  vehicleBody: {
    flex: 1,
    minWidth: 0,
  },
  vehicleTitleRow: {
    marginBottom: 8,
  },
  vehicleTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  vehicleMetaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  vehicleMetaPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vehicleMetaPillText: {
    color: colors.primaryBright,
    fontSize: 12,
    fontWeight: '800',
  },
  vehicleMetaPillMuted: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vehicleMetaPillMutedText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  vehicleInfoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  vehicleActions: {
    alignSelf: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.card,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },
  serviceSkeletonCard: {
    width: 230,
    height: 286,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceSoft,
  },
  serviceCard: {
    width: 230,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardImageWrap: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: colors.surfaceSoft,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  ratingText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  cardBody: {
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 6,
  },
  cardLabel: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  cardPrice: {
    color: colors.primaryBright,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  partSkeletonCard: {
    width: 200,
    height: 300,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceSoft,
  },
  partCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    ...shadow.card,
  },
  partImageWrap: {
    width: '100%',
    height: 132,
    position: 'relative',
    backgroundColor: colors.surfaceSoft,
  },
  partImage: {
    width: '100%',
    height: '100%',
  },
  partImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  wishlistButtonPart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.primaryBright,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lowStockBadgeText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '800',
  },
  partBody: {
    padding: spacing.md,
  },
  partBrand: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  partTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 8,
  },
  partPrice: {
    color: colors.primaryBright,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  partOldPrice: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'line-through',
    marginBottom: 8,
  },
  partStock: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  partStockLow: {
    color: colors.warning,
  },
  emergencyCard: {
    backgroundColor: '#0F3A91',
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...shadow.float,
  },
  emergencyGlowTop: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37,99,235,0.35)',
  },
  emergencyGlowBottom: {
    position: 'absolute',
    bottom: -32,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emergencyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: spacing.md,
  },
  emergencyCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  emergencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emergencyBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  emergencyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emergencyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  emergencyPrimaryButton: {
    flex: 1,
  },
  emergencySecondaryButton: {
    flex: 1,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
    maxHeight: '82%',
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: colors.borderStrong,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sheetCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    paddingBottom: 16,
    gap: 16,
  },
  sheetSection: {
    gap: 10,
  },
  sheetSectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  sheetChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sheetChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  sheetChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: '#BFDBFE',
  },
  sheetChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  sheetChipTextActive: {
    color: colors.primaryBright,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  sheetFooterButton: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

export default HomeDashboard;
