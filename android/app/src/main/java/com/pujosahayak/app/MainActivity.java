package com.pujosahayak.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Ask the display for the highest refresh rate the panel supports.
        // Without this, Android 12+ OEM builds often keep the app window at
        // 60 Hz regardless of how cheap each frame is — no amount of CSS/JS
        // work crosses that ceiling because the OS scheduler is the cap.
        // REQUESTED_FRAME_RATE_CATEGORY_HIGH was added in API 31 (S).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            getWindow().getDecorView().setRequestedFrameRate(
                View.REQUESTED_FRAME_RATE_CATEGORY_HIGH
            );
        }
    }
}
