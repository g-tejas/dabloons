/**
 * The visual system for Beans follows Apple's semantic system palette and
 * grouped-content hierarchy, with cross-platform fallbacks for Expo Go.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#636366',
    textTertiary: '#8E8E93',
    background: '#F2F2F7',
    backgroundElement: '#E5E5EA',
    backgroundSelected: '#D1D1D6',
    surface: '#FFFFFF',
    surfaceMuted: '#F2F2F7',
    glass: 'rgba(248,248,248,0.78)',
    glassBorder: 'rgba(255,255,255,0.68)',
    border: '#C6C6C8',
    accent: '#007AFF',
    accentStrong: '#0056B3',
    accentSoft: '#E5F1FF',
    positive: '#34C759',
    positiveSoft: '#E9F8ED',
    warning: '#FF9500',
    warningSoft: '#FFF4E5',
    danger: '#FF3B30',
    dangerSoft: '#FFE9E7',
    lavender: '#AF52DE',
    lavenderSoft: '#F6EAFB',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#AEAEB2',
    textTertiary: '#8E8E93',
    background: '#000000',
    backgroundElement: '#2C2C2E',
    backgroundSelected: '#3A3A3C',
    surface: '#1C1C1E',
    surfaceMuted: '#2C2C2E',
    glass: 'rgba(44,44,46,0.76)',
    glassBorder: 'rgba(255,255,255,0.16)',
    border: '#38383A',
    accent: '#0A84FF',
    accentStrong: '#409CFF',
    accentSoft: '#102A43',
    positive: '#30D158',
    positiveSoft: '#12351C',
    warning: '#FF9F0A',
    warningSoft: '#3A280A',
    danger: '#FF453A',
    dangerSoft: '#3D1514',
    lavender: '#BF5AF2',
    lavenderSoft: '#321540',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 48,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  xlarge: 32,
  pill: 999,
} as const;

// UIKit automatically gives native-tab scroll views their final resting inset.
// Adding the bar height again creates an opaque gap and prevents content from
// visibly passing beneath Liquid Glass while scrolling.
export const BottomTabInset = Platform.select({ ios: 0, android: 96, web: 84 }) ?? 84;
export const MaxContentWidth = 760;
