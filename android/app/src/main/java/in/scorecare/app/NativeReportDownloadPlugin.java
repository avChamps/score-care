package in.scorecare.app;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeReportDownload")
public class NativeReportDownloadPlugin extends Plugin {
    @PluginMethod
    public void enqueue(PluginCall call) {
        String url = call.getString("url");
        String authorization = call.getString("authorization");
        String fileName = sanitizeFileName(call.getString("fileName", "scorecare-cibil-report.pdf"));

        if (url == null || url.trim().isEmpty()) {
            call.reject("Download URL is required.");
            return;
        }

        DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);

        if (downloadManager == null) {
            call.reject("Download manager is unavailable.");
            return;
        }

        try {
            DownloadManager.Request request = createRequest(url, authorization, fileName);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            resolveDownload(call, downloadManager.enqueue(request));
        } catch (RuntimeException publicDownloadError) {
            try {
                DownloadManager.Request fallbackRequest = createRequest(url, authorization, fileName);
                fallbackRequest.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, fileName);
                resolveDownload(call, downloadManager.enqueue(fallbackRequest));
            } catch (RuntimeException fallbackDownloadError) {
                call.reject("Unable to start report download.");
            }
        }
    }

    private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[\\\\/:*?\"<>|]", "-");
    }

    private DownloadManager.Request createRequest(String url, String authorization, String fileName) {
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle(fileName);
        request.setDescription("Downloading CIBIL report");
        request.setMimeType("application/pdf");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(true);

        if (authorization != null && !authorization.trim().isEmpty()) {
            request.addRequestHeader("Authorization", authorization);
        }

        return request;
    }

    private void resolveDownload(PluginCall call, long downloadId) {
        JSObject result = new JSObject();
        result.put("downloadId", downloadId);
        call.resolve(result);
    }
}
