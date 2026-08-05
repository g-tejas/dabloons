import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  SymbolView,
  type SFSymbol,
  type SymbolViewProps,
  type SymbolWeight,
} from 'expo-symbols';
import { Platform, type ColorValue } from 'react-native';

import type { FinanceIconName } from '@/constants/finance-data';

type SystemIconProps = {
  name: SFSymbol;
  fallback: FinanceIconName;
  color: ColorValue;
  size?: number;
  weight?: SymbolWeight;
  animationSpec?: SymbolViewProps['animationSpec'];
};

export function SystemIcon({
  name,
  fallback,
  color,
  size = 20,
  weight = 'regular',
  animationSpec,
}: SystemIconProps) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        animationSpec={animationSpec}
        name={name}
        resizeMode="scaleAspectFit"
        size={size}
        tintColor={color}
        weight={weight}
      />
    );
  }

  return <MaterialIcons color={color} name={fallback} size={size} />;
}
