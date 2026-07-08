import React from 'react';
import { Alert, Platform, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookOpen, ChevronRight, Headphones, MapPin, ShieldCheck, Sparkles, UserRound, Wallet } from 'lucide-react-native';
import BookingHistoryScreen from '../booking/BookingHistoryScreen';
import { Profile } from '../services/dashboardService';
import { clearAuthState } from '../services/authService';

const confirmAction = (message: string) => {
  const maybeConfirm = (globalThis as typeof globalThis & { confirm?: (message?: string) => boolean }).confirm;
  return typeof maybeConfirm === 'function' ? maybeConfirm(message) : false;
};

interface ProfileScreenProps {
  profile?: Profile | null;
  showMyBookings?: boolean;
  onShowMyBookings?: (show: boolean) => void;
  onLogout?: () => Promise<void> | void;
}

const ProfileScreen = ({ profile, showMyBookings, onShowMyBookings, onLogout }: ProfileScreenProps) => {
  const firstName = profile?.fullName?.split(' ')[0] ?? 'Customer';

  const performLogout = async () => {
    console.log('ProfileScreen: confirmation accepted');
    console.log('ProfileScreen: calling clearAuthState');
    await clearAuthState();
    console.log('ProfileScreen: clearAuthState finished');
    console.log('ProfileScreen: calling App logout handler');
    if (onLogout) {
      await onLogout();
    }
  };

  const handleLogout = async () => {
    console.log('ProfileScreen: logout button pressed');

    if (Platform.OS === 'web') {
      const confirmed = confirmAction('Are you sure you want to logout?');
      console.log('ProfileScreen: confirmation dialog result', confirmed);
      if (confirmed) {
        await performLogout();
      }
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel', onPress: () => console.log('ProfileScreen: confirmation cancelled') },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await performLogout();
        },
      },
    ]);
  };

  const menuItems = [
    { title: 'My Profile', icon: <UserRound size={18} color="#2563eb" /> },
    { title: 'My Bookings', icon: <BookOpen size={18} color="#2563eb" />, action: () => onShowMyBookings?.(true) },
    { title: 'Saved Addresses', icon: <MapPin size={18} color="#2563eb" /> },
    { title: 'Favourite Services', icon: <Sparkles size={18} color="#2563eb" /> },
    { title: 'Support', icon: <Headphones size={18} color="#2563eb" /> },
    { title: 'Privacy Policy', icon: <ShieldCheck size={18} color="#2563eb" /> },
  ];

  if (showMyBookings) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => onShowMyBookings?.(false)}>
          <Text style={styles.backButtonText}>← Back to Profile</Text>
        </TouchableOpacity>
        <BookingHistoryScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>{profile?.fullName ? <Text style={styles.avatarText}>{profile.fullName[0].toUpperCase()}</Text> : <Text style={styles.avatarText}>M</Text>}</View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile?.fullName ?? 'M Enterprises Customer'}</Text>
            <Text style={styles.email}>{profile?.email ?? 'profile@example.com'}</Text>
            <View style={styles.membershipChip}>
              <Wallet size={14} color="#2563eb" />
              <Text style={styles.membershipText}>Premium Member</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>My Account</Text>
          <Text style={styles.sectionText}>Your account is ready to book services, track progress, and manage vehicles.</Text>
        </View>

        {menuItems.map((item) => (
          <TouchableOpacity key={item.title} style={styles.menuItem} activeOpacity={0.9} onPress={item.action}>
            <View style={styles.menuLeft}>
              {item.icon}
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          accessibilityLabel="Logout"
          testID="logout-button"
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#e0efff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#2563eb',
    fontSize: 28,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  email: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 15,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  sectionText: {
    color: '#64748b',
    lineHeight: 22,
  },
  membershipChip: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  membershipText: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuTitle: {
    color: '#0f172a',
    fontWeight: '800',
  },
  logoutButton: {
    marginTop: 18,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  backButton: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#f8fafc',
  },
  backButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ProfileScreen;
