import {
  Badge,
  Icon,
  Label,
  NativeTabs,
  type NativeTabOptions,
} from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

type UnderlappingTabOptions = NativeTabOptions & {
  overrideScrollViewContentInsetAdjustmentBehavior: boolean;
};

const underlappingTabOptions: UnderlappingTabOptions = {
  overrideScrollViewContentInsetAdjustmentBehavior: false,
};

export default function AppTabs() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const systemLabel =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ dark: '#FFFFFF', light: '#000000' })
      : colors.text;

  return (
    <NativeTabs
      backgroundColor={Platform.OS === 'ios' ? null : colors.surface}
      indicatorColor={colors.accentSoft}
      labelStyle={{ color: systemLabel, fontSize: 10 }}
      minimizeBehavior="onScrollDown"
      tintColor={Platform.OS === 'ios' ? systemLabel : colors.accent}>
      <NativeTabs.Trigger name="(overview)" options={underlappingTabOptions}>
        <Label>Overview</Label>
        <Icon
          androidSrc={require('@/assets/images/tabIcons/home.png')}
          sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(reconcile)" options={underlappingTabOptions}>
        <Label>Reconcile</Label>
        <Icon
          androidSrc={require('@/assets/images/tabIcons/explore.png')}
          sf={{ default: 'checkmark.circle', selected: 'checkmark.circle.fill' }}
        />
        <Badge>5</Badge>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
