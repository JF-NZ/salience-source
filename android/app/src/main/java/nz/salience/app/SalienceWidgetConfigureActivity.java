package nz.salience.app;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class SalienceWidgetConfigureActivity extends Activity {
    private int appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setResult(RESULT_CANCELED);

        Intent intent = getIntent();
        Bundle extras = intent.getExtras();
        if (extras != null) {
            appWidgetId = extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        }

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(22), dp(22), dp(22), dp(22));
        root.setBackgroundColor(0xfff8faf9);

        TextView title = new TextView(this);
        title.setText("Widget colour");
        title.setTextColor(0xff0f172a);
        title.setTextSize(24);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        root.addView(title);

        TextView subtitle = new TextView(this);
        subtitle.setText("Choose a calm colour for this Salience widget.");
        subtitle.setTextColor(0xff475569);
        subtitle.setTextSize(15);
        subtitle.setPadding(0, dp(8), 0, dp(16));
        root.addView(subtitle);

        for (int i = 0; i < SalienceQuoteWidgetProvider.COLOR_KEYS.length; i++) {
            String colorKey = SalienceQuoteWidgetProvider.COLOR_KEYS[i];
            String label = SalienceQuoteWidgetProvider.COLOR_LABELS[i];
            Button button = new Button(this);
            button.setText(label);
            button.setAllCaps(false);
            button.setTextSize(16);
            button.setTextColor(SalienceQuoteWidgetProvider.getPalette(colorKey).text);
            button.setBackground(makeSwatchBackground(SalienceQuoteWidgetProvider.getPalette(colorKey)));
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(54)
            );
            params.setMargins(0, 0, 0, dp(10));
            root.addView(button, params);
            button.setOnClickListener((View view) -> saveAndFinish(colorKey));
        }

        setContentView(root);
    }

    private GradientDrawable makeSwatchBackground(SalienceQuoteWidgetProvider.WidgetPalette palette) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(palette.background);
        drawable.setCornerRadius(dp(14));
        drawable.setStroke(dp(1), palette.accent);
        return drawable;
    }

    private void saveAndFinish(String colorKey) {
        SalienceQuoteWidgetProvider.saveWidgetColor(this, appWidgetId, colorKey);

        AppWidgetManager manager = AppWidgetManager.getInstance(this);
        if (isWideWidget(manager)) {
            SalienceQuoteWidgetProvider.updateWidget(this, manager, appWidgetId, R.layout.salience_quote_widget_wide);
        } else {
            SalienceQuoteWidgetProvider.updateWidget(this, manager, appWidgetId, R.layout.salience_quote_widget);
        }

        Intent resultValue = new Intent();
        resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        setResult(RESULT_OK, resultValue);
        finish();
    }

    private boolean isWideWidget(AppWidgetManager manager) {
        if (manager.getAppWidgetInfo(appWidgetId) == null) {
            return false;
        }

        String providerClass = manager.getAppWidgetInfo(appWidgetId).provider.getClassName();
        return providerClass.endsWith("SalienceQuoteWideWidgetProvider");
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
