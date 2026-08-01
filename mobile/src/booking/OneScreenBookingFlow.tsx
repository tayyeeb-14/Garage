import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  MapPin,
  PhoneCall,
  TicketPercent,
  Truck,
  Wallet,
  Wrench,
} from 'lucide-react-native';
import { colors, iconStroke, radius, shadow, spacing, typography } from '../theme/tokens';
import PremiumButton from '../components/ui/PremiumButton';
import { formatCurrency } from '../utils/currency';
import { createBookingRequest, CreatedBooking, fetchVehiclesForBooking, getCurrentCustomerId } from '../services/bookingFlowService';
import { PublicService, Vehicle } from '../services/dashboardService';

type OneScreenBookingFlowProps = {
  service: PublicService;
  onBack: () => void;
  onSuccess: (booking: CreatedBooking) => void;
  onOpenMyBookings?: () => void;
  onGoHome?: () => void;
};

type TimeGroup = {
  label: string;
  slots: string[];
};

type SavedAddress = {
  id: string;
  label: string;
  value: string;
  isDefault?: boolean;
};

type BookingError = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

const timeGroups: TimeGroup[] = [
  { label: 'Morning', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
  { label: 'Afternoon', slots: ['12:00', '12:30', '01:00', '01:30', '02:00', '02:30'] },
  { label: 'Evening', slots: ['05:00', '05:30', '06:00', '06:30', '07:00'] },
];

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (value: number) => String(value).padStart(2, '0');

const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseIsoDate = (value?: string | null): Date | null => {
  if (!value || typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map(Number);
  if (![year, month, day].every((num) => Number.isFinite(num))) return null;
  const date = new Date(year, month - 1, day);
  return Number.isFinite(date.getTime()) ? date : null;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addDays = (date: Date, offset: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

const isPastDate = (value: string) => {
  const bookingDay = parseIsoDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return bookingDay ? bookingDay < today : true;
};

const formatDateLabel = (value?: string | null) => {
  const date = parseIsoDate(value);
  if (!date) return 'Not selected';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
};

const formatShortDay = (value?: string | null) => {
  const date = parseIsoDate(value);
  if (!date) return 'Not selected';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
};

const formatMonthTitle = (date: Date) =>
  `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

const toTimeLabel = (slot: string, groupLabel: string) => {
  const [hourPart, minutePart] = slot.split(':');
  const hour = Number(hourPart);
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  const period = groupLabel === 'Morning' ? 'AM' : 'PM';
  return `${formattedHour}:${minutePart} ${period}`;
};

const getSlotMinutes = (slot: string, groupLabel: string) => {
  const [hourPart, minutePart] = slot.split(':');
  let hour = Number(hourPart);
  const minute = Number(minutePart);

  if (groupLabel === 'Morning') {
    hour = hour % 12;
  } else if (groupLabel === 'Afternoon' || groupLabel === 'Evening') {
    hour = hour % 12 === 0 ? 12 : hour % 12;
    hour += 12;
  }

  return hour * 60 + minute;
};

const OneScreenBookingFlow = ({
  service,
  onBack,
  onSuccess,
  onOpenMyBookings,
  onGoHome,
}: OneScreenBookingFlowProps) => {
  const today = useMemo(() => new Date(), []);
  const { width } = useWindowDimensions();
  const isCompactWidth = width < 390;
  const safeAreaBottomInset = Platform.OS === 'ios' ? 20 : 12;
  const quickDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(today, index)), [today]);
  const bottomBarHeight = isCompactWidth ? 116 : 104;
  const navigationOffset = 92;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const successScale = React.useRef(new Animated.Value(0.9)).current;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('home');
  const [pickupRequired, setPickupRequired] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toIsoDate(today));
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<CreatedBooking | null>(null);
  const [inlineError, setInlineError] = useState<BookingError | null>(null);
  const [couponError, setCouponError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([
    { id: 'home', label: 'Home', value: '123, MG Road, Mumbai - 400001', isDefault: true },
    { id: 'office', label: 'Office', value: 'Corporate Park, Andheri East, Mumbai - 400093' },
  ]);
  const [addressDraftLabel, setAddressDraftLabel] = useState('');
  const [addressDraftValue, setAddressDraftValue] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(today));
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const successAnimation = useMemo(
    () => ({
      scale: successScale,
      opacity: successScale.interpolate({
        inputRange: [0.9, 1],
        outputRange: [0.2, 1],
      }),
    }),
    [successScale],
  );

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const list = await fetchVehiclesForBooking();
        setVehicles(list);
        if (list.length > 0) {
          setSelectedVehicleId((current) => current || list[0]._id);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadVehicles();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (booking) {
      Animated.spring(successScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 75,
      }).start();
    }
  }, [booking, successScale]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle._id === selectedVehicleId) ?? vehicles[0] ?? null,
    [selectedVehicleId, vehicles],
  );

  useEffect(() => {
    if (!selectedVehicleId && selectedVehicle) {
      setSelectedVehicleId(selectedVehicle._id);
    }
  }, [selectedVehicle, selectedVehicleId]);

  useEffect(() => {
    if (!savedAddresses.length) return;
    const currentAddress = savedAddresses.find((item) => item.id === selectedAddressId) ?? savedAddresses[0];
    if (currentAddress && currentAddress.id !== selectedAddressId) {
      setSelectedAddressId(currentAddress.id);
    }
  }, [savedAddresses, selectedAddressId]);

  const selectedAddress = useMemo(
    () => savedAddresses.find((item) => item.id === selectedAddressId) ?? savedAddresses[0] ?? null,
    [savedAddresses, selectedAddressId],
  );
  const selectedAddressValue = selectedAddress?.value ?? '';
  const selectedAddressLabel = selectedAddress?.label ?? 'Saved Address';
  const selectedAddressDisplay = selectedAddressValue.trim();

  const stickyBarBottom = safeAreaBottomInset + navigationOffset + spacing.md + (keyboardVisible ? keyboardHeight : 0);
  const contentBottomPadding = stickyBarBottom + bottomBarHeight + spacing.xl;

  const discount = useMemo(() => {
    const normalized = appliedCoupon.trim().toUpperCase();
    if (!normalized) return 0;
    if (normalized === 'SAVE10' || normalized === 'WELCOME10') {
      return Math.min(Math.round(service.price * 0.1), 300);
    }
    return 0;
  }, [appliedCoupon, service.price]);

  const pickupCharge = pickupRequired ? 99 : 0;
  const totalPrice = Math.max(0, service.price - discount + pickupCharge);

  const selectedDatePriceLabel = useMemo(() => {
    const date = parseIsoDate(selectedDate);
    const todayKey = toIsoDate(today);
    if (selectedDate === todayKey) return 'Today';
    if (selectedDate === toIsoDate(addDays(today, 1))) return 'Tomorrow';
    if (!date) return 'Not selected';
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  }, [selectedDate, today]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const firstDay = monthStart.getDay();
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const days: Array<{ date: Date | null; key: string }> = [];

    for (let index = 0; index < firstDay; index += 1) {
      days.push({ date: null, key: `pad-${index}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      days.push({ date, key: toIsoDate(date) });
    }

    return days;
  }, [calendarMonth]);

  const dateBlocks = quickDates.map((date, index) => {
    const iso = toIsoDate(date);
    const isSelected = selectedDate === iso;
    const label = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : formatShortDay(iso);
    return {
      iso,
      label,
      day: date.getDate(),
      month: monthNames[date.getMonth()],
      isSelected,
    };
  });

  const selectedDateIsToday = selectedDate === toIsoDate(today);
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const availableSlotGroups = useMemo(
    () =>
      timeGroups.map((group) => ({
        label: group.label,
        slots: group.slots.map((slot) => {
          const disabled = isPastDate(selectedDate)
            || (selectedDateIsToday && getSlotMinutes(slot, group.label) < currentMinutes + 30);
          return {
            value: slot,
            label: toTimeLabel(slot, group.label),
            disabled,
          };
        }),
      })),
    [currentMinutes, selectedDate, selectedDateIsToday],
  );

  const availableSlotCount = availableSlotGroups.reduce(
    (count, group) => count + group.slots.filter((slot) => !slot.disabled).length,
    0,
  );
  const selectedTimeLabel = useMemo(
    () => availableSlotGroups.flatMap((group) => group.slots).find((slot) => slot.value === selectedTime)?.label ?? selectedTime,
    [availableSlotGroups, selectedTime],
  );

  useEffect(() => {
    const firstAvailableSlot = availableSlotGroups.flatMap((group) => group.slots).find((slot) => !slot.disabled);
    if (firstAvailableSlot && !availableSlotGroups.some((group) => group.slots.some((slot) => slot.value === selectedTime && !slot.disabled))) {
      setSelectedTime(firstAvailableSlot.value);
    }
  }, [availableSlotGroups, selectedTime]);

  const clearInlineError = () => setInlineError(null);

  const validateBooking = () => {
    clearInlineError();
    setCouponError('');
    if (!selectedVehicle) {
      setInlineError({
        title: 'Select a vehicle',
        message: 'Please choose the vehicle for this booking.',
        actionLabel: 'Choose Vehicle',
        onAction: () => setVehicleModalVisible(true),
      });
      return false;
    }
    if (!selectedAddressValue.trim()) {
      setInlineError({
        title: 'Add a service address',
        message: 'Please add or choose the address where the service should happen.',
        actionLabel: 'Add Address',
        onAction: () => setAddressModalVisible(true),
      });
      return false;
    }
    if (isPastDate(selectedDate)) {
      setInlineError({
        title: 'Select a valid date',
        message: 'Booking date cannot be in the past.',
        actionLabel: 'Pick Date',
        onAction: () => setCalendarModalVisible(true),
      });
      return false;
    }
    const selectedSlot = availableSlotGroups
      .flatMap((group) => group.slots)
      .find((slot) => slot.value === selectedTime);
    if (!selectedTime || selectedSlot?.disabled) {
      setInlineError({
        title: 'Choose an available time',
        message: availableSlotCount > 0
          ? 'Please select a time slot that is still available.'
          : 'No time slots are available for the selected date.',
        actionLabel: availableSlotCount > 0 ? 'Choose Another Time' : 'Pick Date',
        onAction: availableSlotCount > 0
          ? () => {
            clearInlineError();
          }
          : () => setCalendarModalVisible(true),
      });
      return false;
    }
    return true;
  };

  const submitBooking = async () => {
    if (!validateBooking()) return;

    try {
      clearInlineError();
      setSubmitting(true);
      const customerId = await getCurrentCustomerId();
      const createdBooking = await createBookingRequest({
        customer: customerId,
        vehicle: selectedVehicle!._id,
        services: [service._id],
        bookingDate: selectedDate,
        preferredTime: selectedTime,
        pickupRequired,
        address: selectedAddressValue.trim(),
        notes: notes.trim() || undefined,
      });
      setBooking(createdBooking);
      onSuccess(createdBooking);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to place booking';
      const isNetworkIssue = /network|fetch|internet|connection/i.test(message);
      setInlineError({
        title: isNetworkIssue ? 'No internet connection' : 'Booking failed',
        message: isNetworkIssue ? 'Check your connection and try again.' : message,
        actionLabel: 'Try Again',
        onAction: () => void submitBooking(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openAddressEditor = (address?: SavedAddress) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressDraftLabel(address.label);
      setAddressDraftValue(address.value);
    } else {
      setEditingAddressId(null);
      setAddressDraftLabel('Home');
      setAddressDraftValue('');
    }
    setAddressModalVisible(true);
  };

  const saveAddressDraft = () => {
    const label = addressDraftLabel.trim();
    const value = addressDraftValue.trim();
    if (!label || !value) {
      setInlineError({
        title: 'Save address',
        message: 'Please enter both an address label and the address itself.',
      });
      return;
    }

    setInlineError(null);
    const id = editingAddressId ?? `address-${Date.now()}`;
    setSavedAddresses((current) => {
      const next = current.filter((item) => item.id !== id);
      const existingAddress = current.find((item) => item.id === id);
      return [...next, { id, label, value, isDefault: existingAddress?.isDefault ?? current.length === 0 }];
    });
    setSelectedAddressId(id);
    setAddressModalVisible(false);
    setEditingAddressId(null);
    setAddressDraftLabel('');
    setAddressDraftValue('');
  };

  if (booking) {
    return (
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.successScreen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.successCard, successAnimation]}>
              <View style={styles.successDecor}>
                <View style={styles.successGlowOne} />
                <View style={styles.successGlowTwo} />
              </View>

              <View style={styles.successIconWrap}>
                <CheckCircle2 size={56} color={colors.success} strokeWidth={2.2} />
              </View>
              <Text style={styles.successTitle}>Booking Confirmed</Text>
              <Text style={styles.successSubtitle}>Your booking has been placed successfully.</Text>

              <View style={styles.successInfoCard}>
                <InfoRow label="Booking ID" value={booking.bookingId} copyable />
                <InfoRow label="Service" value={service.name} />
                <InfoRow label="Vehicle" value={`${selectedVehicle?.make ?? ''} ${selectedVehicle?.modelName ?? ''}`.trim()} />
                <InfoRow label="Date" value={formatDateLabel(booking.bookingDate)} />
                <InfoRow label="Time" value={selectedTimeLabel} />
              </View>

              <View style={styles.successActions}>
                <PremiumButton
                  label="Track Booking"
                  onPress={() => {
                    onOpenMyBookings?.();
                  }}
                />
                {(() => {
                  const bookingWithInvoice = booking as CreatedBooking & {
                    invoiceUrl?: string;
                    invoice?: { url?: string; downloadUrl?: string };
                  };
                  const invoiceUrl = bookingWithInvoice.invoiceUrl ?? bookingWithInvoice.invoice?.downloadUrl ?? bookingWithInvoice.invoice?.url;
                  return invoiceUrl ? (
                    <PremiumButton
                      label="Download Invoice"
                      variant="secondary"
                      onPress={() => {
                        void Linking.openURL(invoiceUrl).catch(() => undefined);
                      }}
                    />
                  ) : null;
                })()}
                <PremiumButton
                  label="Go Home"
                  variant="secondary"
                  onPress={onGoHome ?? onBack}
                />
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={2.2} />
          </Pressable>
          <View style={styles.topTitleWrap}>
            <Text style={styles.screenTitle}>Book {service.name}</Text>
            <Text style={styles.screenSubtitle}>Everything in one premium booking screen</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
          keyboardShouldPersistTaps="handled"
        >
          {inlineError ? (
            <NoticeCard
              title={inlineError.title}
              message={inlineError.message}
              actionLabel={inlineError.actionLabel}
              onAction={inlineError.onAction}
              tone={/failed|internet|missing|invalid|past|available/i.test(inlineError.title) ? 'danger' : 'neutral'}
            />
          ) : null}

          <SectionCard title="Vehicle" icon={<Car size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
            {loading ? (
              <View style={styles.inlineLoader}>
                <ActivityIndicator color={colors.primaryBright} />
                <Text style={styles.inlineLoaderText}>Loading your vehicles...</Text>
              </View>
            ) : selectedVehicle ? (
              <Pressable
                style={({ pressed }) => [styles.vehicleCard, pressed && styles.pressed]}
                onPress={() => {
                  clearInlineError();
                  setVehicleModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Change vehicle"
              >
                <View style={styles.vehicleGraphic}>
                  <Car size={30} color={colors.primaryBright} strokeWidth={2.2} />
                </View>
                <View style={styles.vehicleCopy}>
                  <View style={styles.vehicleTopRow}>
                    <Text style={styles.vehicleName}>{`${selectedVehicle.make} ${selectedVehicle.modelName}`}</Text>
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  </View>
                  <Text style={styles.vehicleMeta}>{selectedVehicle.plateNumber}</Text>
                </View>
                <View style={styles.changeVehiclePill}>
                  <Text style={styles.changeVehicleText}>Change</Text>
                  <ChevronDown size={14} color={colors.primaryBright} strokeWidth={2.2} />
                </View>
              </Pressable>
            ) : (
              <EmptyPanel
                title="No vehicles saved"
                message="Add a vehicle before confirming the booking."
                actionLabel="Refresh"
                onAction={() => {
                  setLoading(true);
                  void (async () => {
                    try {
                      const list = await fetchVehiclesForBooking();
                      setVehicles(list);
                    } finally {
                      setLoading(false);
                    }
                  })();
                }}
                icon={<Car size={24} color={colors.primaryBright} strokeWidth={2.1} />}
              />
            )}
          </SectionCard>

          <SectionCard title="Service Address" icon={<MapPin size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
            {selectedAddress ? (
              <View style={styles.addressCard}>
                <View style={styles.addressIconWrap}>
                  <MapPin size={18} color={colors.primaryBright} strokeWidth={2.2} />
                </View>
                <View style={styles.addressCopy}>
                  <View style={styles.addressTopRow}>
                    <Text style={styles.addressLabel}>{selectedAddressLabel}</Text>
                    {selectedAddress.isDefault ? (
                      <View style={styles.defaultBadge}>
                        <Check size={11} color={colors.success} strokeWidth={2.4} />
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.addressValue} numberOfLines={2}>
                    {selectedAddressDisplay || 'Add your service address to continue'}
                  </Text>
                </View>
                <Pressable
                  style={styles.addAddressButton}
                  onPress={() => {
                    clearInlineError();
                    openAddressEditor(selectedAddress);
                  }}
                >
                  <Text style={styles.addAddressButtonText}>Edit</Text>
                </Pressable>
              </View>
            ) : (
              <EmptyPanel
                title="No address saved"
                message="Add a service address so we can confirm your booking."
                actionLabel="Add Address"
                onAction={() => openAddressEditor()}
                icon={<MapPin size={24} color={colors.primaryBright} strokeWidth={2.1} />}
              />
            )}

            <Pressable
              style={({ pressed }) => [styles.pickupRow, pressed && styles.pressed]}
              onPress={() => setPickupRequired((value) => !value)}
              accessibilityRole="button"
              accessibilityLabel="Toggle pickup and drop service"
            >
              <View style={styles.pickupCopy}>
                <Truck size={18} color={colors.primaryBright} strokeWidth={2.1} />
                <View style={styles.pickupTextWrap}>
                  <Text style={styles.pickupTitle}>Pickup & drop my vehicle</Text>
                  <Text style={styles.pickupSubtitle}>We will pick up and drop your vehicle</Text>
                </View>
              </View>
              <View style={[styles.switchPill, pickupRequired && styles.switchPillActive]}>
                <View style={[styles.switchKnob, pickupRequired && styles.switchKnobActive]} />
              </View>
            </Pressable>
          </SectionCard>

          <SectionCard title="Select Date" icon={<CalendarDays size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRail}>
              {dateBlocks.map((date) => (
                <Pressable
                  key={date.iso}
                  style={({ pressed }) => [styles.dateChip, date.isSelected && styles.dateChipActive, pressed && styles.pressed]}
                  onPress={() => {
                    clearInlineError();
                    setSelectedDate(date.iso);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${date.label} ${date.day} ${date.month}`}
                >
                  <Text style={[styles.dateChipLabel, date.isSelected && styles.dateChipLabelActive]}>{date.label}</Text>
                  <Text style={[styles.dateChipValue, date.isSelected && styles.dateChipValueActive]}>
                    {date.day} {date.month}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={({ pressed }) => [styles.moreDateChip, pressed && styles.pressed]}
                onPress={() => setCalendarModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Open calendar to choose more dates"
              >
                <CalendarDays size={16} color={colors.primaryBright} strokeWidth={2.2} />
                <Text style={styles.moreDateText}>More Dates</Text>
              </Pressable>
            </ScrollView>
          </SectionCard>

          <SectionCard title="Select Time" icon={<Clock3 size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
            {availableSlotCount > 0 ? (
              availableSlotGroups.map((group) => {
                const groupAvailable = group.slots.filter((slot) => !slot.disabled);
                return (
                  <View key={group.label} style={styles.timeGroup}>
                    <View style={styles.timeGroupHeader}>
                      <Text style={styles.timeGroupTitle}>{group.label}</Text>
                      <Text style={styles.timeGroupMeta}>{groupAvailable.length} available</Text>
                    </View>
                    <View style={styles.timeChipGrid}>
                      {group.slots.map((slot) => {
                        const isSelected = selectedTime === slot.value;
                        return (
                          <Pressable
                            key={slot.value}
                            disabled={slot.disabled}
                            style={({ pressed }) => [
                              styles.timeChip,
                              isSelected && styles.timeChipActive,
                              slot.disabled && styles.timeChipDisabled,
                              pressed && !slot.disabled && styles.pressed,
                            ]}
                            onPress={() => {
                              clearInlineError();
                              setSelectedTime(slot.value);
                            }}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: slot.disabled, selected: isSelected }}
                            accessibilityLabel={`${slot.label}${slot.disabled ? ' unavailable' : ''}`}
                          >
                            <Text
                              style={[
                                styles.timeChipText,
                                isSelected && styles.timeChipTextActive,
                                slot.disabled && styles.timeChipTextDisabled,
                              ]}
                            >
                              {slot.label}
                            </Text>
                            <Text
                              style={[
                                styles.timeChipState,
                                isSelected && styles.timeChipStateActive,
                                slot.disabled && styles.timeChipStateDisabled,
                              ]}
                            >
                              {slot.disabled ? 'Unavailable' : isSelected ? 'Selected' : 'Available'}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            ) : (
              <EmptyPanel
                title="No time slots available"
                message="Please choose another date to see available slots."
                actionLabel="Pick Date"
                onAction={() => setCalendarModalVisible(true)}
                icon={<Clock3 size={24} color={colors.primaryBright} strokeWidth={2.1} />}
              />
            )}
          </SectionCard>

          <SectionCard title="Notes" icon={<Wrench size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
            <TextInput
              value={notes}
              onChangeText={(value) => {
                setNotes(value);
                clearInlineError();
              }}
              placeholder="Any special instructions?"
              placeholderTextColor={colors.textLight}
              style={styles.notesInput}
              multiline
            />
          </SectionCard>

          <SectionCard title="Coupon" icon={<TicketPercent size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
            <View style={styles.couponRow}>
              <TextInput
                value={couponCode}
                onChangeText={(value) => {
                  setCouponCode(value);
                  setCouponError('');
                }}
                placeholder="Enter coupon code"
                placeholderTextColor={colors.textLight}
                style={styles.couponInput}
                autoCapitalize="characters"
              />
              <Pressable
                style={({ pressed }) => [styles.applyCouponButton, pressed && styles.pressed]}
                onPress={() => {
                  clearInlineError();
                  const normalized = couponCode.trim().toUpperCase();
                  if (!normalized) {
                    setAppliedCoupon('');
                    setCouponError('');
                    return;
                  }
                  if (normalized === 'SAVE10' || normalized === 'WELCOME10') {
                    setAppliedCoupon(normalized);
                    setCouponError('');
                  } else {
                    setAppliedCoupon('');
                    setCouponError('Invalid coupon code. Please try another code.');
                  }
                }}
              >
                <Text style={styles.applyCouponText}>Apply</Text>
              </Pressable>
            </View>
            {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
            {appliedCoupon ? (
              <Text style={styles.couponAppliedText}>Coupon {appliedCoupon} applied</Text>
            ) : (
              <View style={styles.couponEmptyState}>
                <Text style={styles.couponEmptyTitle}>No coupon applied</Text>
                <Text style={styles.couponEmptyText}>Add a promo code if you have one.</Text>
              </View>
            )}
          </SectionCard>

          <SectionCard title="Price Summary" icon={<Wallet size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
            <SummaryRow label="Service Price" value={formatCurrency(service.price)} />
            <SummaryRow label="Discount" value={discount > 0 ? `- ${formatCurrency(discount)}` : formatCurrency(0)} highlighted={discount > 0} />
            <SummaryRow label="Pickup Charge" value={pickupRequired ? formatCurrency(pickupCharge) : formatCurrency(0)} />
            <View style={styles.summaryDivider} />
            <SummaryRow label="Total" value={formatCurrency(totalPrice)} total />
          </SectionCard>
        </ScrollView>

        <View style={[styles.stickyBar, { bottom: stickyBarBottom }]}>
          <View style={styles.stickyTotal}>
            <Text style={styles.stickyLabel}>Total Payable</Text>
            <Text style={styles.stickyValue}>{formatCurrency(totalPrice)}</Text>
            <Text style={styles.stickyHint}>You won&apos;t be charged now</Text>
          </View>
          <PremiumButton
            label={submitting ? 'Confirming...' : 'Confirm Booking'}
            onPress={() => void submitBooking()}
            loading={submitting}
            style={styles.confirmButton}
          />
        </View>

        <Modal visible={vehicleModalVisible} transparent animationType="fade" onRequestClose={() => setVehicleModalVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setVehicleModalVisible(false)}>
            <View style={styles.bottomSheetCard}>
              <SheetHeader title="Choose Vehicle" subtitle="Select the vehicle you want serviced." />
              <ScrollView contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false}>
                {vehicles.length > 0 ? vehicles.map((vehicle) => {
                  const isSelected = vehicle._id === selectedVehicleId;
                  return (
                    <Pressable
                      key={vehicle._id}
                      style={[styles.modalItem, isSelected && styles.modalItemActive]}
                      onPress={() => {
                        clearInlineError();
                        setSelectedVehicleId(vehicle._id);
                        setVehicleModalVisible(false);
                      }}
                    >
                      <View style={styles.vehicleSheetThumb}>
                        <Car size={20} color={colors.primaryBright} strokeWidth={2.2} />
                      </View>
                      <View style={styles.modalItemCopy}>
                        <View style={styles.modalItemTopRow}>
                          <Text style={styles.modalItemTitle}>{`${vehicle.make} ${vehicle.modelName}`}</Text>
                          {isSelected ? (
                            <View style={styles.selectionBadge}>
                              <Check size={11} color={colors.primaryBright} strokeWidth={2.4} />
                              <Text style={styles.selectionBadgeText}>Selected</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.modalItemMeta}>{vehicle.plateNumber}</Text>
                      </View>
                      {isSelected ? <Check size={18} color={colors.primaryBright} strokeWidth={2.2} /> : null}
                    </Pressable>
                  );
                }) : (
                  <EmptyPanel
                    title="No vehicles available"
                    message="We could not find a saved vehicle for this account."
                    icon={<Car size={24} color={colors.primaryBright} strokeWidth={2.1} />}
                  />
                )}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        <Modal visible={addressModalVisible} transparent animationType="fade" onRequestClose={() => setAddressModalVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAddressModalVisible(false)}>
            <View style={styles.bottomSheetCard}>
              <SheetHeader
                title="Service Address"
                subtitle="Choose a saved address or add a new one."
              />
              <ScrollView contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false}>
                {savedAddresses.length > 0 ? savedAddresses.map((address) => {
                  const isSelected = address.id === selectedAddressId;
                  return (
                    <View key={address.id} style={[styles.modalItem, styles.addressModalItem, isSelected && styles.modalItemActive]}>
                      <Pressable
                        style={styles.addressSelectionRow}
                        onPress={() => {
                          clearInlineError();
                          setSelectedAddressId(address.id);
                        }}
                      >
                        <View style={styles.addressModalIcon}>
                          <MapPin size={16} color={colors.primaryBright} strokeWidth={2.2} />
                        </View>
                        <View style={styles.modalItemCopy}>
                          <View style={styles.modalItemTopRow}>
                            <Text style={styles.modalItemTitle}>{address.label}</Text>
                            {address.isDefault ? (
                              <View style={styles.defaultBadge}>
                                <Check size={11} color={colors.success} strokeWidth={2.4} />
                                <Text style={styles.defaultBadgeText}>Default</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.modalItemMeta} numberOfLines={2}>{address.value}</Text>
                        </View>
                        {isSelected ? <Check size={18} color={colors.primaryBright} strokeWidth={2.2} /> : null}
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.sheetEditButton, pressed && styles.pressed]}
                        onPress={() => openAddressEditor(address)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${address.label} address`}
                      >
                        <Text style={styles.sheetEditButtonText}>Edit</Text>
                      </Pressable>
                    </View>
                  );
                }) : (
                  <EmptyPanel
                    title="No saved addresses"
                    message="Add an address to complete your booking."
                    icon={<MapPin size={24} color={colors.primaryBright} strokeWidth={2.1} />}
                  />
                )}

                <View style={styles.addressFormCard}>
                  <Text style={styles.addressFormTitle}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</Text>
                  <TextInput
                    value={addressDraftLabel}
                    onChangeText={setAddressDraftLabel}
                    placeholder="Address label"
                    placeholderTextColor={colors.textLight}
                    style={styles.addressLabelInput}
                  />
                  <TextInput
                    value={addressDraftValue}
                    onChangeText={setAddressDraftValue}
                    placeholder="Enter service address"
                    placeholderTextColor={colors.textLight}
                    style={styles.modalInput}
                    multiline
                  />
                  <View style={styles.modalActions}>
                    <PremiumButton
                      label={editingAddressId ? 'Save Address' : 'Add Address'}
                      onPress={saveAddressDraft}
                    />
                  </View>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        <Modal visible={calendarModalVisible} transparent animationType="fade" onRequestClose={() => setCalendarModalVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCalendarModalVisible(false)}>
            <View style={styles.bottomSheetCard}>
              <SheetHeader title="More Dates" subtitle="Choose a date from the calendar." />
              <View style={styles.calendarHeader}>
                <Pressable
                  style={styles.calendarNavButton}
                  onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                >
                  <ChevronLeft size={18} color={colors.text} strokeWidth={2.2} />
                </Pressable>
                <Text style={styles.calendarTitle}>{formatMonthTitle(calendarMonth)}</Text>
                <Pressable
                  style={styles.calendarNavButton}
                  onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                >
                  <ChevronRight size={18} color={colors.text} strokeWidth={2.2} />
                </Pressable>
              </View>

              <View style={styles.weekdayRow}>
                {weekdayNames.map((day) => (
                  <Text key={day} style={styles.weekdayText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarDays.map((entry) => {
                  if (!entry.date) {
                    return <View key={entry.key} style={styles.calendarCell} />;
                  }

                  const iso = toIsoDate(entry.date);
                  const isSelected = selectedDate === iso;
                  const disabled = isPastDate(iso);

                  return (
                    <Pressable
                      key={entry.key}
                      disabled={disabled}
                      style={[
                        styles.calendarCell,
                        isSelected && styles.calendarCellSelected,
                        disabled && styles.calendarCellDisabled,
                      ]}
                      onPress={() => {
                        clearInlineError();
                        setSelectedDate(iso);
                        setCalendarModalVisible(false);
                      }}
                    >
                      <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected, disabled && styles.calendarDayTextDisabled]}>
                        {entry.date.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIconWrap}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
    {children}
  </View>
);

const SummaryRow = ({
  label,
  value,
  highlighted,
  total,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
  total?: boolean;
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text
      style={[
        styles.summaryValue,
        highlighted && styles.summaryValueHighlighted,
        total && styles.summaryValueTotal,
      ]}
    >
      {value}
    </Text>
  </View>
);

const InfoRow = ({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValueRow}>
      <Text style={styles.infoValue}>{value}</Text>
      {copyable ? <Copy size={14} color={colors.textLight} strokeWidth={2.1} /> : null}
    </View>
  </View>
);

const NoticeCard = ({
  title,
  message,
  actionLabel,
  onAction,
  tone = 'neutral',
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'danger' | 'success';
}) => {
  const iconColor = tone === 'danger' ? colors.danger : tone === 'success' ? colors.success : colors.primaryBright;
  return (
    <View
      style={[
        styles.noticeCard,
        tone === 'danger' && styles.noticeCardDanger,
        tone === 'success' && styles.noticeCardSuccess,
      ]}
    >
      <View style={[styles.noticeIconWrap, tone === 'danger' && styles.noticeIconWrapDanger, tone === 'success' && styles.noticeIconWrapSuccess]}>
        <CheckCircle2 size={18} color={iconColor} strokeWidth={2.2} />
      </View>
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeMessage}>{message}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable style={({ pressed }) => [styles.noticeAction, pressed && styles.pressed]} onPress={onAction}>
          <Text style={styles.noticeActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const EmptyPanel = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon: React.ReactNode;
}) => (
  <View style={styles.emptyPanel}>
    <View style={styles.emptyPanelIcon}>{icon}</View>
    <Text style={styles.emptyPanelTitle}>{title}</Text>
    <Text style={styles.emptyPanelMessage}>{message}</Text>
    {actionLabel && onAction ? (
      <Pressable style={({ pressed }) => [styles.emptyPanelAction, pressed && styles.pressed]} onPress={onAction}>
        <Text style={styles.emptyPanelActionText}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

const SheetHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.sheetHeader}>
    <View style={styles.sheetHandle} />
    <Text style={styles.modalTitle}>{title}</Text>
    <Text style={styles.sheetSubtitle}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  topTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  screenTitle: {
    ...typography.sectionTitle,
    fontSize: 22,
  },
  screenSubtitle: {
    ...typography.subtitle,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 160,
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  sectionHeader: {
    marginBottom: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  inlineLoaderText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  vehicleGraphic: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  vehicleName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  vehicleMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  changeVehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  changeVehicleText: {
    color: colors.primaryBright,
    fontSize: 12,
    fontWeight: '800',
  },
  vehicleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  primaryBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  emptyInlineCard: {
    paddingVertical: 14,
  },
  emptyInlineText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: spacing.md,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  addressIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  addressLabel: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  addressValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  addAddressButton: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  addAddressButtonText: {
    color: colors.primaryBright,
    fontSize: 12,
    fontWeight: '800',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  defaultBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pickupCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pickupTextWrap: {
    flex: 1,
  },
  pickupTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  pickupSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  switchPill: {
    width: 54,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderSoft,
    padding: 3,
    justifyContent: 'center',
  },
  switchPillActive: {
    backgroundColor: colors.primaryBright,
  },
  switchKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  switchKnobActive: {
    alignSelf: 'flex-end',
  },
  chipRail: {
    gap: 10,
    paddingRight: 4,
  },
  dateChip: {
    minWidth: 86,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: {
    backgroundColor: colors.primaryBright,
    borderColor: colors.primaryBright,
  },
  dateChipLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  dateChipLabelActive: {
    color: '#FFFFFF',
  },
  dateChipValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  dateChipValueActive: {
    color: '#FFFFFF',
  },
  moreDateChip: {
    minWidth: 100,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  moreDateText: {
    color: colors.primaryBright,
    fontSize: 13,
    fontWeight: '800',
  },
  timeGroup: {
    gap: 10,
    marginBottom: 14,
  },
  timeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeGroupTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  timeGroupMeta: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '700',
  },
  timeChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  timeChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: '#BFDBFE',
  },
  timeChipDisabled: {
    backgroundColor: colors.secondary,
    borderColor: colors.borderSoft,
    opacity: 0.7,
  },
  timeChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  timeChipTextActive: {
    color: colors.primaryBright,
  },
  timeChipTextDisabled: {
    color: colors.textLight,
  },
  timeChipState: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  timeChipStateActive: {
    color: colors.primaryBright,
  },
  timeChipStateDisabled: {
    color: colors.textLight,
  },
  notesInput: {
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  applyCouponButton: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCouponText: {
    color: colors.primaryBright,
    fontSize: 13,
    fontWeight: '800',
  },
  couponErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  couponAppliedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  couponEmptyState: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: 2,
  },
  couponEmptyTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  couponEmptyText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryValueHighlighted: {
    color: colors.success,
  },
  summaryValueTotal: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  stickyBar: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    ...shadow.float,
  },
  stickyTotal: {
    flex: 1,
    minWidth: 0,
  },
  stickyLabel: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stickyValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  stickyHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  confirmButton: {
    flex: 1.05,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  noticeCardDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF1F2',
  },
  noticeCardSuccess: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  noticeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeIconWrapDanger: {
    backgroundColor: '#FFE4E6',
  },
  noticeIconWrapSuccess: {
    backgroundColor: '#DCFCE7',
  },
  noticeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  noticeMessage: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  noticeAction: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryBright,
  },
  noticeActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  emptyPanel: {
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyPanelIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPanelTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  emptyPanelMessage: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyPanelAction: {
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryBright,
  },
  emptyPanelActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  sheetHeader: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    gap: 8,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.borderSoft,
  },
  sheetSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -4,
  },
  bottomSheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: Math.max(spacing.lg, 24),
    maxHeight: '88%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  vehicleSheetThumb: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalList: {
    gap: 10,
    paddingTop: spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  modalItemActive: {
    backgroundColor: colors.primarySoft,
    borderColor: '#BFDBFE',
  },
  selectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectionBadgeText: {
    color: colors.primaryBright,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalItemCopy: {
    flex: 1,
    minWidth: 0,
  },
  modalItemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  modalItemMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  modalInput: {
    minHeight: 110,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  modalActions: {
    marginTop: spacing.md,
  },
  addressModalItem: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  addressSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetEditButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  sheetEditButtonText: {
    color: colors.primaryBright,
    fontSize: 12,
    fontWeight: '800',
  },
  addressFormCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: 10,
  },
  addressFormTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  addressLabelInput: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    maxHeight: '82%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  weekdayText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '800',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
  },
  calendarCellSelected: {},
  calendarCellDisabled: {
    opacity: 0.35,
  },
  calendarDayText: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    paddingVertical: 10,
  },
  calendarDayTextSelected: {
    backgroundColor: colors.primaryBright,
    color: '#FFFFFF',
  },
  calendarDayTextDisabled: {
    color: colors.textLight,
    backgroundColor: colors.secondary,
  },
  successScreen: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  successContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  successDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  successGlowOne: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primarySoft,
    opacity: 0.75,
  },
  successGlowTwo: {
    position: 'absolute',
    top: 36,
    left: -24,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.successSoft,
    opacity: 0.75,
  },
  successIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successSoft,
    marginBottom: spacing.md,
  },
  successTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  successInfoCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: 10,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  successActions: {
    gap: 10,
    marginTop: spacing.lg,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
});

export default OneScreenBookingFlow;
