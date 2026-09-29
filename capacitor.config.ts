import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pujosahayak.app',
  appName: 'Pujo Sahayak',
  webDir: 'dist',
  backgroundColor: '#160E0A',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
