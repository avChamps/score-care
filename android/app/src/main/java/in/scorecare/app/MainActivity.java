package in.scorecare.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.razorpay.PaymentData;
import com.razorpay.PaymentResultWithDataListener;

public class MainActivity extends BridgeActivity implements PaymentResultWithDataListener {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeReportDownloadPlugin.class);
        registerPlugin(NativeOtpReaderPlugin.class);
        registerPlugin(NativeRazorpayPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onPaymentSuccess(String razorpayPaymentId, PaymentData paymentData) {
        NativeRazorpayPlugin.resolvePayment(razorpayPaymentId, paymentData);
    }

    @Override
    public void onPaymentError(int code, String description, PaymentData paymentData) {
        NativeRazorpayPlugin.rejectPayment(code, description, paymentData);
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView() != null && getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
            return;
        }

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new Event('scorecare:native-back-root'))",
                null
            );
            return;
        }

        super.onBackPressed();
    }
}
