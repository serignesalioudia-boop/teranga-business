import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sn.terangabusiness.app',
  appName: 'Teranga Business',
  webDir: 'public',
  server: {
    url: 'https://teranga-business-olive.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'never',
  },
};

export default config;
