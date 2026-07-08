import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowRight, Car, Sparkles } from 'lucide-react-native';
import { colors, iconStroke, radius, shadow, spacing } from '../../theme/tokens';
import { MobileBanner } from '../../services/bannerService';

const HERO_HEIGHT = 248;

const fallbackCopy = {
  badge: 'PREMIUM DOORSTEP SERVICE',
  title: 'Premium Bike Service',
  titleLine2: 'At Your Doorstep',
  subtitle: 'Trusted technicians • Genuine parts • Transparent pricing',
  cta: 'Book Service',
};

type HeroBannerCarouselProps = {
  banners: MobileBanner[];
  bannerIndex: number;
  onIndexChange: React.Dispatch<React.SetStateAction<number>>;
  fallbackImage?: string;
  onBookPress?: () => void;
};

const HeroBannerCarousel = ({
  banners,
  bannerIndex,
  onIndexChange,
  fallbackImage,
  onBookPress,
}: HeroBannerCarouselProps) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideCount = banners.length || 1;
  const activeBanner = banners[bannerIndex] ?? null;
  const imageUri = activeBanner?.imageUrl ?? fallbackImage;

  useEffect(() => {
    if (banners.length <= 1) return undefined;

    const timer = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        onIndexChange((current) => (current + 1) % banners.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: false,
        }).start();
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length, fadeAnim, onIndexChange]);

  const handleCtaPress = () => {
    if (activeBanner?.ctaAction === 'external' && activeBanner.targetUrl) {
      void Linking.openURL(activeBanner.targetUrl);
      return;
    }
    onBookPress?.();
  };

  const titleLines = activeBanner?.title
    ? activeBanner.title.split('\n')
    : [fallbackCopy.title, fallbackCopy.titleLine2];

  const subtitle = activeBanner?.subtitle ?? fallbackCopy.subtitle;
  const showSecondTitleLine = titleLines.length > 1;

  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.badge}>
        <Sparkles size={12} color="#FFFFFF" strokeWidth={iconStroke} />
        <Text style={styles.badgeText}>{fallbackCopy.badge}</Text>
      </View>

      <Text style={styles.title}>{titleLines[0]}</Text>
      {showSecondTitleLine ? <Text style={styles.titleAccent}>{titleLines[1]}</Text> : null}

      <Text style={styles.subtitle}>{subtitle}</Text>

      <Pressable
        style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
        onPress={handleCtaPress}
      >
        <Text style={styles.ctaText}>{activeBanner?.ctaText ?? fallbackCopy.cta}</Text>
        <ArrowRight size={18} color={colors.primaryBright} strokeWidth={2.5} />
      </Pressable>
    </View>
  );

  const renderOverlay = () => (
    <>
      <View style={styles.overlayTop} />
      <View style={styles.overlayMid} />
      <View style={styles.overlayBottom} />
    </>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {Array.from({ length: slideCount }).map((_, index) => (
        <Pressable
          key={banners[index]?._id ?? `dot-${index}`}
          onPress={() => onIndexChange(index)}
          style={[styles.dot, index === bannerIndex ? styles.dotActive : null]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.heroShell, { opacity: fadeAnim }]}>
        {imageUri ? (
          <ImageBackground source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover">
            {renderOverlay()}
            {renderContent()}
            {renderPagination()}
          </ImageBackground>
        ) : (
          <View style={[styles.heroImage, styles.fallbackBg]}>
            {fallbackImage ? (
              <ImageBackground source={{ uri: fallbackImage }} style={styles.fallbackBgImage} resizeMode="cover">
                {renderOverlay()}
                {renderContent()}
                {renderPagination()}
              </ImageBackground>
            ) : (
              <>
                {renderOverlay()}
                <View style={styles.fallbackIcon}>
                  <Car size={56} color="rgba(255,255,255,0.25)" strokeWidth={iconStroke} />
                </View>
                {renderContent()}
                {renderPagination()}
              </>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  heroShell: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    height: HERO_HEIGHT,
    ...shadow.float,
  },
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT,
    justifyContent: 'flex-end',
  },
  fallbackBg: {
    backgroundColor: '#0F172A',
  },
  fallbackBgImage: {
    width: '100%',
    height: HERO_HEIGHT,
    justifyContent: 'flex-end',
  },
  fallbackIcon: {
    position: 'absolute',
    top: 28,
    right: 28,
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlayMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '72%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + 8,
    zIndex: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  titleAccent: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    maxWidth: '92%',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 48,
  },
  ctaText: {
    color: colors.primaryBright,
    fontSize: 15,
    fontWeight: '800',
  },
  pagination: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

export default HeroBannerCarousel;
