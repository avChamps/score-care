import Capacitor
import LocalAuthentication

@objc(NativeAppLockPlugin)
class NativeAppLockPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "NativeAppLockPlugin"
    let jsName = "NativeAppLock"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise)
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)

        call.resolve(["available": available])
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        let context = LAContext()
        context.localizedFallbackTitle = "Use Passcode"

        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            call.reject(error?.localizedDescription ?? "Biometric authentication is not configured on this device.")
            return
        }

        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock ScoreCare") { success, authError in
            DispatchQueue.main.async {
                if success {
                    call.resolve(["authenticated": true])
                } else {
                    call.reject(authError?.localizedDescription ?? "Authentication failed.")
                }
            }
        }
    }
}
