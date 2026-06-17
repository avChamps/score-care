/// <reference types="@capacitor/push-notifications" />
/// <reference types="@capacitor/app" />
/// <reference types="@capacitor/network" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.scorecare.app",
  appName: "Scorecare",
  webDir: "out",
  server: {
    appStartPath: "/loading.html",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    App: {},
    Network: {},
    PushNotifications: {
      presentationOptions: ["alert", "sound"],
    },
  },
};

export default config;
