import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

type TrendChartProps = {
  values: number[];
  color: string;
  accessibilityLabel: string;
};

const CHART_HEIGHT = 148;
const INSET = 7;

export function TrendChart({ values, color, accessibilityLabel }: TrendChartProps) {
  const [width, setWidth] = useState(0);
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

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      entering={FadeIn.duration(350)}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.container}>
      {width > 0 && (
        <Svg height={CHART_HEIGHT} width={width}>
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
          {lastPoint && (
            <>
              <Circle cx={lastPoint.x} cy={lastPoint.y} fill={color} opacity={0.16} r={7} />
              <Circle cx={lastPoint.x} cy={lastPoint.y} fill={color} r={3.5} />
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
    height: CHART_HEIGHT,
    overflow: 'hidden',
    width: '100%',
  },
});
