import React from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Profile } from '../services/dashboardService';

interface ProfileScreenProps {
  profile?: Profile | null;
  onLogout?: () => Promise<void> | void;
}

const ProfileScreen = ({ profile, onLogout }: ProfileScreenProps) => {
  const firstName = profile?.fullName?.split(' ')[0] ?? 'Customer';

  const handleLogout = () => {
    console.log('Logout button pressed');
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          if (onLogout) {
            void onLogout();
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>{profile?.fullName ? <Text style={styles.avatarText}>{profile.fullName[0].toUpperCase()}</Text> : <Text style={styles.avatarText}>M</Text>}</View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profile?.fullName ?? 'M Enterprises Customer'}</Text>
          <Text style={styles.email}>{profile?.email ?? 'profile@example.com'}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Membership</Text>
        <Text style={styles.sectionText}>Your account is ready to book services and manage vehicles.</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Support</Text>
        <Text style={styles.sectionText}>For help with bookings or billing, reach out to support from the web portal.</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 120,
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
});

export default ProfileScreen;
