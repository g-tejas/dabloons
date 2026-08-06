import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function OverviewStackLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Overview' }} />
      <Stack.Screen
        name="category/[account]"
        options={{
          animation: 'slide_from_right',
          headerBackTitle: 'Overview',
          headerLargeTitle: false,
          title: 'Category',
        }}
      />
    </Stack>
  );
}
