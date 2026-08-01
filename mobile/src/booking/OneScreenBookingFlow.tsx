import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
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

const timeGroups: TimeGroup[] = [
  { label: 'Morning', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
  { label: 'Afternoon', slots: ['12:00', '12:30', '01:00', '01:30', '02:00', '02:30'] },
  { label: 'Evening', slots: ['05:00', '05:30', '06:00', '06:30', '07:00'] },
];

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (value: number) => String(value).padStart(2, '0');

const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
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
  return bookingDay < today;
};

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(parseIsoDate(value));

const formatShortDay = (value: string) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(parseIsoDate(value));

const formatMonthTitle = (date: Date) =>
  `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

const OneScreenBookingFlow = ({
  service,
  onBack,
  onSuccess,
  onOpenMyBookings,
  onGoHome,
}: OneScreenBookingFlowProps) => {
  const today = useMemo(() => new Date(), []);
  const quickDates = useMemo(() => Array.from({ length: 5 }, (_, index) => addDays(today, index)), [today]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [pickupRequired, setPickupRequired] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toIsoDate(today));
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<CreatedBooking | null>(null);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(today));

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

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle._id === selectedVehicleId) ?? vehicles[0] ?? null,
    [selectedVehicleId, vehicles],
  );

  useEffect(() => {
    if (!selectedVehicleId && selectedVehicle) {
      setSelectedVehicleId(selectedVehicle._id);
    }
  }, [selectedVehicle, selectedVehicleId]);

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

  const selectedDateText = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);
  const selectedDatePriceLabel = useMemo(() => {
    const date = parseIsoDate(selectedDate);
    const todayKey = toIsoDate(today);
    if (selectedDate === todayKey) return 'Today';
    if (selectedDate === toIsoDate(addDays(today, 1))) return 'Tomorrow';
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

  const validateBooking = () => {
    if (!selectedVehicle) {
      Alert.alert('Select a vehicle', 'Please choose the vehicle for this booking.');
      return false;
    }
    if (!selectedAddress.trim()) {
      Alert.alert('Add an address', 'Please add your service address before confirming.');
      return false;
    }
    if (isPastDate(selectedDate)) {
      Alert.alert('Select a valid date', 'Booking date cannot be in the past.');
      return false;
    }
    if (!selectedTime) {
      Alert.alert('Select a time', 'Please choose a preferred time slot.');
      return false;
    }
    return true;
  };

  const submitBooking = async () => {
    if (!validateBooking()) return;

    try {
      setSubmitting(true);
      const customerId = await getCurrentCustomerId();
      const createdBooking = await createBookingRequest({
        customer: customerId,
        vehicle: selectedVehicle!._id,
        services: [service._id],
        bookingDate: selectedDate,
        preferredTime: selectedTime,
        pickupRequired,
        address: selectedAddress.trim(),
        notes: notes.trim() || undefined,
      });
      setBooking(createdBooking);
      onSuccess(createdBooking);
    } catch (error) {
      Alert.alert('Booking failed', error instanceof Error ? error.message : 'Unable to place booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (booking) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.successCard}>
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
            <InfoRow label="Time" value={booking.preferredTime} />
          </View>

          <View style={styles.successActions}>
            <PremiumButton
              label="Track Booking"
              onPress={() => {
                onOpenMyBookings?.();
              }}
            />
            <PremiumButton
              label="Go Home"
              variant="secondary"
              onPress={onGoHome ?? onBack}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={onBack}>
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.topTitleWrap}>
          <Text style={styles.screenTitle}>Book {service.name}</Text>
          <Text style={styles.screenSubtitle}>Everything in one premium booking screen</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <SectionCard title="Vehicle" icon={<Car size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
          {loading ? (
            <View style={styles.inlineLoader}>
              <ActivityIndicator color={colors.primaryBright} />
              <Text style={styles.inlineLoaderText}>Loading your vehicles...</Text>
            </View>
          ) : selectedVehicle ? (
            <Pressable
              style={({ pressed }) => [styles.vehicleCard, pressed && styles.pressed]}
              onPress={() => setVehicleModalVisible(true)}
            >
              <View style={styles.vehicleGraphic}>
                <Car size={30} color={colors.primaryBright} strokeWidth={2.2} />
              </View>
              <View style={styles.vehicleCopy}>
                <Text style={styles.vehicleName}>{`${selectedVehicle.make} ${selectedVehicle.modelName}`}</Text>
                <Text style={styles.vehicleMeta}>{selectedVehicle.plateNumber}</Text>
              </View>
              <View style={styles.changeVehiclePill}>
                <Text style={styles.changeVehicleText}>Change Vehicle</Text>
                <ChevronDown size={14} color={colors.primaryBright} strokeWidth={2.2} />
              </View>
            </Pressable>
          ) : (
            <View style={styles.emptyInlineCard}>
              <Text style={styles.emptyInlineText}>No saved vehicle found. Please add one before booking.</Text>
            </View>
          )}
        </SectionCard>

        <SectionCard title="Service Address" icon={<MapPin size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
          <View style={styles.addressCard}>
            <View style={styles.addressIconWrap}>
              <MapPin size={18} color={colors.primaryBright} strokeWidth={2.2} />
            </View>
            <View style={styles.addressCopy}>
              <Text style={styles.addressLabel}>Saved Address</Text>
              <Text style={styles.addressValue} numberOfLines={2}>
                {selectedAddress.trim() || 'Add your service address to continue'}
              </Text>
            </View>
            <Pressable style={styles.addAddressButton} onPress={() => setAddressModalVisible(true)}>
              <Text style={styles.addAddressButtonText}>{selectedAddress.trim() ? 'Edit' : 'Add New Address'}</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.pickupRow, pressed && styles.pressed]}
            onPress={() => setPickupRequired((value) => !value)}
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
                onPress={() => setSelectedDate(date.iso)}
              >
                <Text style={[styles.dateChipLabel, date.isSelected && styles.dateChipLabelActive]}>{date.label}</Text>
                <Text style={[styles.dateChipValue, date.isSelected && styles.dateChipValueActive]}>
                  {date.day} {date.month}
                </Text>
              </Pressable>
            ))}
            <Pressable style={({ pressed }) => [styles.moreDateChip, pressed && styles.pressed]} onPress={() => setCalendarModalVisible(true)}>
              <CalendarDays size={16} color={colors.primaryBright} strokeWidth={2.2} />
              <Text style={styles.moreDateText}>More Dates</Text>
            </Pressable>
          </ScrollView>
        </SectionCard>

        <SectionCard title="Select Time" icon={<Clock3 size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
          {timeGroups.map((group) => (
            <View key={group.label} style={styles.timeGroup}>
              <View style={styles.timeGroupHeader}>
                <Text style={styles.timeGroupTitle}>{group.label}</Text>
              </View>
              <View style={styles.timeChipGrid}>
                {group.slots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <Pressable
                      key={slot}
                      style={({ pressed }) => [styles.timeChip, isSelected && styles.timeChipActive, pressed && styles.pressed]}
                      onPress={() => setSelectedTime(slot)}
                    >
                      <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>{slot}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Notes" icon={<Wrench size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
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
              onChangeText={setCouponCode}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.textLight}
              style={styles.couponInput}
              autoCapitalize="characters"
            />
            <Pressable
              style={({ pressed }) => [styles.applyCouponButton, pressed && styles.pressed]}
              onPress={() => {
                const normalized = couponCode.trim().toUpperCase();
                if (!normalized) {
                  setAppliedCoupon('');
                  return;
                }
                if (normalized === 'SAVE10' || normalized === 'WELCOME10') {
                  setAppliedCoupon(normalized);
                } else {
                  Alert.alert('Coupon unavailable', 'Please enter a valid coupon code.');
                }
              }}
            >
              <Text style={styles.applyCouponText}>Apply</Text>
            </Pressable>
          </View>
          {appliedCoupon ? <Text style={styles.couponAppliedText}>Coupon {appliedCoupon} applied</Text> : null}
        </SectionCard>

        <SectionCard title="Price Summary" icon={<Wallet size={18} color={colors.primaryBright} strokeWidth={2.1} />}>
          <SummaryRow label="Service Price" value={formatCurrency(service.price)} />
          <SummaryRow label="Discount" value={discount > 0 ? `- ${formatCurrency(discount)}` : formatCurrency(0)} highlighted={discount > 0} />
          <SummaryRow label="Pickup Charge" value={pickupRequired ? formatCurrency(pickupCharge) : formatCurrency(0)} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="Total" value={formatCurrency(totalPrice)} total />
        </SectionCard>
      </ScrollView>

      <View style={styles.stickyBar}>
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
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Vehicle</Text>
            <ScrollView contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false}>
              {vehicles.map((vehicle) => {
                const isSelected = vehicle._id === selectedVehicleId;
                return (
                  <Pressable
                    key={vehicle._id}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedVehicleId(vehicle._id);
                      setVehicleModalVisible(false);
                    }}
                  >
                    <Car size={18} color={colors.primaryBright} strokeWidth={2.1} />
                    <View style={styles.modalItemCopy}>
                      <Text style={styles.modalItemTitle}>{`${vehicle.make} ${vehicle.modelName}`}</Text>
                      <Text style={styles.modalItemMeta}>{vehicle.plateNumber}</Text>
                    </View>
                    {isSelected ? <Check size={18} color={colors.primaryBright} strokeWidth={2.2} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={addressModalVisible} transparent animationType="fade" onRequestClose={() => setAddressModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAddressModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            <TextInput
              value={selectedAddress}
              onChangeText={setSelectedAddress}
              placeholder="Enter service address"
              placeholderTextColor={colors.textLight}
              style={styles.modalInput}
              multiline
            />
            <View style={styles.modalActions}>
              <PremiumButton label="Save Address" onPress={() => setAddressModalVisible(false)} />
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={calendarModalVisible} transparent animationType="fade" onRequestClose={() => setCalendarModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCalendarModalVisible(false)}>
          <View style={styles.calendarCard}>
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
    </View>
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
  },
  timeChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: '#BFDBFE',
  },
  timeChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  timeChipTextActive: {
    color: colors.primaryBright,
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
  couponAppliedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    maxHeight: '82%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  modalList: {
    gap: 10,
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
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    ...shadow.card,
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
