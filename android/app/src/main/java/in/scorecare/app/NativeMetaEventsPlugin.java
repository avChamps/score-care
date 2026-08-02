package in.scorecare.app;

import android.os.Bundle;
import com.facebook.appevents.AppEventsLogger;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.math.BigDecimal;
import java.util.Currency;
import java.util.Iterator;

@CapacitorPlugin(name = "NativeMetaEvents")
public class NativeMetaEventsPlugin extends Plugin {
    private AppEventsLogger logger;

    @Override
    public void load() {
        logger = AppEventsLogger.newLogger(getContext());
    }

    @PluginMethod
    public void logEvent(PluginCall call) {
        String eventName = call.getString("name");

        if (eventName == null || eventName.trim().isEmpty()) {
            call.reject("Meta event name is required.");
            return;
        }

        JSObject params = call.getObject("params");
        if (params == null) {
            params = new JSObject();
        }
        Bundle bundle = createBundle(params);
        Double value = getDouble(call.getData().opt("value"));

        try {
            if ("fb_mobile_purchase".equals(eventName) && value != null) {
                String currencyCode = params.optString("fb_currency", "INR");
                logger.logPurchase(BigDecimal.valueOf(value), Currency.getInstance(currencyCode), bundle);
            } else if (value != null) {
                logger.logEvent(eventName, value, bundle);
            } else {
                logger.logEvent(eventName, bundle);
            }

            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to log Meta event.");
        }
    }

    @PluginMethod
    public void flush(PluginCall call) {
        if (logger != null) {
            logger.flush();
        }

        call.resolve();
    }

    private Bundle createBundle(JSObject params) {
        Bundle bundle = new Bundle();
        Iterator<String> keys = params.keys();

        while (keys.hasNext()) {
            String key = keys.next();
            Object value = params.opt(key);

            if (value instanceof String) {
                bundle.putString(key, (String) value);
            } else if (value instanceof Integer) {
                bundle.putInt(key, (Integer) value);
            } else if (value instanceof Long) {
                bundle.putLong(key, (Long) value);
            } else if (value instanceof Float) {
                bundle.putFloat(key, (Float) value);
            } else if (value instanceof Double) {
                bundle.putDouble(key, (Double) value);
            } else if (value instanceof Boolean) {
                bundle.putInt(key, (Boolean) value ? 1 : 0);
            }
        }

        return bundle;
    }

    private Double getDouble(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }

        return null;
    }
}
