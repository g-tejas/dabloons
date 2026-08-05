import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SystemIcon } from '@/components/finance/system-icon';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: Math.max(insets.bottom, 10),
            shadowColor: scheme === 'dark' ? '#000000' : '#536070',
          },
        ],
      }}>
      <Tabs.Screen
        name="(overview)"
        options={{
          tabBarAccessibilityLabel: 'Overview',
          tabBarIcon: ({ color, focused }) => (
            <SystemIcon
              color={color}
              fallback="space-dashboard"
              name={focused ? 'chart.pie.fill' : 'chart.pie'}
              size={20}
              weight={focused ? 'semibold' : 'regular'}
            />
          ),
          title: 'Overview',
        }}
      />
      <Tabs.Screen
        name="(reconcile)"
        options={{
          tabBarAccessibilityLabel: 'Reconcile',
          tabBarBadge: 5,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, focused }) => (
            <SystemIcon
              color={color}
              fallback="task-alt"
              name={focused ? 'checkmark.circle.fill' : 'checkmark.circle'}
              size={20}
              weight={focused ? 'semibold' : 'regular'}
            />
          ),
          title: 'Reconcile',
        }}
      />
    </Tabs>
  );
}

function GlassTabBarBackground() {
  const scheme = useColorScheme() ?? 'light';
  const nativeGlass =
    Platform.OS === 'ios' &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable();

  return (
    <View style={styles.glassBackground}>
      {nativeGlass ? (
        <GlassView
          glassEffectStyle="regular"
          style={StyleSheet.absoluteFill}
          tintColor={scheme === 'dark' ? 'rgba(22,22,24,0.22)' : 'rgba(255,255,255,0.18)'}
        />
      ) : (
        <BlurView
          intensity={78}
          style={StyleSheet.absoluteFill}
          tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        />
      )}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.glassBorder,
          {
            borderColor:
              scheme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.72)',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 9,
    minWidth: 16,
    top: 2,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 31,
    overflow: 'hidden',
  },
  glassBorder: {
    borderRadius: 31,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderRadius: 31,
    elevation: 0,
    height: 62,
    left: 54,
    paddingBottom: 0,
    position: 'absolute',
    right: 54,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  tabItem: {
    borderRadius: 28,
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
