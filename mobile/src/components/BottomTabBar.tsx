import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type TabKey = 'home' | 'services' | 'bookings' | 'notifications' | 'profile';

interface BottomTabBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'services', label: 'Services', icon: '🛠️' },
  { key: 'bookings', label: 'Bookings', icon: '📅' },
  { key: 'notifications', label: 'Alerts', icon: '🔔' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

const BottomTabBar = ({ activeTab, onChangeTab }: BottomTabBarProps) => (
  <View style={styles.navContainer}>
    {tabs.map((tab) => {
      const isActive = activeTab === tab.key;
      return (
        <Pressable
          key={tab.key}
          onPress={() => onChangeTab(tab.key)}
          style={({ pressed }) => [styles.tabButton, pressed && styles.tabButtonPressed]}
        >
          <Text style={[styles.tabIcon, isActive ? styles.tabIconActive : styles.tabIconInactive]}>{tab.icon}</Text>
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
    fontSize: 18,
  },
  tabIconActive: {
    color: '#0f172a',
  },
  tabIconInactive: {
    color: '#94a3b8',
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
