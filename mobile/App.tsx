import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import HomeDashboard from './src/screens/HomeDashboard';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ServicesScreen from './src/services/ServiceScreen';
import BookingHistoryScreen from './src/booking/BookingHistoryScreen';
import BottomTabBar, { TabKey } from './src/components/BottomTabBar';
import { verifyAuthToken } from './src/services/authService';

const OfflineScreen = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.offlineContainer}>
    <Text style={styles.offlineTitle}>Server unavailable</Text>
    <Text style={styles.offlineMessage}>Please check your internet connection and try again.</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'offline';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const verifyAuth = async () => {
    console.log('Auth init start');
    const result = await verifyAuthToken();
    console.log('Auth verification result', result);
    setAuthStatus(result);
  };

  useEffect(() => {
    console.log('App mounted');
    void verifyAuth();
  }, []);

  const handleSplashFinish = () => {
    console.log('Splash finished');
    setShowSplash(false);
  };

  const handleAuthSuccess = () => {
    console.log('Auth success');
    setAuthStatus('authenticated');
  };

  const handleRetry = () => {
    console.log('Retrying auth verification');
    setShowSplash(true);
    setAuthStatus('checking');
    void verifyAuth();
  };

  if (showSplash || authStatus === 'checking') {
    console.log('Rendering splash screen');
    return (
      <View style={{ flex: 1 }}>
        <SplashScreen onFinish={handleSplashFinish} />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (authStatus === 'offline') {
    console.log('Rendering offline screen');
    return (
      <View style={{ flex: 1 }}>
        <OfflineScreen onRetry={handleRetry} />
        <StatusBar style="auto" />
      </View>
    );
  }

  console.log('Rendering app', authStatus === 'authenticated' ? 'Authenticated' : 'Guest');
  return (
    <View style={styles.appContainer}>
      <View style={styles.contentContainer}>
        {authStatus === 'authenticated' ? (
          activeTab === 'home' ? (
            <HomeDashboard />
          ) : activeTab === 'services' ? (
            <ServicesScreen />
          ) : activeTab === 'bookings' ? (
            <BookingHistoryScreen />
          ) : activeTab === 'notifications' ? (
            <NotificationsScreen />
          ) : (
            <ProfileScreen />
          )
        ) : (
          <AuthNavigator onAuthSuccess={handleAuthSuccess} />
        )}
      </View>
      {authStatus === 'authenticated' ? <BottomTabBar activeTab={activeTab} onChangeTab={setActiveTab} /> : null}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    flex: 1,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
  },
  offlineTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  offlineMessage: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
});
