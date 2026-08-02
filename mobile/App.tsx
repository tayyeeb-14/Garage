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
import CartScreen, { CartItem } from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderListScreen from './src/orders/OrderListScreen';
import OrderDetailsScreen from './src/orders/OrderDetailsScreen';
import BottomTabBar, { TabKey } from './src/components/BottomTabBar';
import { initialNotifications, NotificationItem } from './src/data/notifications';
import { clearAuthState, getAuthTokens, getStoredAuthUser, verifyAuthToken } from './src/services/authService';
import { PublicPart } from './src/services/dashboardService';

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
  const [authUserName, setAuthUserName] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [servicesIntent, setServicesIntent] = useState<{ serviceId?: string } | null>(null);
  const [authScreenKey, setAuthScreenKey] = useState(0);

  const handleChangeTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab !== 'profile') {
      setShowMyBookings(false);
      setShowMyOrders(false);
    }
    if (tab !== 'services') {
      setServicesIntent(null);
    }
    setShowCart(false);
    setShowCheckout(false);
    setShowOrderDetails(false);
  };

  const handleOpenMyBookings = () => {
    setActiveTab('profile');
    setShowMyBookings(true);
    setShowMyOrders(false);
  };

  const handleOpenMyOrders = () => {
    setActiveTab('profile');
    setShowMyOrders(true);
    setShowMyBookings(false);
    setShowCart(false);
    setShowCheckout(false);
    setShowOrderDetails(false);
  };

  const handleAddToCart = (part: PublicPart) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.part._id === part._id);
      if (existing) {
        return current.map((item) =>
          item.part._id === part._id ? { ...item, quantity: Math.min(part.quantity, item.quantity + 1) } : item,
        );
      }
      return [...current, { part, quantity: 1 }];
    });
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems((current) => current.filter((item) => item.part._id !== itemId));
  };

  const handleUpdateCartItemQuantity = (itemId: string, quantity: number) => {
    setCartItems((current) =>
      current.map((item) => (item.part._id === itemId ? { ...item, quantity } : item)),
    );
  };

  const handleOpenCart = () => {
    setActiveTab('parts');
    setShowCart(true);
    setShowCheckout(false);
    setShowMyBookings(false);
    setShowMyOrders(false);
    setShowOrderDetails(false);
  };

  const handleBackFromCart = () => {
    setShowCart(false);
  };

  const handleProceedToCheckout = () => {
    setShowCheckout(true);
    setShowCart(false);
  };

  const handleOrderPlaced = () => {
    setCartItems([]);
    setShowCheckout(false);
    setShowCart(false);
    setShowMyOrders(true);
    setSelectedOrderId(null);
    setShowOrderDetails(false);
    setActiveTab('profile');
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderDetails(true);
    setShowMyOrders(false);
  };

  const handleCloseOrderDetails = () => {
    setSelectedOrderId(null);
    setShowOrderDetails(false);
  };

  const verifyAuth = async () => {
    await getAuthTokens();
    const result = await verifyAuthToken();
    setAuthStatus(result);
    setIsAuthenticated(result === 'authenticated');
    const storedUser = result === 'authenticated' ? await getStoredAuthUser() : null;
    setAuthUserName(storedUser?.fullName?.trim() || '');
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
    void (async () => {
      const storedUser = await getStoredAuthUser();
      setAuthUserName(storedUser?.fullName?.trim() || '');
    })();
  };

  const handleRetry = () => {
    setShowSplash(true);
    setAuthStatus('checking');
    void verifyAuth();
  };

  const handleLogout = async () => {
    await clearAuthState();
    setAuthUserName('');
    setNotifications(initialNotifications);
    setActiveTab('home');
    setShowMyBookings(false);
    setShowMyOrders(false);
    setShowCart(false);
    setShowCheckout(false);
    setSelectedOrderId(null);
    setCartItems([]);
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
          showCheckout ? (
            <CheckoutScreen
              cartItems={cartItems}
              onOrderPlaced={handleOrderPlaced}
              onBack={() => setShowCheckout(false)}
            />
          ) : showCart ? (
            <CartScreen
              cartItems={cartItems}
              onRemoveItem={handleRemoveCartItem}
              onUpdateQuantity={handleUpdateCartItemQuantity}
              onCheckout={handleProceedToCheckout}
              onBack={handleBackFromCart}
            />
          ) : showOrderDetails && selectedOrderId ? (
            <OrderDetailsScreen orderId={selectedOrderId} onClose={handleCloseOrderDetails} />
          ) : showMyOrders ? (
            <OrderListScreen onSelectOrder={handleSelectOrder} onBack={() => setShowMyOrders(false)} />
          ) : activeTab === 'home' ? (
            <HomeDashboard
              onNavigateTab={handleChangeTab}
              onOpenMyBookings={handleOpenMyBookings}
              onOpenServiceDetail={(serviceId) => {
                setServicesIntent({ serviceId });
                setActiveTab('services');
              }}
              currentUserFullName={authUserName}
              unreadNotificationCount={notifications.filter((item) => !item.read).length}
            />
          ) : activeTab === 'services' ? (
            <ServicesScreen
              initialServiceId={servicesIntent?.serviceId}
              onOpenMyBookings={handleOpenMyBookings}
              onNavigateHome={() => handleChangeTab('home')}
            />
          ) : activeTab === 'parts' ? (
            <PartsScreen onAddToCart={handleAddToCart} onOpenCart={handleOpenCart} />
          ) : activeTab === 'notifications' ? (
            <NotificationsScreen
              notifications={notifications}
              onMarkAllRead={() => {
                setNotifications((current) => current.map((item) => (item.read ? item : { ...item, read: true })));
              }}
            />
          ) : (
            <ProfileScreen
              showMyBookings={showMyBookings}
              showMyOrders={showMyOrders}
              onShowMyBookings={setShowMyBookings}
              onShowMyOrders={setShowMyOrders}
              onOpenMyOrders={handleOpenMyOrders}
              onOpenCart={handleOpenCart}
              onBookService={() => {
                setShowMyBookings(false);
                setShowMyOrders(false);
                setServicesIntent(null);
                setActiveTab('services');
              }}
              onLogout={handleLogout}
              cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
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
