package in.scorecare.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.razorpay.Checkout;
import com.razorpay.PaymentData;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativeRazorpay")
public class NativeRazorpayPlugin extends Plugin {
    private static NativeRazorpayPlugin activePlugin;
    private Checkout checkout;
    private PluginCall paymentCall;

    @PluginMethod
    public void open(PluginCall call) {
        String key = call.getString("key");

        if (key == null || key.trim().isEmpty()) {
            call.reject("Razorpay key is required.");
            return;
        }

        if (paymentCall != null) {
            call.reject("Another payment is already in progress.");
            return;
        }

        try {
            checkout = new Checkout();
            checkout.setKeyID(key);
            activePlugin = this;
            paymentCall = call;
            checkout.open(getActivity(), createOptions(call));
        } catch (Exception error) {
            activePlugin = null;
            checkout = null;
            paymentCall = null;
            call.reject("Unable to open payment gateway.");
        }
    }

    static void resolvePayment(String paymentId, PaymentData data) {
        if (activePlugin == null || activePlugin.paymentCall == null) {
            return;
        }

        JSObject result = new JSObject();
        result.put("razorpay_payment_id", paymentId);
        result.put("razorpay_order_id", data != null ? data.getOrderId() : null);
        result.put("razorpay_signature", data != null ? data.getSignature() : null);

        activePlugin.paymentCall.resolve(result);
        activePlugin.paymentCall = null;
        activePlugin.checkout = null;
        activePlugin = null;
    }

    static void rejectPayment(int code, String description, PaymentData data) {
        if (activePlugin == null || activePlugin.paymentCall == null) {
            return;
        }

        activePlugin.paymentCall.reject(description != null ? description : "Payment failed.");
        activePlugin.paymentCall = null;
        activePlugin.checkout = null;
        activePlugin = null;
    }

    private JSONObject createOptions(PluginCall call) throws Exception {
        JSONObject options = new JSONObject();
        put(options, "key", call.getString("key"));
        put(options, "order_id", call.getString("orderId"));
        put(options, "customer_id", call.getString("customerId"));
        put(options, "recurring", call.getString("recurring"));
        put(options, "name", call.getString("name"));
        put(options, "description", call.getString("description"));
        put(options, "currency", call.getString("currency"));
        put(options, "amount", call.getData().opt("amount"));

        JSObject prefill = call.getObject("prefill");
        if (prefill != null) {
            options.put("prefill", new JSONObject(prefill.toString()));
        }

        JSObject config = call.getObject("config");
        if (config != null) {
            options.put("config", new JSONObject(config.toString()));
        }

        JSONObject method = new JSONObject();
        method.put("card", true);
        method.put("netbanking", true);
        method.put("upi", true);
        method.put("wallet", true);
        options.put("method", method);

        return options;
    }

    private void put(JSONObject object, String key, Object value) throws Exception {
        if (value != null) {
            object.put(key, value);
        }
    }
}
