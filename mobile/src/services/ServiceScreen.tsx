import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Star,
  Truck,
  Wrench,
} from 'lucide-react-native';
import BookingSchedulePicker, { formatDisplayDate, formatDisplayTime } from '../components/BookingSchedulePicker';
import PremiumButton from '../components/ui/PremiumButton';
import { formatCurrency } from '../utils/currency';
import { colors, iconSize, iconStroke, radius, shadow, spacing, typography } from '../theme/tokens';
import {
  createBookingRequest,
  CreatedBooking,
  fetchVehiclesForBooking,
  getCurrentCustomerId,
} from './bookingFlowService';
import {
  fetchPublicServiceById,
  fetchPublicServices,
  PublicService,
  Vehicle,
} from './dashboardService';

interface ServicesScreenProps {
  initialServiceId?: string | null;
  onOpenMyBookings?: () => void;
  onNavigateHome?: () => void;
}

type ScreenMode = 'list' | 'details' | 'booking' | 'success';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 260;
const CONTENT_HORIZONTAL = spacing.md;

const isValidDateString = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTimeString = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isPastDate = (value: string) => {
  const bookingDay = parseLocalDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return bookingDay < today;
};

const getBookingDateError = (value: string) => {
  if (!value.trim()) return 'Please select a date from the calendar';
  if (!isValidDateString(value)) return 'Please select a valid date';
  if (isPastDate(value)) return 'Date cannot be in the past';
  return '';
};

const getPreferredTimeError = (value: string) => {
  if (!value.trim()) return 'Please select a time slot';
  if (!isValidTimeString(value)) return 'Please select a valid time slot';
  return '';
};

const getAddressError = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 'Address is required';
  if (trimmed.length < 3) return 'Address must be at least 3 characters';
  return '';
};

