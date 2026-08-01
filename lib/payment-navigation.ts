import { Capacitor } from "@capacitor/core";

type RouteReplacer = {
  replace: (path: string) => void;
};

export function replaceAfterPaymentSuccess(path: string, router?: RouteReplacer) {
  if (Capacitor.isNativePlatform()) {
    window.location.replace(path);
    return;
  }

  router?.replace(path);
}
