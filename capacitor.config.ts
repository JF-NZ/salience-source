/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'nz.salience.app',
  appName: 'Salience',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#0f766e',
    },
  },
}

export default config
