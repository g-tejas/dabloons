import * as Haptics from 'expo-haptics';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useColorScheme } from 'react-native';

import { SystemIcon } from '@/components/finance/system-icon';
import { Colors, Fonts, Radius } from '@/constants/theme';

type CategoryPillProps = {
  account: string;
  compact?: boolean;
  color?: string;
};

export function CategoryPill({ account, compact = false }: CategoryPillProps) {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  function openCategory() {
    void Haptics.selectionAsync();
    router.push(`/category/${encodeURIComponent(account)}` as Href);
  }

  return (
    <Pressable
      accessibilityHint="Opens category details"
      accessibilityLabel={account}
      accessibilityRole="button"
      hitSlop={compact ? 8 : 6}
      onPress={openCategory}
      style={({ pressed }) => [
        compact ? styles.compact : [styles.button, { backgroundColor: theme.accentSoft }],
        pressed && styles.pressed,
      ]}>
      {!compact && (
        <SystemIcon color={theme.accent} fallback="label" name="tag.fill" size={12} weight="semibold" />
      )}
      <Text numberOfLines={1} style={[styles.text, compact && styles.compactText, { color: theme.accent }]}>
        {account}
      </Text>
      {!compact && (
        <SystemIcon color={theme.accent} fallback="chevron-right" name="chevron.right" size={9} weight="bold" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.small,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  compact: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  pressed: {
    opacity: 0.4,
  },
  text: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  compactText: {
    fontSize: 10,
  },
});
