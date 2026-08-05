import { useHeaderHeight } from '@react-navigation/elements';
import { Platform, ScrollView, type ScrollViewProps } from 'react-native';

/**
 * Keeps native-stack content below the navigation header while allowing the
 * scroll view itself to extend behind the iOS tab bar. UIKit's automatic inset
 * behavior adjusts both edges together, so the top inset is applied manually.
 */
export function NativeTabScrollView(props: ScrollViewProps) {
  const headerHeight = useHeaderHeight();
  const usesManualInsets = Platform.OS === 'ios';

  return (
    <ScrollView
      {...props}
      automaticallyAdjustContentInsets={!usesManualInsets}
      automaticallyAdjustsScrollIndicatorInsets={!usesManualInsets}
      contentInset={usesManualInsets ? { top: headerHeight } : undefined}
      contentInsetAdjustmentBehavior={usesManualInsets ? 'never' : 'automatic'}
      contentOffset={usesManualInsets ? { x: 0, y: -headerHeight } : undefined}
      scrollIndicatorInsets={usesManualInsets ? { top: headerHeight } : undefined}
    />
  );
}
