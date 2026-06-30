import Capacitor
import Razorpay
import UIKit

@objc(NativeRazorpayPlugin)
class NativeRazorpayPlugin: CAPPlugin, CAPBridgedPlugin, RazorpayPaymentCompletionProtocolWithData {
    let identifier = "NativeRazorpayPlugin"
    let jsName = "NativeRazorpay"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)
    ]

    private var paymentCall: CAPPluginCall?
    private var razorpay: RazorpayCheckout?

    @objc func open(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            call.reject("Razorpay key is required.")
            return
        }

        guard let viewController = bridge?.viewController else {
            call.reject("Unable to open payment gateway.")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.paymentCall?.reject("Another payment is already in progress.")
            self.clearPaymentState()

            self.paymentCall = call
            self.razorpay = RazorpayCheckout.initWithKey(key, andDelegateWithData: self)
            self.razorpay?.open(self.createOptions(call), displayController: self.topViewController(from: viewController))
        }
    }

    func onPaymentSuccess(_ paymentId: String, andData response: [AnyHashable: Any]?) {
        guard let call = paymentCall else {
            return
        }

        var result = JSObject()
        result["razorpay_payment_id"] = paymentId
        result["razorpay_order_id"] = response?["razorpay_order_id"] as? String
        result["razorpay_signature"] = response?["razorpay_signature"] as? String
        result["razorpay_subscription_id"] = response?["razorpay_subscription_id"] as? String

        call.resolve(result)
        clearPaymentState()
    }

    func onPaymentError(_ code: Int32, description message: String, andData response: [AnyHashable: Any]?) {
        paymentCall?.reject(message.isEmpty ? "Payment failed." : message)
        clearPaymentState()
    }

    private func createOptions(_ call: CAPPluginCall) -> [String: Any] {
        var options: [String: Any] = [:]

        put(&options, "key", call.getString("key"))
        put(&options, "order_id", call.getString("orderId"))
        put(&options, "customer_id", call.getString("customerId"))
        put(&options, "recurring", call.getString("recurring"))
        put(&options, "name", call.getString("name"))
        put(&options, "description", call.getString("description"))
        put(&options, "currency", call.getString("currency"))

        if let amount = call.getInt("amount") {
            options["amount"] = amount
        }

        if let prefill = call.getObject("prefill") {
            options["prefill"] = prefill
        }

        options["method"] = [
            "card": true,
            "netbanking": true,
            "upi": true,
            "wallet": true,
        ]

        return options
    }

    private func put(_ options: inout [String: Any], _ key: String, _ value: String?) {
        if let value, !value.isEmpty {
            options[key] = value
        }
    }

    private func topViewController(from viewController: UIViewController) -> UIViewController {
        if let presented = viewController.presentedViewController {
            return topViewController(from: presented)
        }

        if let navigationController = viewController as? UINavigationController,
           let visibleViewController = navigationController.visibleViewController {
            return topViewController(from: visibleViewController)
        }

        if let tabBarController = viewController as? UITabBarController,
           let selectedViewController = tabBarController.selectedViewController {
            return topViewController(from: selectedViewController)
        }

        return viewController
    }

    private func clearPaymentState() {
        paymentCall = nil
        razorpay = nil
    }
}