const formatServiceDuration = (service: PublicService) => {
  const minutes = service.estimatedDuration ?? 60;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const isServiceFeatured = (service: PublicService) => Boolean(service.isFeatured || service.featured);

const hasRating = (service: PublicService) => (service.rating ?? 0) > 0;

const buildGalleryImages = (service: PublicService) => {
  const images: string[] = [];
  const add = (uri?: string) => {
    if (uri && !images.includes(uri)) images.push(uri);
  };
  add(service.thumbnailImage);
  service.galleryImages?.forEach(add);
  return images;
};

const MobileServiceScreen = ({
  initialServiceId,
  onOpenMyBookings,
}: ServicesScreenProps) => {
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [latestBooking, setLatestBooking] = useState<CreatedBooking | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const loadServices = useCallback(async () => {
    try {
      const payload = await fetchPublicServices({ limit: 100, sort: 'featured' });
      setServices(payload);
    } catch (error) {
      Alert.alert('Unable to load services', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const openServiceDetails = useCallback(async (serviceId: string) => {
    setDetailsLoading(true);
    setHeroIndex(0);
    try {
      const service = await fetchPublicServiceById(serviceId);
      if (!service) {
        Alert.alert('Service unavailable', 'This service could not be loaded.');
        return;
      }
      setSelectedService(service);
      setScreenMode('details');
    } catch (error) {
      Alert.alert('Unable to load service', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (!initialServiceId) return;
    void openServiceDetails(initialServiceId);
  }, [initialServiceId, openServiceDetails]);

  const filteredServices = useMemo(
    () =>
      services.filter((service) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return (
          service.name.toLowerCase().includes(query)
          || service.category?.toLowerCase().includes(query)
          || service.shortDescription?.toLowerCase().includes(query)
          || service.description?.toLowerCase().includes(query)
        );
      }),
    [search, services],
  );

  const galleryImages = useMemo(
    () => (selectedService ? buildGalleryImages(selectedService) : []),
    [selectedService],
  );

  const onHeroScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setHeroIndex(index);
  };

  const resetToList = () => {
    setScreenMode('list');
    setSelectedService(null);
    setLatestBooking(null);
    setHeroIndex(0);
  };

  if (detailsLoading && screenMode !== 'list') {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primaryBright} />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  if (screenMode === 'details' && selectedService) {
    const relatedServices = selectedService.relatedServices ?? [];

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
          <Pressable
            style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
            onPress={resetToList}
          >
            <ArrowLeft size={18} color={colors.primaryBright} strokeWidth={iconStroke} />
            <Text style={styles.backText}>Back to Services</Text>
          </Pressable>

          {galleryImages.length > 0 ? (
            <View style={styles.heroWrap}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onHeroScroll}
                scrollEventThrottle={16}
              >
                {galleryImages.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.heroImage} />
                ))}
              </ScrollView>
              {galleryImages.length > 1 ? (
                <View style={styles.heroDots}>
                  {galleryImages.map((uri, index) => (
                    <View
                      key={`${uri}-dot`}
                      style={[styles.heroDot, index === heroIndex && styles.heroDotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Wrench size={40} color={colors.primaryBright} strokeWidth={iconStroke} />
              <Text style={styles.heroPlaceholderText}>Premium Service</Text>
            </View>
          )}

          <View style={styles.detailCard}>
            <View style={styles.detailHeaderRow}>
              {selectedService.category ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{selectedService.category}</Text>
                </View>
              ) : null}
              {isServiceFeatured(selectedService) ? (
                <View style={styles.featuredBadge}>
                  <Sparkles size={12} color={colors.primaryBright} strokeWidth={iconStroke} />
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.detailTitle}>{selectedService.name}</Text>

            <View style={styles.detailMetaRow}>
              {hasRating(selectedService) ? (
                <View style={styles.ratingPill}>
                  <Star size={13} color={colors.warning} fill={colors.warning} strokeWidth={0} />
                  <Text style={styles.ratingText}>{selectedService.rating!.toFixed(1)}</Text>
                </View>
              ) : null}
              <View style={styles.metaChip}>
                <Clock3 size={13} color={colors.primaryBright} strokeWidth={iconStroke} />
                <Text style={styles.metaChipText}>{formatServiceDuration(selectedService)}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.detailPrice}>{formatCurrency(selectedService.price)}</Text>
              {selectedService.originalPrice && selectedService.originalPrice > selectedService.price ? (
                <Text style={styles.originalPrice}>{formatCurrency(selectedService.originalPrice)}</Text>
              ) : null}
            </View>

            {selectedService.shortDescription ? (
              <Text style={styles.shortDescription}>{selectedService.shortDescription}</Text>
            ) : null}

            {selectedService.fullDescription || selectedService.description ? (
              <>
                <Text style={styles.sectionTitle}>About This Service</Text>
                <Text style={styles.sectionBody}>
                  {selectedService.fullDescription ?? selectedService.description}
                </Text>
              </>
            ) : null}

            <Text style={styles.sectionTitle}>What's Included</Text>
            {selectedService.includes && selectedService.includes.length > 0 ? (
              <View style={styles.includesList}>
                {selectedService.includes.map((item) => (
                  <View key={item} style={styles.includeRow}>
                    <Check size={16} color={colors.success} strokeWidth={iconStroke} />
                    <Text style={styles.includeText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>Inclusions will be shared before your appointment.</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Compatible Vehicles</Text>
            {selectedService.compatibleVehicles && selectedService.compatibleVehicles.length > 0 ? (
              <View style={styles.chipWrap}>
                {selectedService.compatibleVehicles.map((vehicle) => (
                  <View key={vehicle} style={styles.chip}>
                    <Car size={13} color={colors.primaryBright} strokeWidth={iconStroke} />
                    <Text style={styles.chipText}>{vehicle}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>Compatible with most standard vehicles.</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>FAQ</Text>
            {selectedService.faq && selectedService.faq.length > 0 ? (
              <View style={styles.faqList}>
                {selectedService.faq.map((item, index) => (
                  <View key={`${item.question}-${index}`} style={styles.faqCard}>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No FAQs available for this service yet.</Text>
              </View>
            )}

            {relatedServices.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Related Services</Text>
                {relatedServices.map((item) => (
                  <Pressable
                    key={item._id}
                    style={({ pressed }) => [styles.relatedCard, pressed && styles.pressed]}
                    onPress={() => void openServiceDetails(item._id)}
                  >
                    <View style={styles.relatedLeft}>
                      {item.thumbnailImage ? (
                        <Image source={{ uri: item.thumbnailImage }} style={styles.relatedThumb} />
                      ) : (
                        <View style={[styles.relatedThumb, styles.relatedThumbPlaceholder]}>
                          <Wrench size={18} color={colors.primaryBright} strokeWidth={iconStroke} />
                        </View>
                      )}
                      <View style={styles.relatedInfo}>
                        <Text style={styles.relatedTitle} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.relatedPrice}>{formatCurrency(item.price)}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} strokeWidth={iconStroke} />
                  </Pressable>
                ))}
              </>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.stickyAction}>
          <PremiumButton label="Book Service" onPress={() => setScreenMode('booking')} />
        </View>
      </View>
    );
  }

  if (screenMode === 'booking' && selectedService) {
    return (
      <BookingFlow
        service={selectedService}
        onBack={() => setScreenMode('details')}
        onSuccess={(booking) => {
          setLatestBooking(booking);
          setScreenMode('success');
        }}
      />
    );
  }

  if (screenMode === 'success' && selectedService && latestBooking) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successIconWrap}>
            <CheckCircle2 size={56} color={colors.success} strokeWidth={iconStroke} />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed</Text>
          <Text style={styles.successSubtitle}>Your service request has been placed successfully.</Text>

          <View style={styles.successCard}>
            <Text style={styles.successLabel}>Booking ID</Text>
            <Text style={styles.successValue}>{latestBooking.bookingId}</Text>

            <View style={styles.successDivider} />

            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Status</Text>
              <Text style={styles.successRowValue}>{latestBooking.status}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Service</Text>
              <Text style={styles.successRowValue}>{selectedService.name}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Date</Text>
              <Text style={styles.successRowValue}>
                {formatDisplayDate(latestBooking.bookingDate.slice(0, 10))}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Time</Text>
              <Text style={styles.successRowValue}>{formatDisplayTime(latestBooking.preferredTime)}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Vehicle</Text>
              <Text style={styles.successRowValue}>{latestBooking.vehicle ?? 'Selected vehicle'}</Text>
            </View>
          </View>

          <PremiumButton label="View My Bookings" onPress={() => onOpenMyBookings?.()} />
          <PremiumButton
            label="Browse More Services"
            variant="outline"
            onPress={resetToList}
            style={styles.successSecondaryBtn}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadServices();
            }}
            tintColor={colors.primaryBright}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.screenTitle}>Services</Text>
            <Text style={styles.screenSubtitle}>Premium doorstep care for your vehicle</Text>
            <View style={styles.searchBar}>
              <Search size={iconSize} color={colors.textMuted} strokeWidth={iconStroke} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search services..."
                placeholderTextColor={colors.textLight}
                style={styles.searchInput}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.listLoading}>
              <ActivityIndicator size="large" color={colors.primaryBright} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <IconCircle>
                <Wrench size={28} color={colors.primaryBright} strokeWidth={iconStroke} />
              </IconCircle>
              <Text style={styles.emptyTitle}>No services found</Text>
              <Text style={styles.emptyText}>
                {search.trim() ? 'Try a different search term.' : 'Check back soon for new offerings.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
            onPress={() => void openServiceDetails(item._id)}
          >
            <View style={styles.serviceImageWrap}>
              {item.thumbnailImage ? (
                <Image source={{ uri: item.thumbnailImage }} style={styles.serviceImage} />
              ) : (
                <View style={styles.serviceImagePlaceholder}>
                  <Wrench size={32} color={colors.primaryBright} strokeWidth={iconStroke} />
                </View>
              )}
              {isServiceFeatured(item) ? (
                <View style={styles.cardFeaturedBadge}>
                  <Sparkles size={11} color={colors.primaryBright} strokeWidth={iconStroke} />
                  <Text style={styles.cardFeaturedText}>Featured</Text>
                </View>
              ) : null}
              {hasRating(item) ? (
                <View style={styles.serviceRatingBadge}>
                  <Star size={11} color={colors.warning} fill={colors.warning} strokeWidth={0} />
                  <Text style={styles.serviceRatingText}>{item.rating!.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.serviceBody}>
              {item.category ? <Text style={styles.serviceCategory}>{item.category}</Text> : null}
              <Text style={styles.serviceName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {item.shortDescription ?? item.description ?? 'Professional service at your doorstep.'}
              </Text>
              <View style={styles.serviceFooter}>
                <View>
                  <Text style={styles.servicePriceLabel}>Starting at</Text>
                  <Text style={styles.servicePrice}>{formatCurrency(item.price)}</Text>
                </View>
                <View style={styles.durationPill}>
                  <Clock3 size={13} color={colors.textMuted} strokeWidth={iconStroke} />
                  <Text style={styles.durationText}>{formatServiceDuration(item)}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};

const IconCircle = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.iconCircle}>{children}</View>
);

const BookingFlow = ({
  service,
  onBack,
  onSuccess,
}: {
  service: PublicService;
  onBack: () => void;
  onSuccess: (booking: CreatedBooking) => void;
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [pickupRequired, setPickupRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const bookingDateError = getBookingDateError(bookingDate);
  const preferredTimeError = getPreferredTimeError(preferredTime);
  const addressError = getAddressError(address);

  const isStep1Valid = Boolean(selectedVehicle);
  const isStep2Valid = !addressError;
  const isStep3Valid = !bookingDateError && !preferredTimeError;

  const isCurrentStepValid =
    step === 1 ? isStep1Valid
      : step === 2 ? isStep2Valid
        : step === 3 ? isStep3Valid
          : true;

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await fetchVehiclesForBooking();
        setVehicles(data);
      } finally {
        setLoading(false);
      }
    };
    void loadVehicles();
  }, []);

  const selectedVehicleData = vehicles.find((vehicle) => vehicle._id === selectedVehicle);

  const goToNextStep = () => {
    if (!isCurrentStepValid) return;
    setStep((prev) => prev + 1);
  };

  const submitBooking = async () => {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      Alert.alert('Incomplete details', 'Please complete all booking steps before confirming.');
      return;
    }
    try {
      setSubmitting(true);
      const customerId = await getCurrentCustomerId();
      const booking = await createBookingRequest({
        customer: customerId,
        vehicle: selectedVehicle,
        services: [service._id],
        bookingDate,
        preferredTime,
        pickupRequired,
        address: address.trim(),
        notes: notes.trim() || undefined,
      });
      onSuccess(booking);
    } catch (error) {
      Alert.alert('Booking failed', error instanceof Error ? error.message : 'Unable to place booking');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Vehicle', 'Address', 'Schedule', 'Summary', 'Confirm'];

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primaryBright} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.flowContent} showsVerticalScrollIndicator={false}>
      <Pressable style={({ pressed }) => [styles.backRow, pressed && styles.pressed]} onPress={onBack}>
        <ArrowLeft size={18} color={colors.primaryBright} strokeWidth={iconStroke} />
        <Text style={styles.backText}>Back to Details</Text>
      </Pressable>

      <Text style={styles.flowTitle}>Book {service.name}</Text>
      <Text style={styles.flowSubtitle}>Step {step} of 5 · {stepLabels[step - 1]}</Text>

      <View style={styles.stepIndicator}>
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === step;
          const isComplete = stepNumber < step;
          return (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  isComplete && styles.stepDotComplete,
                  isActive && styles.stepDotActive,
                ]}
              >
                {isComplete ? (
                  <Check size={12} color="#FFFFFF" strokeWidth={iconStroke} />
                ) : (
                  <Text style={[styles.stepDotText, isActive && styles.stepDotTextActive]}>{stepNumber}</Text>
                )}
              </View>
              {index < stepLabels.length - 1 ? (
                <View style={[styles.stepLine, stepNumber < step && styles.stepLineComplete]} />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.flowCard}>
        {step === 1 ? (
          <View>
            <Text style={styles.flowSectionTitle}>Select Vehicle</Text>
            <Text style={styles.flowSectionHint}>Choose the vehicle for this service.</Text>
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => {
                const isSelected = selectedVehicle === vehicle._id;
                return (
                  <Pressable
                    key={vehicle._id}
                    style={({ pressed }) => [
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedVehicle(vehicle._id)}
                  >
                    <View style={styles.optionIconWrap}>
                      <Car size={20} color={colors.primaryBright} strokeWidth={iconStroke} />
                    </View>
                    <View style={styles.optionBody}>
                      <Text style={styles.optionTitle}>
                        {vehicle.make} {vehicle.modelName}
                      </Text>
                      <Text style={styles.optionMeta}>{vehicle.plateNumber}</Text>
                    </View>
                    {isSelected ? (
                      <CheckCircle2 size={20} color={colors.primaryBright} strokeWidth={iconStroke} />
                    ) : null}
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No vehicles found. Add a vehicle to continue.</Text>
              </View>
            )}
            {!selectedVehicle ? (
              <Text style={styles.fieldError}>Please select a vehicle to continue.</Text>
            ) : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <Text style={styles.flowSectionTitle}>Service Address</Text>
            <Text style={styles.flowSectionHint}>Where should our technician visit?</Text>
            <View style={styles.inputWrap}>
              <MapPin size={18} color={colors.textMuted} strokeWidth={iconStroke} />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter service address"
                placeholderTextColor={colors.textLight}
                style={[styles.flowInput, addressError ? styles.inputError : null]}
                multiline
              />
            </View>
            {addressError ? <Text style={styles.fieldError}>{addressError}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}
              onPress={() => setPickupRequired((prev) => !prev)}
            >
              <View style={styles.toggleLeft}>
                <Truck size={18} color={colors.primaryBright} strokeWidth={iconStroke} />
                <View>
                  <Text style={styles.toggleLabel}>Pickup Required</Text>
                  <Text style={styles.toggleHint}>We can collect and return your vehicle</Text>
                </View>
              </View>
              <View style={[styles.togglePill, pickupRequired && styles.togglePillActive]}>
                <Text style={[styles.toggleValue, pickupRequired && styles.toggleValueActive]}>
                  {pickupRequired ? 'Yes' : 'No'}
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {step === 3 ? (
          <View>
            <Text style={styles.flowSectionTitle}>Select Date & Time</Text>
            <Text style={styles.flowSectionHint}>Pick your preferred appointment slot.</Text>
            <BookingSchedulePicker
              bookingDate={bookingDate}
              preferredTime={preferredTime}
              onDateChange={setBookingDate}
              onTimeChange={setPreferredTime}
              dateError={bookingDateError || undefined}
              timeError={preferredTimeError || undefined}
            />
            <Text style={styles.notesLabel}>Additional notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Share any special instructions..."
              placeholderTextColor={colors.textLight}
              style={styles.notesInput}
              multiline
            />
          </View>
        ) : null}

        {step === 4 ? (
          <View>
            <Text style={styles.flowSectionTitle}>Booking Summary</Text>
            <Text style={styles.flowSectionHint}>Review your details before confirming.</Text>
            <SummaryBlock
              service={service}
              vehicleLabel={
                selectedVehicleData
                  ? `${selectedVehicleData.plateNumber} · ${selectedVehicleData.make} ${selectedVehicleData.modelName}`
                  : 'Not selected'
              }
              bookingDate={bookingDate}
              preferredTime={preferredTime}
              address={address}
              pickupRequired={pickupRequired}
              notes={notes}
            />
          </View>
        ) : null}

        {step === 5 ? (
          <View>
            <Text style={styles.flowSectionTitle}>Confirm Booking</Text>
            <Text style={styles.flowSectionHint}>
              Tap confirm to submit your booking request. Our team will follow up shortly.
            </Text>
            <SummaryBlock
              service={service}
              vehicleLabel={
                selectedVehicleData
                  ? `${selectedVehicleData.plateNumber} · ${selectedVehicleData.make} ${selectedVehicleData.modelName}`
                  : 'Not selected'
              }
              bookingDate={bookingDate}
              preferredTime={preferredTime}
              address={address}
              pickupRequired={pickupRequired}
              notes={notes}
              compact
            />
          </View>
        ) : null}
      </View>

      <View style={styles.flowButtons}>
        {step > 1 ? (
          <PremiumButton
            label="Previous"
            variant="outline"
            onPress={() => setStep((prev) => prev - 1)}
            style={styles.flowBtnHalf}
          />
        ) : null}
        {step < 5 ? (
          <PremiumButton
            label="Next"
            onPress={goToNextStep}
            disabled={!isCurrentStepValid}
            style={step > 1 ? styles.flowBtnHalf : styles.flowBtnFull}
          />
        ) : (
          <PremiumButton
            label={submitting ? 'Confirming...' : 'Confirm Booking'}
            onPress={() => void submitBooking()}
            loading={submitting}
            style={styles.flowBtnFull}
          />
        )}
      </View>
    </ScrollView>
  );
};

const SummaryBlock = ({
  service,
  vehicleLabel,
  bookingDate,
  preferredTime,
  address,
  pickupRequired,
  notes,
  compact = false,
}: {
  service: PublicService;
  vehicleLabel: string;
  bookingDate: string;
  preferredTime: string;
  address: string;
  pickupRequired: boolean;
  notes: string;
  compact?: boolean;
}) => (
  <View style={[styles.summaryCard, compact && styles.summaryCardCompact]}>
    <SummaryRow label="Service" value={service.name} />
    <SummaryRow label="Price" value={formatCurrency(service.price)} highlight />
    <SummaryRow label="Vehicle" value={vehicleLabel} />
    <SummaryRow
      label="Date & Time"
      value={`${bookingDate ? formatDisplayDate(bookingDate) : '-'} · ${preferredTime ? formatDisplayTime(preferredTime) : '-'}`}
    />
    <SummaryRow label="Address" value={address.trim() || '-'} />
    <SummaryRow label="Pickup" value={pickupRequired ? 'Yes' : 'No'} />
    {notes.trim() ? <SummaryRow label="Notes" value={notes.trim()} /> : null}
  </View>
);

const SummaryRow = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]} numberOfLines={3}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.subtitle,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  listContent: {
    paddingHorizontal: CONTENT_HORIZONTAL,
    paddingBottom: spacing.xxl,
  },
  listHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  screenTitle: {
    ...typography.sectionTitle,
    fontSize: 28,
  },
  screenSubtitle: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  listLoading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.float,
  },
  serviceImageWrap: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  serviceImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.secondary,
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFeaturedBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  cardFeaturedText: {
    color: colors.primaryBright,
    fontWeight: '800',
    fontSize: 11,
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
  serviceRatingText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
  },
  serviceBody: {
    padding: spacing.md,
  },
  serviceCategory: {
    ...typography.caption,
    color: colors.primaryBright,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  serviceName: {
    ...typography.cardTitle,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  serviceDescription: {
    ...typography.subtitle,
    marginBottom: spacing.sm,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  servicePriceLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
  servicePrice: {
    color: colors.primaryBright,
    fontSize: 20,
    fontWeight: '800',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  durationText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadow.card,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.primaryBright,
    fontWeight: '700',
    fontSize: 14,
  },
  detailsContent: {
    paddingHorizontal: CONTENT_HORIZONTAL,
    paddingTop: spacing.md,
    paddingBottom: 140,
  },
  heroWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.float,
  },
  heroImage: {
    width: SCREEN_WIDTH - CONTENT_HORIZONTAL * 2,
    height: HERO_HEIGHT,
    backgroundColor: colors.secondary,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  heroPlaceholderText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  heroDots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  heroDotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  categoryPillText: {
    color: colors.primaryBright,
    fontWeight: '700',
    fontSize: 12,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    color: colors.primaryBright,
    fontWeight: '800',
    fontSize: 12,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  detailMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  ratingText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  metaChipText: {
    color: colors.primaryBright,
    fontWeight: '700',
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailPrice: {
    color: colors.primaryBright,
    fontSize: 24,
    fontWeight: '800',
  },
  originalPrice: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  shortDescription: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    fontSize: 18,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    ...typography.subtitle,
    lineHeight: 22,
  },
  includesList: {
    gap: spacing.sm,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  includeText: {
    flex: 1,
    ...typography.subtitle,
    color: colors.text,
  },
  emptySection: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  emptySectionText: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  faqList: {
    gap: spacing.sm,
  },
  faqCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqQuestion: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
  },
  faqAnswer: {
    ...typography.subtitle,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relatedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  relatedThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  relatedThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  relatedInfo: {
    flex: 1,
  },
  relatedTitle: {
    ...typography.cardTitle,
    marginBottom: 2,
  },
  relatedPrice: {
    color: colors.primaryBright,
    fontWeight: '800',
    fontSize: 14,
  },
  stickyAction: {
    position: 'absolute',
    left: CONTENT_HORIZONTAL,
    right: CONTENT_HORIZONTAL,
    bottom: 108,
    backgroundColor: 'transparent',
  },
  flowContent: {
    paddingHorizontal: CONTENT_HORIZONTAL,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  flowTitle: {
    ...typography.sectionTitle,
    fontSize: 24,
    marginBottom: 4,
  },
  flowSubtitle: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primaryBright,
  },
  stepDotComplete: {
    backgroundColor: colors.success,
  },
  stepDotText: {
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 12,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  stepLineComplete: {
    backgroundColor: colors.success,
  },
  flowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  flowSectionTitle: {
    ...typography.cardTitle,
    fontSize: 18,
    marginBottom: 4,
  },
  flowSectionHint: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionCardSelected: {
    borderColor: colors.primaryBright,
    backgroundColor: colors.primarySoft,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  optionMeta: {
    ...typography.subtitle,
    marginTop: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  flowInput: {
    flex: 1,
    minHeight: 72,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  toggleLabel: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  toggleHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  togglePill: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  togglePillActive: {
    backgroundColor: colors.primarySoft,
  },
  toggleValue: {
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 12,
  },
  toggleValueActive: {
    color: colors.primaryBright,
  },
  notesLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 88,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryCardCompact: {
    marginTop: spacing.sm,
  },
  summaryRow: {
    gap: 2,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
  summaryValue: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
  summaryValueHighlight: {
    color: colors.primaryBright,
    fontSize: 16,
  },
  flowButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  flowBtnHalf: {
    flex: 1,
  },
  flowBtnFull: {
    flex: 1,
  },
  successContent: {
    paddingHorizontal: CONTENT_HORIZONTAL,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'stretch',
  },
  successIconWrap: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.sectionTitle,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    ...typography.subtitle,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  successLabel: {
    ...typography.caption,
    color: colors.textLight,
  },
  successValue: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  successDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  successRowLabel: {
    ...typography.subtitle,
    flex: 1,
  },
  successRowValue: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    flex: 1.2,
    textAlign: 'right',
  },
  successSecondaryBtn: {
    marginTop: spacing.sm,
  },
});

export default MobileServiceScreen;
