package nz.salience.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SalienceWidget")
public class SalienceWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        String quote = call.getString("quote", "One entry is enough for today.");
        String author = call.getString("author", "Salience");
        String status = call.getString("status", "Open Salience to update today's status.");
        boolean upToDate = Boolean.TRUE.equals(call.getBoolean("upToDate", false));

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(SalienceQuoteWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(SalienceQuoteWidgetProvider.KEY_QUOTE, quote)
            .putString(SalienceQuoteWidgetProvider.KEY_AUTHOR, author)
            .putString(SalienceQuoteWidgetProvider.KEY_STATUS, status)
            .putBoolean(SalienceQuoteWidgetProvider.KEY_UP_TO_DATE, upToDate)
            .apply();

        SalienceQuoteWidgetProvider.updateAllWidgets(context);

        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }
}
