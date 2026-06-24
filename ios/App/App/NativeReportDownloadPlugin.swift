import Capacitor
import UIKit

@objc(NativeReportDownloadPlugin)
class NativeReportDownloadPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "NativeReportDownloadPlugin"
    let jsName = "NativeReportDownload"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "enqueue", returnType: CAPPluginReturnPromise)
    ]

    @objc func enqueue(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("Download URL is required.")
            return
        }

        var request = URLRequest(url: url)

        if let authorization = call.getString("authorization"), !authorization.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            request.setValue(authorization, forHTTPHeaderField: "Authorization")
        }

        URLSession.shared.downloadTask(with: request) { [weak self] temporaryURL, response, error in
            if error != nil {
                call.reject("Unable to download report.")
                return
            }

            guard let temporaryURL else {
                call.reject("Unable to download report.")
                return
            }

            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 200

            guard (200...299).contains(statusCode) else {
                call.reject("Unable to download report.")
                return
            }

            do {
                let fileName = self?.sanitizeFileName(call.getString("fileName") ?? "scorecare-cibil-report.pdf") ?? "scorecare-cibil-report.pdf"
                let destinationURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)

                if FileManager.default.fileExists(atPath: destinationURL.path) {
                    try FileManager.default.removeItem(at: destinationURL)
                }

                try FileManager.default.moveItem(at: temporaryURL, to: destinationURL)

                DispatchQueue.main.async {
                    self?.presentShareSheet(fileURL: destinationURL, call: call)
                }
            } catch {
                call.reject("Unable to save report.")
            }
        }.resume()
    }

    private func presentShareSheet(fileURL: URL, call: CAPPluginCall) {
        guard let viewController = bridge?.viewController else {
            call.reject("Unable to open report.")
            return
        }

        let activityViewController = UIActivityViewController(activityItems: [fileURL], applicationActivities: nil)

        if let popover = activityViewController.popoverPresentationController {
            popover.sourceView = viewController.view
            popover.sourceRect = CGRect(x: viewController.view.bounds.midX, y: viewController.view.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }

        activityViewController.completionWithItemsHandler = { _, _, _, _ in
            call.resolve(["downloadId": 0])
        }

        viewController.present(activityViewController, animated: true)
    }

    private func sanitizeFileName(_ fileName: String) -> String {
        let invalidCharacters = CharacterSet(charactersIn: "\\/:*?\"<>|")
        return fileName.components(separatedBy: invalidCharacters).joined(separator: "-")
    }
}
