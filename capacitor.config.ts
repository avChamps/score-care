import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.scorecare.app",
  appName: "ScoreCare",
  webDir: "out",
  server: {
    appStartPath: "/login.html",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
