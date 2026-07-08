import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, Clock3, Pencil } from 'lucide-react-native';
import { colors, iconStroke, radius, shadow, spacing } from '../theme/tokens';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
];

export const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (value: string) => {
  if (!value) return 'No date selected';
  return parseLocalDate(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDisplayDateShort = (value: string) => {
  if (!value) return 'Pick a date';
  return parseLocalDate(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDisplayTime = (value: string) => {
  if (!value) return 'No time selected';
  const [hours, minutes] = value.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
};

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate();

const buildCalendarDays = (viewMonth: Date) => {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startPadding = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<Date | null> = [];

  for (let index = 0; index < startPadding; index += 1) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
};

type PickerPhase = 'date' | 'time';

type BookingSchedulePickerProps = {
  bookingDate: string;
  preferredTime: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  dateError?: string;
  timeError?: string;
};

const BookingSchedulePicker = ({
  bookingDate,
  preferredTime,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
}: BookingSchedulePickerProps) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const initialViewMonth = bookingDate ? parseLocalDate(bookingDate) : today;
  const [viewMonth, setViewMonth] = useState(new Date(initialViewMonth.getFullYear(), initialViewMonth.getMonth(), 1));
  const [phase, setPhase] = useState<PickerPhase>(bookingDate ? 'time' : 'date');

  useEffect(() => {
    if (!bookingDate) {
      setPhase('date');
    }
  }, [bookingDate]);

  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const selectedDate = bookingDate ? parseLocalDate(bookingDate) : null;
  const showCalendar = phase === 'date';
  const showTimePicker = phase === 'time' && Boolean(bookingDate);

  const goToPreviousMonth = () => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    if (startOfDay(date) < today) {
      return;
    }
    onDateChange(formatDateValue(date));
    onTimeChange('');
    setPhase('time');
  };

  const handleChangeDate = () => {
    setPhase('date');
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.stepRow}>
        <View style={[styles.stepPill, phase === 'date' ? styles.stepPillActive : bookingDate ? styles.stepPillDone : null]}>
          <Calendar size={14} color={phase === 'date' ? colors.primaryBright : bookingDate ? colors.success : colors.textLight} strokeWidth={iconStroke} />
          <Text style={[styles.stepText, phase === 'date' ? styles.stepTextActive : bookingDate ? styles.stepTextDone : null]}>
            1. Date
          </Text>
        </View>
        <View style={styles.stepLine} />
        <View style={[styles.stepPill, phase === 'time' ? styles.stepPillActive : preferredTime ? styles.stepPillDone : null]}>
          <Clock3 size={14} color={phase === 'time' ? colors.primaryBright : preferredTime ? colors.success : colors.textLight} strokeWidth={iconStroke} />
          <Text style={[styles.stepText, phase === 'time' ? styles.stepTextActive : preferredTime ? styles.stepTextDone : null]}>
            2. Time
          </Text>
        </View>
      </View>

      {showCalendar ? (
        <View style={[styles.card, dateError ? styles.cardError : null]}>
          <Text style={styles.cardTitle}>Choose your service date</Text>
          <View style={styles.monthHeader}>
            <Pressable style={({ pressed }) => [styles.monthNavButton, pressed && styles.pressed]} onPress={goToPreviousMonth}>
              <ChevronLeft size={20} color={colors.primaryBright} strokeWidth={iconStroke} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </Text>
            <Pressable style={({ pressed }) => [styles.monthNavButton, pressed && styles.pressed]} onPress={goToNextMonth}>
              <ChevronRight size={20} color={colors.primaryBright} strokeWidth={iconStroke} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((weekday) => (
              <Text key={weekday} style={styles.weekdayText}>{weekday}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const disabled = startOfDay(day) < today;
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, today);

              return (
                <Pressable
                  key={formatDateValue(day)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    styles.dayButton,
                    isToday && !selected ? styles.dayToday : null,
                    selected ? styles.daySelected : null,
                    disabled ? styles.dayDisabled : null,
                    pressed && !disabled ? styles.pressed : null,
                  ]}
                  onPress={() => handleSelectDate(day)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selected ? styles.dayTextSelected : null,
                      disabled ? styles.dayTextDisabled : null,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {dateError && showCalendar ? <Text style={styles.fieldError}>{dateError}</Text> : null}

      {!showCalendar && bookingDate ? (
        <Pressable
          style={({ pressed }) => [styles.selectedDateBar, pressed && styles.pressed]}
          onPress={handleChangeDate}
        >
          <View style={styles.selectedDateIcon}>
            <Calendar size={18} color={colors.primaryBright} strokeWidth={iconStroke} />
          </View>
          <View style={styles.selectedDateCopy}>
            <Text style={styles.selectedDateLabel}>Selected date</Text>
            <Text style={styles.selectedDateValue}>{formatDisplayDate(bookingDate)}</Text>
          </View>
          <View style={styles.changeBtn}>
            <Pencil size={14} color={colors.primaryBright} strokeWidth={iconStroke} />
            <Text style={styles.changeBtnText}>Change</Text>
          </View>
        </Pressable>
      ) : null}

      {showTimePicker ? (
        <View style={[styles.card, styles.timeCard, timeError ? styles.cardError : null]}>
          <Text style={styles.cardTitle}>Choose your preferred time</Text>
          <Text style={styles.cardSubtitle}>{formatDisplayDateShort(bookingDate)}</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot) => {
              const selected = preferredTime === slot;
              return (
                <Pressable
                  key={slot}
                  style={({ pressed }) => [
                    styles.timeSlot,
                    selected ? styles.timeSlotSelected : null,
                    pressed ? styles.pressed : null,
                  ]}
                  onPress={() => onTimeChange(slot)}
                >
                  <Text style={[styles.timeSlotText, selected ? styles.timeSlotTextSelected : null]}>
                    {formatDisplayTime(slot)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {preferredTime ? (
            <View style={styles.timeSummary}>
              <Clock3 size={16} color={colors.primaryBright} strokeWidth={iconStroke} />
              <Text style={styles.timeSummaryText}>{formatDisplayTime(preferredTime)} selected</Text>
            </View>
          ) : (
            <Text style={styles.timeHint}>Tap a time slot to continue</Text>
          )}
        </View>
      ) : null}

      {timeError && showTimePicker ? <Text style={styles.fieldError}>{timeError}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stepPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  stepPillActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  stepPillDone: {
    backgroundColor: '#ECFDF5',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  stepTextActive: {
    color: colors.primaryBright,
  },
  stepTextDone: {
    color: colors.success,
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  timeCard: {
    marginTop: spacing.sm,
  },
  cardError: {
    borderColor: colors.danger,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.primaryBright,
    backgroundColor: colors.primarySoft,
  },
  daySelected: {
    backgroundColor: colors.primaryBright,
    borderWidth: 0,
  },
  dayDisabled: {
    backgroundColor: colors.borderSoft,
  },
  dayText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayTextDisabled: {
    color: colors.textLight,
  },
  selectedDateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  selectedDateIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDateCopy: {
    flex: 1,
  },
  selectedDateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  selectedDateValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  changeBtnText: {
    color: colors.primaryBright,
    fontWeight: '800',
    fontSize: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlot: {
    width: '30%',
    minWidth: 96,
    flexGrow: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: colors.primaryBright,
    borderColor: colors.primaryBright,
  },
  timeSlotText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeSummaryText: {
    color: colors.primaryBright,
    fontWeight: '800',
    fontSize: 14,
  },
  timeHint: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldError: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
    marginTop: -4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

export default BookingSchedulePicker;
