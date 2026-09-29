package com.pujosahayak.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Set on the DecorView immediately so the very first layout pass has
        // the hint attached. Re-applied in onResume / onWindowFocusChanged
        // because Capacitor attaches the WebView to the tree after this point.
        applyHighFrameRateHint();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Some OEM schedulers evaluate the frame-rate hint on resume, not on
        // create. Re-asserting it here is free and covers that case.
        applyHighFrameRateHint();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyHighFrameRateHint();
    }

    private void applyHighFrameRateHint() {
        // View.REQUESTED_FRAME_RATE_CATEGORY_HIGH was added in API 31 (S).
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return;
        try {
            getWindow().getDecorView().setRequestedFrameRate(
                View.REQUESTED_FRAME_RATE_CATEGORY_HIGH
            );
        } catch (Throwable ignored) {}
        Bridge bridge = getBridge();
        if (bridge == null) return;
        WebView web = bridge.getWebView();
        if (web == null) return;
        try {
            web.setRequestedFrameRate(View.REQUESTED_FRAME_RATE_CATEGORY_HIGH);
        } catch (Throwable ignored) {}
    }
}
