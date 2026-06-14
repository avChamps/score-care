import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.scorecare.app",
  appName: "ScoreCare",
  webDir: "out",
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
