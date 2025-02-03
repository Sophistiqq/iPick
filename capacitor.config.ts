import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ipick.app',
  appName: 'iPick',
  webDir: 'dist',
  android: {
    buildOptions: {
      releaseType: 'APK',
      keystorePath: 'ipick.jks',
      keystorePassword: 'ipickpass',
      keystoreAlias: 'ipick',
      keystoreAliasPassword: 'ipickpass',
    }
  }
};

export default config;
