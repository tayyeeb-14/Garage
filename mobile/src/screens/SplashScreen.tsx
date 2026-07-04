import React, { useEffect, useRef } from 'react';
import { Animated, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const dotsAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(dotsAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ),
    ]).start();

    const timer = setTimeout(onFinish, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [logoAnimation, dotsAnimation, onFinish]);

  const scale = logoAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const opacity = logoAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 1],
  });

  const dotOpacity = dotsAnimation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.3, 1, 0.3, 1, 0.3],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { opacity, transform: [{ scale }] }]}> 
          <Image source={require('../../assets/images/splash-logo.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.brandName}>M Enterprises</Text>
          <Text style={styles.brandTag}>Professional Garage Services</Text>
        </Animated.View>

        <View style={styles.loaderRow}>
          <Animated.View style={[styles.loaderDot, { opacity: dotOpacity }]} />
          <Animated.View style={[styles.loaderDot, { opacity: dotOpacity, marginLeft: 10, transform: [{ scale }] }]} />
          <Animated.View style={[styles.loaderDot, { opacity: dotOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }), marginLeft: 10 }]} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 160,
    height: 160,
    marginBottom: 26,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  brandTag: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  loaderRow: {
    flexDirection: 'row',
    marginTop: 40,
    alignItems: 'center',
  },
  loaderDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563eb',
  },
});

export default SplashScreen;
