import { Platform } from 'react-native';

export const colors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceRaised: '#F2F2F7',
  surfaceSoft: '#E9E9EF',
  border: 'rgba(60,60,67,0.14)',
  text: '#111114',
  muted: '#6E6E73',
  subtle: '#AEAEB2',
  accent: '#007AFF',
  accentDark: 'rgba(0,122,255,0.11)',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  purple: '#AF52DE',
  blue: '#007AFF',
  white: '#FFFFFF',
};

export const fonts = {
  regular: Platform.select({ ios: 'System', default: 'sans-serif' }),
  medium: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  demi: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  mono: Platform.select({ ios: 'SF Mono', default: 'monospace' }),
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};
