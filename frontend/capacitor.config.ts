import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creatorx.app',
  appName: 'CreatorX',
  webDir: 'dist',
  bundledWebRuntime: false,

  server: {
    allowNavigation: [
      'https://minimalthreads.in',
      'https://api.minimalthreads.in'
    ]
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    scheme: 'CreatorX'
  },

  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false // Disabled for production
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#6366f1',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
