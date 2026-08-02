import Capacitor
import FacebookCore

@objc(NativeMetaEventsPlugin)
class NativeMetaEventsPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "NativeMetaEventsPlugin"
    let jsName = "NativeMetaEvents"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "logEvent", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "flush", returnType: CAPPluginReturnPromise)
    ]

    @objc func logEvent(_ call: CAPPluginCall) {
        guard let eventName = call.getString("name"), !eventName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            call.reject("Meta event name is required.")
            return
        }

        let params = call.getObject("params") ?? [:]
        let parameters = createParameters(params)
        let value = call.getDouble("value")

        if eventName == "fb_mobile_purchase", let value {
            AppEvents.shared.logPurchase(
                purchaseAmount: Decimal(value),
                currency: params["fb_currency"] as? String ?? "INR",
                parameters: parameters
            )
        } else if let value {
            AppEvents.shared.logEvent(AppEvents.Name(eventName), valueToSum: value, parameters: parameters)
        } else {
            AppEvents.shared.logEvent(AppEvents.Name(eventName), parameters: parameters)
        }

        call.resolve()
    }

    @objc func flush(_ call: CAPPluginCall) {
        AppEvents.shared.flush()
        call.resolve()
    }

    private func createParameters(_ params: JSObject) -> [AppEvents.ParameterName: Any] {
        var parameters: [AppEvents.ParameterName: Any] = [:]

        params.forEach { key, value in
            if let stringValue = value as? String {
                parameters[AppEvents.ParameterName(key)] = stringValue
            } else if let boolValue = value as? Bool {
                parameters[AppEvents.ParameterName(key)] = boolValue ? 1 : 0
            } else if let numberValue = value as? NSNumber {
                parameters[AppEvents.ParameterName(key)] = numberValue
            }
        }

        return parameters
    }
}
