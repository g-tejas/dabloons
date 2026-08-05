import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';

const DURATION = 520;

const fadeAway = new Keyframe({
  0: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  70: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  100: {
    easing: Easing.out(Easing.quad),
    opacity: 0,
    transform: [{ scale: 1.025 }],
  },
});

export function AnimatedSplashOverlay() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const brand = (
    <View style={styles.brand}>
      <View style={[styles.mark, { backgroundColor: theme.accent }]}>
        <View style={styles.bean}>
          <View style={styles.beanSeam} />
        </View>
      </View>
      <Text style={[styles.wordmark, { color: theme.text }]}>beans</Text>
      <Text style={[styles.tagline, { color: theme.textSecondary }]}>MONEY, MADE CLEAR</Text>
    </View>
  );

  if (animate) {
    return (
      <Animated.View
        entering={fadeAway.duration(DURATION).withCallback((finished) => {
          'worklet';
          if (finished) scheduleOnRN(setVisible, false);
        })}
        style={[styles.overlay, { backgroundColor: theme.background }]}>
        <View style={[styles.glow, { backgroundColor: theme.accentSoft }]} />
        {brand}
      </Animated.View>
    );
  }

  return (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setAnimate(true));
      }}
      style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={[styles.glow, { backgroundColor: theme.accentSoft }]} />
      {brand}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  glow: {
    borderRadius: 180,
    height: 360,
    position: 'absolute',
    width: 360,
  },
  brand: {
    alignItems: 'center',
  },
  mark: {
    alignItems: 'center',
    borderRadius: 22,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  bean: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 13,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 26,
    height: 48,
    justifyContent: 'center',
    transform: [{ rotate: '-35deg' }],
    width: 31,
  },
  beanSeam: {
    borderColor: '#007AFF',
    borderLeftWidth: 2,
    borderRadius: 14,
    height: 28,
    transform: [{ rotate: '19deg' }],
    width: 12,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginTop: 18,
  },
  tagline: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 7,
  },
});
