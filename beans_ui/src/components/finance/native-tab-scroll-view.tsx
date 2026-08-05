import { ScrollView, type ScrollViewProps } from 'react-native';

/**
 * Uses UIKit's navigation-header adjustment. The app tab bar is an absolute
 * overlay, so this scroll view retains its full-screen frame beneath the glass.
 */
export function NativeTabScrollView(props: ScrollViewProps) {
  return (
    <ScrollView
      {...props}
      automaticallyAdjustContentInsets
      automaticallyAdjustsScrollIndicatorInsets
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}
