import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SystemIcon } from '@/components/finance/system-icon';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: colors.textSecondary,
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

function FloatingGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const insets = useSafeAreaInsets();
  const glassApiAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable();
  const liquidGlassAvailable = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const nativeGlass = glassApiAvailable && liquidGlassAvailable;

  useEffect(() => {
    console.info(
      '[Dabloons glass diagnostic]',
      JSON.stringify({
        glassApiAvailable,
        liquidGlassAvailable,
        os: Platform.OS,
        version: Platform.Version,
      }),
    );
  }, [glassApiAvailable, liquidGlassAvailable]);

  const buttons = state.routes.map((route, index) => {
    const options = descriptors[route.key].options;
    const focused = state.index === index;
    const color = focused ? theme.accent : theme.textSecondary;
    const label =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : options.title ?? route.name;

    return (
      <Pressable
        accessibilityLabel={options.tabBarAccessibilityLabel}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        key={route.key}
        onPress={() => {
          const event = navigation.emit({
            canPreventDefault: true,
            target: route.key,
            type: 'tabPress',
          });
          if (!focused && !event.defaultPrevented) {
            void Haptics.selectionAsync();
            navigation.navigate(route.name, route.params);
          }
        }}
        onLongPress={() =>
          navigation.emit({
            target: route.key,
            type: 'tabLongPress',
          })
        }
        style={({ pressed }) => [
          styles.tabButton,
          focused && { backgroundColor: theme.accentSoft },
          pressed && styles.tabButtonPressed,
        ]}>
        <View style={styles.iconWrap}>
          {options.tabBarIcon?.({ color, focused, size: 20 })}
          {options.tabBarBadge != null && (
            <View style={[styles.badge, { backgroundColor: theme.danger }]}>
              <Text style={styles.badgeText}>{String(options.tabBarBadge)}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </Pressable>
    );
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarWrap,
        {
          bottom: Math.max(insets.bottom, 10),
          shadowColor: scheme === 'dark' ? '#000000' : '#536070',
        },
      ]}>
      {nativeGlass ? (
        <GlassView
          glassEffectStyle="clear"
          isInteractive
          style={styles.glassBar}>
          {buttons}
        </GlassView>
      ) : (
        <BlurView
          intensity={78}
          style={[
            styles.glassBar,
            {
              backgroundColor:
                scheme === 'dark' ? 'rgba(24,24,26,0.42)' : 'rgba(255,255,255,0.42)',
              borderColor: theme.glassBorder,
            },
          ]}
          tint={scheme === 'dark' ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}>
          {buttons}
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -9,
    top: -7,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  glassBar: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 31,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 62,
    overflow: 'hidden',
    padding: 5,
    width: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabBarWrap: {
    height: 62,
    left: 54,
    position: 'absolute',
    right: 54,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    zIndex: 100,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 28,
    flex: 1,
    gap: 2,
    height: 52,
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
});
