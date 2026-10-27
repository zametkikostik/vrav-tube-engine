import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vrav.tubeengine',
  appName: 'VRAV Tube Engine',
  webDir: 'dist',
  server: {},
  android: {
    allowMixedContent: true,
  },
}

export default config
