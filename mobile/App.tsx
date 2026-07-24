import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import HomeDashboard from './src/screens/HomeDashboard';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ServicesScreen from './src/services/ServiceScreen';
import PartsScreen from './src/screens/PartsScreen';
import BottomTabBar, { TabKey } from './src/components/BottomTabBar';
import { clearAuthState, getAuthTokens, verifyAuthToken } from './src/services/authService';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [servicesIntent, setServicesIntent] = useState<{ serviceId?: string } | null>(null);
  const [authScreenKey, setAuthScreenKey] = useState(0);

  const handleChangeTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab !== 'profile') {
      setShowMyBookings(false);
    }
    if (tab !== 'services') {
      setServicesIntent(null);
    }
  };

  const handleOpenMyBookings = () => {
    setActiveTab('profile');
    setShowMyBookings(true);
  };

  const verifyAuth = async () => {
    const tokens = await getAuthTokens();
    const result = await verifyAuthToken();
    setAuthStatus(result);
    setIsAuthenticated(result === 'authenticated');
  };

  useEffect(() => {
    void verifyAuth();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleAuthSuccess = () => {
    setAuthStatus('authenticated');
    setIsAuthenticated(true);
  };

  const handleRetry = () => {
    setShowSplash(true);
    setAuthStatus('checking');
    void verifyAuth();
  };

  const handleLogout = async () => {
    await clearAuthState();
    setActiveTab('home');
    setShowMyBookings(false);
    setAuthStatus('unauthenticated');
    setIsAuthenticated(false);
    setAuthScreenKey((value) => value + 1);
    setShowSplash(false);
  };

  if (showSplash || authStatus === 'checking') {
    return (
      <View style={{ flex: 1 }}>
        <SplashScreen onFinish={handleSplashFinish} />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (authStatus === 'offline') {
    return (
      <View style={{ flex: 1 }}>
        <OfflineScreen onRetry={handleRetry} />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <View style={styles.contentContainer}>
        {isAuthenticated ? (
          activeTab === 'home' ? (
            <HomeDashboard
              onNavigateTab={handleChangeTab}
              onOpenMyBookings={handleOpenMyBookings}
              onOpenServiceDetail={(serviceId) => {
                setServicesIntent({ serviceId });
                setActiveTab('services');
              }}
            />
          ) : activeTab === 'services' ? (
            <ServicesScreen
              initialServiceId={servicesIntent?.serviceId}
              onOpenMyBookings={handleOpenMyBookings}
              onNavigateHome={() => handleChangeTab('home')}
            />
          ) : activeTab === 'parts' ? (
            <PartsScreen />
          ) : activeTab === 'notifications' ? (
            <NotificationsScreen />
          ) : (
            <ProfileScreen
              showMyBookings={showMyBookings}
              onShowMyBookings={setShowMyBookings}
              onBookService={() => {
                setShowMyBookings(false);
                setServicesIntent(null);
                setActiveTab('services');
              }}
              onLogout={handleLogout}
            />
          )
        ) : (
          <>
            {console.log('Auth screen shown')}
            <AuthNavigator key={authScreenKey} resetKey={authScreenKey} onAuthSuccess={handleAuthSuccess} />
          </>
        )}
      </View>
      {isAuthenticated ? <BottomTabBar activeTab={activeTab} onChangeTab={handleChangeTab} /> : null}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
