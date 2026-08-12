package nz.salience.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;

public class SalienceQuoteWideWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            SalienceQuoteWidgetProvider.updateWidget(context, appWidgetManager, appWidgetId, R.layout.salience_quote_widget_wide);
        }
    }

    static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName widget = new ComponentName(context, SalienceQuoteWideWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(widget);
        for (int id : ids) {
            SalienceQuoteWidgetProvider.updateWidget(context, manager, id, R.layout.salience_quote_widget_wide);
        }
    }
}
