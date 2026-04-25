package com.lumina.local;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.lumina.local.backup.BackupDocumentsPlugin;
import com.lumina.local.security.BiometricVaultPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(BackupDocumentsPlugin.class);
        registerPlugin(BiometricVaultPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
