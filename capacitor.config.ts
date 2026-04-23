import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumina.local',
  appName: 'LUMINA',
  webDir: 'dist',
  backgroundColor: '#fcfcfc',
  server: {
    hostname: 'localhost',
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#fcfcfc',
    resolveServiceWorkerRequests: false
  },
  plugins: {
    Keyboard: {
      resizeOnFullScreen: true
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DEFAULT',
      backgroundColor: '#FCFCFC'
    },
    SystemBars: {
      insetsHandling: 'css',
      style: 'DEFAULT'
    }
  }
};

export default config;
