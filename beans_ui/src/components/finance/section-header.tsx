import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, eyebrow, action, onAction }: SectionHeaderProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {eyebrow && <Text style={[styles.detail, { color: theme.textSecondary }]}>{eyebrow}</Text>}
      </View>
      {action && (
        <Pressable hitSlop={8} onPress={onAction}>
          {({ pressed }) => (
            <Text style={[styles.action, { color: theme.accent, opacity: pressed ? 0.45 : 1 }]}>
              {action}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.35,
    lineHeight: 25,
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
  },
  action: {
    fontSize: 16,
    lineHeight: 22,
  },
});
