/// <reference types="@capacitor/push-notifications" />
/// <reference types="@capacitor/app" />
/// <reference types="@capacitor/network" />
/// <reference types="@capacitor-firebase/analytics" />
/// <reference types="@capacitor-firebase/crashlytics" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.scorecare.app",
  appName: "ScoreCare",
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
