import { Platform } from 'react-native';

export const colors = {
  background: '#07090F',
  surface: 'rgba(20,24,35,0.62)',
  surfaceRaised: 'rgba(255,255,255,0.08)',
  surfaceSoft: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.12)',
  text: '#F7F8FC',
  muted: '#9DA6B8',
  subtle: '#626B7D',
  accent: '#D7FF73',
  accentDark: 'rgba(174,255,74,0.14)',
  green: '#7DF29C',
  red: '#FF7C88',
  orange: '#FFBD72',
  purple: '#B6A5FF',
  blue: '#72C7FF',
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
