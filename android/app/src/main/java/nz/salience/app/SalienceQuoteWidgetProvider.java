package nz.salience.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class SalienceQuoteWidgetProvider extends AppWidgetProvider {
    static final String PREFS_NAME = "salience_widget";
    static final String KEY_QUOTE = "quote";
    static final String KEY_AUTHOR = "author";
    static final String KEY_STATUS = "status";
    static final String KEY_UP_TO_DATE = "upToDate";
    static final String KEY_COLOR_PREFIX = "color_";
    static final String DEFAULT_COLOR = "calm";

    static final String[] COLOR_KEYS = { "calm", "midnight", "rose", "forest", "amber" };
    static final String[] COLOR_LABELS = { "Calm", "Midnight", "Rose", "Forest", "Amber" };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId, R.layout.salience_quote_widget);
        }
    }

    static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName widget = new ComponentName(context, SalienceQuoteWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(widget);
        for (int id : ids) {
            updateWidget(context, manager, id, R.layout.salience_quote_widget);
        }
        SalienceQuoteWideWidgetProvider.updateAllWidgets(context);
    }

    static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId, int layoutId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String quote = prefs.getString(KEY_QUOTE, "One entry is enough for today.");
        String author = prefs.getString(KEY_AUTHOR, "Salience");
        String status = prefs.getString(KEY_STATUS, "Open Salience to update today's status.");
        boolean upToDate = prefs.getBoolean(KEY_UP_TO_DATE, false);
        WidgetPalette palette = getPalette(prefs.getString(KEY_COLOR_PREFIX + appWidgetId, DEFAULT_COLOR));

        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);
        views.setInt(R.id.widget_root, "setBackgroundColor", palette.background);
        views.setTextViewText(R.id.widget_quote, quote);
        views.setTextViewText(R.id.widget_author, "- " + author);
        views.setTextViewText(R.id.widget_status, status);
        views.setTextColor(R.id.widget_title, palette.accent);
        views.setTextColor(R.id.widget_quote, palette.text);
        views.setTextColor(R.id.widget_author, palette.accent);
        views.setTextColor(R.id.widget_status, palette.statusText);
        views.setInt(R.id.widget_settings, "setColorFilter", palette.accent);
        views.setInt(
            R.id.widget_status,
            "setBackgroundResource",
            upToDate ? R.drawable.widget_status_ok : R.drawable.widget_status_reminder
        );

        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        Intent settingsIntent = new Intent(context, SalienceWidgetConfigureActivity.class);
        settingsIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_CONFIGURE);
        settingsIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        PendingIntent settingsPendingIntent = PendingIntent.getActivity(
            context,
            appWidgetId,
            settingsIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_settings, settingsPendingIntent);

        manager.updateAppWidget(appWidgetId, views);
    }

    static void saveWidgetColor(Context context, int appWidgetId, String colorKey) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_COLOR_PREFIX + appWidgetId, colorKey)
            .apply();
    }

    static WidgetPalette getPalette(String colorKey) {
        if ("midnight".equals(colorKey)) {
            return new WidgetPalette(0xff0f172a, 0xfff8fafc, 0xffbfdbfe, 0xff1f2937);
        }
        if ("rose".equals(colorKey)) {
            return new WidgetPalette(0xfffff1f2, 0xff1f2937, 0xffbe123c, 0xff1f2937);
        }
        if ("forest".equals(colorKey)) {
            return new WidgetPalette(0xffecfdf5, 0xff10231c, 0xff047857, 0xff1f2937);
        }
        if ("amber".equals(colorKey)) {
            return new WidgetPalette(0xfffffbeb, 0xff1f2937, 0xff92400e, 0xff1f2937);
        }

        return new WidgetPalette(0xfff8faf9, 0xff111827, 0xff0f766e, 0xff1f2937);
    }

    static class WidgetPalette {
        final int background;
        final int text;
        final int accent;
        final int statusText;

        WidgetPalette(int background, int text, int accent, int statusText) {
            this.background = background;
            this.text = text;
            this.accent = accent;
            this.statusText = statusText;
        }
    }
}
