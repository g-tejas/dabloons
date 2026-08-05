# dabloons
keep track of how many dabloons you have left

## Mobile app

The `beans_ui/` directory is the canonical Expo SDK 54 iOS finance tracker.
It uses Expo Router's native stacks and tabs so iOS provides the real system
navigation, scroll-edge treatment, and Liquid Glass behavior. The current data
is local mock data and is not connected to the backend.

```bash
cd beans_ui
npm install
npx expo start --tunnel
```

Open the project in Expo Go, or run `npm run ios` on macOS with the iOS
Simulator installed.
