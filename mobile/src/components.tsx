import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import React, { PropsWithChildren, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Transaction } from './data';
import { colors, fonts, radii } from './theme';

type GlassSurfaceProps = PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  tintColor?: string;
  interactive?: boolean;
}>;

export function GlassSurface({
  children,
  style,
  tintColor = 'rgba(255,255,255,0.06)',
  interactive = false,
}: GlassSurfaceProps) {
  const nativeGlass =
    Platform.OS === 'ios' &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable();

  return (
    <View style={[styles.glassSurface, style]}>
      {nativeGlass ? (
        <GlassView
          glassEffectStyle="regular"
          isInteractive={interactive}
          style={StyleSheet.absoluteFill}
          tintColor={tintColor}
        />
      ) : (
        <BlurView
          intensity={44}
          style={StyleSheet.absoluteFill}
          tint="systemUltraThinMaterialDark"
        />
      )}
      <ExpoLinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.015)']}
        end={{ x: 0.8, y: 1 }}
        pointerEvents="none"
        start={{ x: 0.1, y: 0 }}
        style={styles.glassSheen}
      />
      {children}
    </View>
  );
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <GlassSurface interactive style={styles.iconButton}>
        <Ionicons color={colors.text} name={name} size={19} />
      </GlassSurface>
    </Pressable>
  );
}

export function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.action, { transform: [{ scale }] }]}>
        <GlassSurface interactive style={styles.actionIcon} tintColor="rgba(199,255,89,0.16)">
          <Ionicons color={colors.text} name={icon} size={20} />
        </GlassSurface>
        <Text style={styles.actionLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function TransactionRow({
  item,
  onPress,
}: {
  item: Transaction;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${item.merchant}, ${formatCurrency(item.amount)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.transaction, pressed && styles.rowPressed]}
    >
      <View style={[styles.transactionIcon, { backgroundColor: `${item.color}20` }]}>
        <Ionicons color={item.color} name={item.icon as keyof typeof Ionicons.glyphMap} size={20} />
      </View>
      <View style={styles.transactionCopy}>
        <Text style={styles.transactionTitle}>{item.merchant}</Text>
        <Text style={styles.transactionMeta}>{item.category} · {item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, item.amount > 0 && styles.income]}>
        {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
      </Text>
    </Pressable>
  );
}

export function LineChart({
  values,
  height = 160,
  interactive = true,
  onValueChange,
}: {
  values: number[];
  height?: number;
  interactive?: boolean;
  onValueChange?: (value: number | null) => void;
}) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const padding = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const points = useMemo(
    () =>
      values.map((value, index) => ({
        x: padding + (index / (values.length - 1)) * Math.max(width - padding * 2, 0),
        y: height - padding - ((value - min) / range) * (height - padding * 2),
      })),
    [height, min, range, values, width],
  );

  const path = points.reduce(
    (result, point, index) => `${result}${index === 0 ? 'M' : 'L'} ${point.x} ${point.y} `,
    '',
  );
  const areaPath = points.length
    ? `${path}L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  const updateActivePoint = (x: number) => {
    if (!interactive || width <= 0) return;
    const index = Math.max(0, Math.min(values.length - 1, Math.round((x / width) * (values.length - 1))));
    if (index !== activeIndex) {
      setActiveIndex(index);
      onValueChange?.(values[index]);
      Haptics.selectionAsync().catch(() => undefined);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: () => interactive,
        onPanResponderGrant: (event) => updateActivePoint(event.nativeEvent.locationX),
        onPanResponderMove: (event) => updateActivePoint(event.nativeEvent.locationX),
        onPanResponderRelease: () => {
          setActiveIndex(null);
          onValueChange?.(null);
        },
        onPanResponderTerminate: () => {
          setActiveIndex(null);
          onValueChange?.(null);
        },
      }),
    [activeIndex, interactive, onValueChange, values, width],
  );

  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const activePoint = activeIndex === null ? points[points.length - 1] : points[activeIndex];

  return (
    <View
      accessibilityLabel="Balance history chart. Drag to inspect values."
      onLayout={handleLayout}
      style={{ height }}
      {...panResponder.panHandlers}
    >
      {width > 0 && (
        <Svg height={height} width={width}>
          <Defs>
            <LinearGradient id="chartFade" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity="0.2" />
              <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill="url(#chartFade)" />
          <Path d={path} fill="none" stroke={colors.accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
          {activeIndex !== null && activePoint && (
            <Path
              d={`M ${activePoint.x} 0 L ${activePoint.x} ${height}`}
              stroke={colors.subtle}
              strokeDasharray="3 5"
              strokeWidth="1"
            />
          )}
          {activePoint && (
            <>
              <Circle cx={activePoint.x} cy={activePoint.y} fill={colors.accent} opacity="0.22" r="10" />
              <Circle cx={activePoint.x} cy={activePoint.y} fill={colors.accent} r="4" />
            </>
          )}
        </Svg>
      )}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function formatCurrency(value: number, digits = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.65 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.055)', transform: [{ scale: 0.99 }] },
  glassSurface: {
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  glassSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  action: { alignItems: 'center', gap: 8, width: 72 },
  actionIcon: {
    alignItems: 'center',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  actionLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 12 },
  transaction: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  transactionIcon: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  transactionCopy: { flex: 1, gap: 3, marginLeft: 12 },
  transactionTitle: { color: colors.text, fontFamily: fonts.demi, fontSize: 15 },
  transactionMeta: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11 },
  transactionAmount: { color: colors.text, fontFamily: fonts.demi, fontSize: 14 },
  income: { color: colors.green },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { color: colors.text, fontFamily: fonts.demi, fontSize: 19, letterSpacing: -0.4 },
  sectionAction: { color: colors.accent, fontFamily: fonts.medium, fontSize: 13 },
});
