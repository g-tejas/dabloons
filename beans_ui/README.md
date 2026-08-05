# Dabloons for iOS

The native Expo SDK 54 client for Dabloons. It uses local mock finance data
while the backend contract is still evolving.

## Run on a physical iPhone

```bash
npm install
npx expo start --tunnel
```

Scan the QR code with the iOS App Store version of Expo Go. SDK 54 is retained
for physical-device compatibility.

## Native UI architecture

- Expo Router native stacks and native tabs
- iOS large-title navigation and automatic content insets
- SF Symbols through `expo-symbols`
- semantic light and dark themes
- grouped inset lists with system separators
- native iOS Liquid Glass tab behavior on supported devices
