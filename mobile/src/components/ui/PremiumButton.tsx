import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

type PremiumButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  compact?: boolean;
};

const PremiumButton = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  compact = false,
}: PremiumButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : null,
        variant === 'primary' ? styles.primary : null,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'ghost' ? styles.ghost : null,
        variant === 'outline' ? styles.outline : null,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primaryBright} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' ? styles.labelPrimary : null,
            variant === 'secondary' || variant === 'outline' ? styles.labelSecondary : null,
            variant === 'ghost' ? styles.labelGhost : null,
            isDisabled ? styles.labelDisabled : null,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  primary: {
    backgroundColor: colors.primaryBright,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
  labelSecondary: {
    color: colors.primaryBright,
  },
  labelGhost: {
    color: colors.textMuted,
  },
  labelDisabled: {
    color: colors.textLight,
  },
});

export default PremiumButton;
