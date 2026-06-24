import { Capacitor, registerPlugin } from "@capacitor/core";
import { apiUrl } from "@/lib/api";

type NativeReportDownloadPlugin = {
  enqueue(options: { url: string; authorization: string; fileName: string }): Promise<{ downloadId: number }>;
};

const NativeReportDownload = registerPlugin<NativeReportDownloadPlugin>("NativeReportDownload");

export function canUseNativeReportDownload() {
  return ["android", "ios"].includes(Capacitor.getPlatform());
}

export function enqueueNativeReportDownload(path: string, token: string, fileName: string) {
  return NativeReportDownload.enqueue({
    url: apiUrl(path),
    authorization: `Bearer ${token}`,
    fileName,
  });
}
