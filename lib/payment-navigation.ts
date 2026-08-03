import { Capacitor } from "@capacitor/core";

type RouteReplacer = {
  replace: (path: string) => void;
};

export function replaceAfterPaymentSuccess(path: string, router?: RouteReplacer) {
  if (router) {
    router.replace(path);
    return;
  }

  if (Capacitor.isNativePlatform()) {
    window.location.replace(path);
    return;
  }
}
