import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, BookOpen, Home, Package, UserRound } from 'lucide-react-native';

export type TabKey = 'home' | 'services' | 'bookings' | 'notifications' | 'profile';

interface BottomTabBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: 'home', label: 'Home', icon: <Home size={18} /> },
  { key: 'bookings', label: 'Bookings', icon: <BookOpen size={18} /> },
  { key: 'services', label: 'Parts', icon: <Package size={18} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { key: 'profile', label: 'Profile', icon: <UserRound size={18} /> },
];

const BottomTabBar = ({ activeTab, onChangeTab }: BottomTabBarProps) => (
  <View style={styles.navContainer}>
    {tabs.map((tab) => {
      const isActive = activeTab === tab.key;
      const iconColor = isActive ? '#0f172a' : '#94a3b8';
      return (
        <Pressable
          key={tab.key}
          onPress={() => onChangeTab(tab.key)}
          style={({ pressed }) => [styles.tabButton, pressed && styles.tabButtonPressed]}
        >
          <View style={styles.tabIcon}>{React.isValidElement(tab.icon) ? React.cloneElement(tab.icon, { color: iconColor }) : tab.icon}</View>
          <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>{tab.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 78,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabButtonPressed: {
    opacity: 0.64,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#0f172a',
  },
  tabLabelInactive: {
    color: '#94a3b8',
  },
});

export default BottomTabBar;
