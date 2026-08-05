import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

type TrendChartProps = {
  values: number[];
  color: string;
  accessibilityLabel: string;
  labels: string[];
  formatValue?: (value: number) => string;
};

const CHART_HEIGHT = 148;
const TOOLTIP_HEIGHT = 34;
const TOOLTIP_WIDTH = 116;
const INSET = 7;

export function TrendChart({
  values,
  color,
  accessibilityLabel,
  labels,
  formatValue = (value) => Math.round(value).toLocaleString('en-US'),
}: TrendChartProps) {
  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedIndexRef = useRef<number | null>(null);
  const drawableWidth = Math.max(0, width - INSET * 2);
  const drawableHeight = CHART_HEIGHT - INSET * 2;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(1, maximum - minimum);
  const points = values.map((value, index) => ({
    x: INSET + (index / Math.max(1, values.length - 1)) * drawableWidth,
    y: INSET + (1 - (value - minimum) / range) * drawableHeight,
  }));
  const linePath = smoothPath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points.at(-1)?.x ?? 0} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`
      : '';
  const lastPoint = points.at(-1);
  const selectedPoint = selectedIndex === null ? null : points[selectedIndex];

  useEffect(() => {
    selectedIndexRef.current = null;
    setSelectedIndex(null);
  }, [values]);

  function selectAt(x: number) {
    if (width === 0 || values.length === 0) return;
    const relativeX = Math.max(0, Math.min(drawableWidth, x - INSET));
    const nextIndex = Math.round((relativeX / Math.max(1, drawableWidth)) * (values.length - 1));
    if (selectedIndexRef.current !== nextIndex) {
      selectedIndexRef.current = nextIndex;
      setSelectedIndex(nextIndex);
      void Haptics.selectionAsync();
    }
  }

  function moveSelection(direction: -1 | 1) {
    const current = selectedIndexRef.current ?? values.length - 1;
    const next = Math.max(0, Math.min(values.length - 1, current + direction));
    selectedIndexRef.current = next;
    setSelectedIndex(next);
    void Haptics.selectionAsync();
  }

  return (
    <Animated.View
      accessibilityActions={[
        { name: 'increment', label: 'Next month' },
        { name: 'decrement', label: 'Previous month' },
      ]}
      accessibilityLabel={
        selectedIndex === null
          ? accessibilityLabel
          : `${labels[selectedIndex]}, ${formatValue(values[selectedIndex])}`
      }
      accessibilityRole="adjustable"
      entering={FadeIn.duration(350)}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') moveSelection(1);
        if (event.nativeEvent.actionName === 'decrement') moveSelection(-1);
      }}
      onMoveShouldSetResponder={(event) => Math.abs(event.nativeEvent.locationX) > 0}
      onResponderGrant={(event) => selectAt(event.nativeEvent.locationX)}
      onResponderMove={(event) => selectAt(event.nativeEvent.locationX)}
      onStartShouldSetResponder={() => true}
      style={styles.container}>
      {selectedIndex !== null && selectedPoint && (
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: color,
              left: Math.max(0, Math.min(width - TOOLTIP_WIDTH, selectedPoint.x - TOOLTIP_WIDTH / 2)),
              pointerEvents: 'none',
            },
          ]}>
          <Text numberOfLines={1} style={styles.tooltipText}>
            {labels[selectedIndex]} · {formatValue(values[selectedIndex])}
          </Text>
        </View>
      )}
      {width > 0 && (
        <Svg height={CHART_HEIGHT} style={styles.svg} width={width}>
          <Defs>
            <LinearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.24" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill="url(#chartFill)" />
          <Path
            d={linePath}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
          />
          {selectedPoint && (
            <Line
              stroke={color}
              strokeDasharray="3 4"
              strokeOpacity={0.42}
              strokeWidth={1}
              x1={selectedPoint.x}
              x2={selectedPoint.x}
              y1={INSET}
              y2={CHART_HEIGHT}
            />
          )}
          {(selectedPoint ?? lastPoint) && (
            <>
              <Circle
                cx={(selectedPoint ?? lastPoint)?.x}
                cy={(selectedPoint ?? lastPoint)?.y}
                fill={color}
                opacity={0.16}
                r={selectedPoint ? 9 : 7}
              />
              <Circle
                cx={(selectedPoint ?? lastPoint)?.x}
                cy={(selectedPoint ?? lastPoint)?.y}
                fill={color}
                r={selectedPoint ? 4.5 : 3.5}
              />
            </>
          )}
        </Svg>
      )}
    </Animated.View>
  );
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const midpointX = (previous.x + point.x) / 2;
    const midpointY = (previous.y + point.y) / 2;
    return `${path} Q ${previous.x} ${previous.y} ${midpointX} ${midpointY}`;
  }, `M ${points[0].x} ${points[0].y}`) + ` T ${points.at(-1)?.x ?? 0} ${points.at(-1)?.y ?? 0}`;
}

const styles = StyleSheet.create({
  container: {
    height: CHART_HEIGHT + TOOLTIP_HEIGHT,
    overflow: 'hidden',
    width: '100%',
  },
  svg: {
    left: 0,
    position: 'absolute',
    top: TOOLTIP_HEIGHT,
  },
  tooltip: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'absolute',
    top: 0,
    width: TOOLTIP_WIDTH,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
});
