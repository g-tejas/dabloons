import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type StyleProp,
  type TextStyle,
} from 'react-native';

type AnimatedNumberProps = {
  value: number;
  formatter?: (value: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
};

export function AnimatedNumber({
  value,
  formatter = (number) => Math.round(number).toLocaleString('en-US'),
  style,
  duration = 550,
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value: nextValue }) => {
      setDisplayValue(nextValue);
    });

    Animated.timing(animatedValue, {
      duration,
      easing: Easing.out(Easing.cubic),
      toValue: value,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.stopAnimation();
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue, duration, value]);

  return (
    <Animated.Text style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {formatter(displayValue)}
    </Animated.Text>
  );
}
