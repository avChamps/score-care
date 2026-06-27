import Capacitor
import UIKit
import WebKit

@objc(UpiNavigationPlugin)
class UpiNavigationPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "UpiNavigationPlugin"
    let jsName = "UpiNavigation"
    let pluginMethods: [CAPPluginMethod] = []

    override func shouldOverrideLoad(_ navigationAction: WKNavigationAction) -> NSNumber? {
        guard let url = navigationAction.request.url, isUpiAppUrl(url) else {
            return nil
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }

        return NSNumber(value: true)
    }

    private func isUpiAppUrl(_ url: URL) -> Bool {
        guard let scheme = url.scheme?.lowercased() else {
            return false
        }

        return ["upi", "tez", "gpay", "phonepe", "paytm", "paytmmp", "bhim", "cred", "credpay", "amazonpay", "mobikwik"].contains(scheme)
    }
}
