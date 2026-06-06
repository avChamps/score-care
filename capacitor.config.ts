import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.scorecare.app",
  appName: "ScoreCare",
  webDir: "out",
  server: {
    appStartPath: "/login.html",
  },
};

export default config;
