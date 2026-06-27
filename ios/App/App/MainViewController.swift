import Capacitor

class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(NativeReportDownloadPlugin())
        bridge?.registerPluginInstance(UpiNavigationPlugin())
    }
}
