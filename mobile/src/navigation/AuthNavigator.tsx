import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

export type AuthRoute = 'login' | 'register' | 'forgot';

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
  resetKey?: number;
}

const AuthNavigator = ({ onAuthSuccess, resetKey }: AuthNavigatorProps) => {
  const [route, setRoute] = useState<AuthRoute>('login');

  useEffect(() => {
    setRoute('login');
  }, [resetKey]);

  const moveTo = (newRoute: AuthRoute) => setRoute(newRoute);

  console.log('Auth screen shown');

  return (
    <View style={{ flex: 1 }}>
      {route === 'login' && (
        <LoginScreen
          onLoginSuccess={onAuthSuccess}
          onNavigateRegister={() => moveTo('register')}
          onNavigateForgot={() => moveTo('forgot')}
        />
      )}
      {route === 'register' && (
        <RegisterScreen
          onRegisterSuccess={onAuthSuccess}
          onNavigateLogin={() => moveTo('login')}
        />
      )}
      {route === 'forgot' && <ForgotPasswordScreen onBackToLogin={() => moveTo('login')} />}
    </View>
  );
};

export default AuthNavigator;
