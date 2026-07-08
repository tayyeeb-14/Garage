import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

const SectionHeader = ({ title, actionLabel, onActionPress }: SectionHeaderProps) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {actionLabel ? (
      <Pressable onPress={onActionPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <Text style={styles.actionText}>{actionLabel}</Text>
        <ChevronRight size={16} color={colors.primaryBright} strokeWidth={2.5} />
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: typography.sectionTitle,
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    color: colors.primaryBright,
    fontWeight: '700',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default SectionHeader;
