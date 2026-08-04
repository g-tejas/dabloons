import { Platform } from 'react-native';

export const colors = {
  background: '#080B0A',
  surface: '#101412',
  surfaceRaised: '#161B18',
  surfaceSoft: '#1B211D',
  border: '#242B27',
  text: '#F3F5F3',
  muted: '#8F9993',
  subtle: '#59625D',
  accent: '#C7FF59',
  accentDark: '#263617',
  green: '#6BE585',
  red: '#FF746D',
  orange: '#FFB86B',
  purple: '#A998FF',
  blue: '#66B7FF',
  white: '#FFFFFF',
};

export const fonts = {
  regular: Platform.select({ ios: 'Avenir Next', default: 'sans-serif' }),
  medium: Platform.select({ ios: 'Avenir Next Medium', default: 'sans-serif-medium' }),
  demi: Platform.select({ ios: 'Avenir Next Demi Bold', default: 'sans-serif-medium' }),
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};
