import Capacitor

class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(NativeReportDownloadPlugin())
        bridge?.registerPluginInstance(NativeRazorpayPlugin())
        bridge?.registerPluginInstance(UpiNavigationPlugin())
        bridge?.registerPluginInstance(NativeAppLockPlugin())
        bridge?.registerPluginInstance(NativeMetaEventsPlugin())
    }
}
