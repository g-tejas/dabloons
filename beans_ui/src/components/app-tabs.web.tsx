import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  TabList,
  TabListProps,
  TabSlot,
  Tabs,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import type { FinanceIconName } from '@/constants/finance-data';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="(overview)" href="/" asChild>
            <TabButton icon="space-dashboard">Overview</TabButton>
          </TabTrigger>
          <TabTrigger name="(reconcile)" href="/reconcile" asChild>
            <TabButton icon="task-alt">Reconcile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon: FinanceIconName }) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && { backgroundColor: theme.accentSoft },
        pressed && styles.pressed,
      ]}>
      <MaterialIcons
        color={isFocused ? theme.accent : theme.textTertiary}
        name={icon}
        size={18}
      />
      <Text style={[styles.tabLabel, { color: isFocused ? theme.accent : theme.textSecondary }]}>
        {children}
      </Text>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <View {...props} pointerEvents="box-none" style={styles.tabListContainer}>
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: scheme === 'dark' ? 'rgba(21,28,24,0.92)' : 'rgba(255,255,255,0.92)',
            borderColor: theme.glassBorder,
          },
        ]}>
        <View style={[styles.bean, { backgroundColor: theme.accent }]} />
        <Text style={[styles.brand, { color: theme.text }]}>beans</Text>
        <View style={styles.separator} />
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: Spacing.four,
    pointerEvents: 'box-none',
    position: 'absolute',
    width: '100%',
    zIndex: 100,
  },
  innerContainer: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.one,
    maxWidth: MaxContentWidth,
    padding: 6,
    shadowColor: '#2B3C32',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
  },
  bean: {
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 5,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 9,
    height: 18,
    marginLeft: 9,
    transform: [{ rotate: '-35deg' }],
    width: 12,
  },
  brand: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginLeft: 3,
  },
  separator: {
    width: Spacing.two,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.62,
  },
});
