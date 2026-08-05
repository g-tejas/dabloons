import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function ReconcileStackLayout() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.background },
        headerLargeTitle: true,
        headerShadowVisible: false,
        headerTintColor: theme.accent,
      }}>
      <Stack.Screen name="reconcile" options={{ title: 'Reconcile' }} />
    </Stack>
  );
}
