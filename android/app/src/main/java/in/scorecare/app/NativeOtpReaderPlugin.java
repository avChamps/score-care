package in.scorecare.app;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.auth.api.phone.SmsRetrieverClient;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Status;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "NativeOtpReader")
public class NativeOtpReaderPlugin extends Plugin {
    private static final Pattern OTP_PATTERN = Pattern.compile("(?<!\\d)\\d{6}(?!\\d)");
    private BroadcastReceiver receiver;
    private PluginCall savedCall;

    @PluginMethod
    public void startSmsUserConsent(PluginCall call) {
        stopReceiver();
        savedCall = call;

        SmsRetrieverClient client = SmsRetriever.getClient(getActivity());
        client.startSmsUserConsent(null)
            .addOnSuccessListener(unused -> registerReceiver())
            .addOnFailureListener(error -> {
                savedCall = null;
                call.reject("Unable to start OTP autofill.");
            });
    }

    @PluginMethod
    public void stopSmsUserConsent(PluginCall call) {
        stopReceiver();
        if (savedCall != null) {
            savedCall.reject("OTP autofill cancelled.");
            savedCall = null;
        }
        call.resolve();
    }

    @ActivityCallback
    private void handleSmsConsentResult(PluginCall call, ActivityResult result) {
        stopReceiver();

        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            savedCall = null;
            call.reject("OTP autofill dismissed.");
            return;
        }

        String message = result.getData().getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE);
        String otp = extractOtp(message);

        savedCall = null;

        if (otp == null) {
            call.reject("OTP not found in message.");
            return;
        }

        JSObject response = new JSObject();
        response.put("otp", otp);
        call.resolve(response);
    }

    @Override
    protected void handleOnDestroy() {
        stopReceiver();
        savedCall = null;
    }

    private void registerReceiver() {
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!SmsRetriever.SMS_RETRIEVED_ACTION.equals(intent.getAction()) || savedCall == null) {
                    return;
                }

                Status status = (Status) intent.getExtras().get(SmsRetriever.EXTRA_STATUS);

                if (status == null) {
                    savedCall.reject("OTP autofill failed.");
                    savedCall = null;
                    stopReceiver();
                    return;
                }

                if (status.getStatusCode() == CommonStatusCodes.SUCCESS) {
                    Intent consentIntent = intent.getParcelableExtra(SmsRetriever.EXTRA_CONSENT_INTENT);

                    if (consentIntent == null) {
                        savedCall.reject("OTP consent unavailable.");
                        savedCall = null;
                        stopReceiver();
                        return;
                    }

                    startActivityForResult(savedCall, consentIntent, "handleSmsConsentResult");
                    return;
                }

                if (status.getStatusCode() == CommonStatusCodes.TIMEOUT) {
                    savedCall.reject("OTP autofill timed out.");
                    savedCall = null;
                    stopReceiver();
                }
            }
        };

        IntentFilter filter = new IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(receiver, filter, SmsRetriever.SEND_PERMISSION, null, Context.RECEIVER_EXPORTED);
        } else {
            getContext().registerReceiver(receiver, filter, SmsRetriever.SEND_PERMISSION, null);
        }
    }

    private void stopReceiver() {
        if (receiver == null) {
            return;
        }

        try {
            getContext().unregisterReceiver(receiver);
        } catch (IllegalArgumentException ignored) {
        } finally {
            receiver = null;
        }
    }

    private String extractOtp(String message) {
        if (message == null) {
            return null;
        }

        Matcher matcher = OTP_PATTERN.matcher(message);
        return matcher.find() ? matcher.group() : null;
    }
}
