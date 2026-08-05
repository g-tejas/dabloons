import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, View, type ScrollViewProps } from 'react-native';

/**
 * Keeps native-stack content below the navigation header while allowing the
 * scroll view itself to extend behind the iOS tab bar. UIKit's automatic inset
 * behavior adjusts both edges together, so the top inset is applied manually.
 */
export function NativeTabScrollView(props: ScrollViewProps) {
  const headerHeight = useHeaderHeight();
  const usesManualInsets = Platform.OS === 'ios';
  const [nativeTabReady, setNativeTabReady] = useState(!usesManualInsets);

  useEffect(() => {
    if (!usesManualInsets) return;

    // react-native-screens 4.16 (bundled with Expo Go SDK 54) can apply its
    // default automatic inset before the tab's opt-out prop reaches native.
    // Mounting the ScrollView on the next frame lets the tab screen commit its
    // options first, so this explicit `never` value is not overwritten.
    const frame = requestAnimationFrame(() => setNativeTabReady(true));
    return () => cancelAnimationFrame(frame);
  }, [usesManualInsets]);

  if (!nativeTabReady) {
    return <View style={[{ flex: 1 }, props.style]} />;
  }

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
