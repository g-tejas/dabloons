import type { PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme, View, type ViewProps } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

type InsetGroupProps = PropsWithChildren<ViewProps>;

export function InsetGroup({ children, style, ...props }: InsetGroupProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <View
      style={[styles.group, { backgroundColor: theme.surface }, style]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
});
