import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yugaplay.app',
  appName: 'YUGA Play',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
