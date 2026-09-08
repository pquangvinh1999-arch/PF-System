import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';
import { registerServiceWorker } from './src/pwa/registerServiceWorker';

// Đăng ký Service Worker và cơ chế PWA khi chạy trên Web
if (Platform.OS === 'web') {
  registerServiceWorker();
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

