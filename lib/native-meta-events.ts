import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeMetaEventsPlugin = {
  logEvent(options: { name: string; params?: Record<string, string | number | boolean>; value?: number }): Promise<void>;
  flush(): Promise<void>;
};

export const nativeMetaEvents = registerPlugin<NativeMetaEventsPlugin>("NativeMetaEvents");

export function canUseNativeMetaEvents() {
  return ["android", "ios"].includes(Capacitor.getPlatform());
}
