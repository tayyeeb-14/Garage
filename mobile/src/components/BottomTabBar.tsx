import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, BookOpen, Home, UserRound, Wrench } from 'lucide-react-native';
import { colors, iconStroke, radius, shadow, spacing } from '../theme/tokens';

export type TabKey = 'home' | 'services' | 'bookings' | 'notifications' | 'profile';

interface BottomTabBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

const tabs: Array<{ key: TabKey; label: string; Icon: typeof Home }> = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'bookings', label: 'Bookings', Icon: BookOpen },
  { key: 'services', label: 'Garage', Icon: Wrench },
  { key: 'notifications', label: 'Notifications', Icon: Bell },
  { key: 'profile', label: 'Profile', Icon: UserRound },
];

const BottomTabBar = ({ activeTab, onChangeTab }: BottomTabBarProps) => (
  <View style={styles.wrapper}>
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const { Icon } = tab;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChangeTab(tab.key)}
            style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
          >
            <View style={[styles.tabPill, isActive ? styles.tabPillActive : null]}>
              <View style={[styles.tabIconWrap, isActive ? styles.tabIconWrapActive : null]}>
                <Icon
                  size={20}
                  color={isActive ? '#FFFFFF' : colors.textLight}
                  strokeWidth={iconStroke}
                />
              </View>
              <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: 'transparent',
  },
  navContainer: {
    height: 80,
    backgroundColor: colors.background,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    ...shadow.float,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    minWidth: 52,
  },
  tabPillActive: {
    backgroundColor: 'transparent',
  },
  tabIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: colors.primaryBright,
    ...shadow.card,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: colors.primaryBright,
  },
  tabLabelInactive: {
    color: colors.textLight,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});

export default BottomTabBar;
