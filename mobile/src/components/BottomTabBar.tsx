import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Home, Package, UserRound, Wrench } from 'lucide-react-native';
import { colors, iconStroke, radius, shadow, spacing } from '../theme/tokens';

export type TabKey = 'home' | 'services' | 'parts' | 'notifications' | 'profile';

interface BottomTabBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

const tabs: Array<{ key: TabKey; label: string; Icon: typeof Home }> = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'parts', label: 'Parts', Icon: Package },
  { key: 'services', label: 'Services', Icon: Wrench },
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
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: 'transparent',
  },
  navContainer: {
    minHeight: 78,
    backgroundColor: colors.background,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
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
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 20,
    minWidth: 56,
  },
  tabPillActive: {
    backgroundColor: colors.primarySoft,
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
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.1,
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
