package in.scorecare.app;

import android.os.Build;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeAppLock")
public class NativeAppLockPlugin extends Plugin {
    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", canAuthenticate());
        call.resolve(result);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        if (!(getActivity() instanceof FragmentActivity)) {
            call.reject("Biometric authentication is unavailable.");
            return;
        }

        if (!canAuthenticate()) {
            call.reject("Biometric authentication is not configured on this device.");
            return;
        }

        FragmentActivity activity = (FragmentActivity) getActivity();

        activity.runOnUiThread(() -> {
            BiometricPrompt prompt = new BiometricPrompt(
                activity,
                ContextCompat.getMainExecutor(activity),
                new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        call.reject(errString.toString());
                    }

                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        JSObject response = new JSObject();
                        response.put("authenticated", true);
                        call.resolve(response);
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        notifyListeners("appLockAuthenticationFailed", new JSObject());
                    }
                }
            );

            prompt.authenticate(createPromptInfo());
        });
    }

    private boolean canAuthenticate() {
        BiometricManager biometricManager = BiometricManager.from(getContext());

        return biometricManager.canAuthenticate(getAllowedAuthenticators()) == BiometricManager.BIOMETRIC_SUCCESS;
    }

    private BiometricPrompt.PromptInfo createPromptInfo() {
        BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock ScoreCare")
            .setSubtitle("Use your fingerprint, face unlock, or device screen lock")
            .setAllowedAuthenticators(getAllowedAuthenticators());

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            builder.setNegativeButtonText("Use PIN");
        }

        return builder.build();
    }

    private int getAllowedAuthenticators() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
        }

        return BiometricManager.Authenticators.BIOMETRIC_STRONG;
    }
}
