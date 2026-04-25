package com.lumina.local.security;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.annotation.Nullable;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.fragment.app.FragmentActivity;
import androidx.core.content.ContextCompat;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyPermanentlyInvalidatedException;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "BiometricVault")
public class BiometricVaultPlugin extends Plugin {

    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
    private static final String KEY_ALIAS = "lumina_biometric_unlock_key";
    private static final String PREFS_NAME = "lumina_biometric_unlock";
    private static final String PREF_CIPHERTEXT = "ciphertext";
    private static final String PREF_IV = "iv";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int AUTHENTICATORS = BiometricManager.Authenticators.BIOMETRIC_STRONG;

    private static final String ERROR_BUSY = "BUSY";
    private static final String ERROR_KEY_INVALIDATED = "KEY_INVALIDATED";
    private static final String ERROR_MISSING_PASSPHRASE = "MISSING_PASSPHRASE";
    private static final String ERROR_NOT_AVAILABLE = "NOT_AVAILABLE";
    private static final String ERROR_NOT_ENABLED = "NOT_ENABLED";
    private static final String ERROR_NOT_ENROLLED = "NOT_ENROLLED";
    private static final String ERROR_NOT_SUPPORTED = "NOT_SUPPORTED";
    private static final String ERROR_USER_CANCELED = "USER_CANCELED";

    private enum PendingOperation {
        ENABLE,
        UNLOCK
    }

    @Nullable
    private PluginCall activeCall;

    @Nullable
    private PendingOperation activeOperation;

    @Nullable
    private String pendingPassphrase;

    @PluginMethod
    public void getStatus(PluginCall call) {
        int statusCode = BiometricManager.from(getContext()).canAuthenticate(AUTHENTICATORS);

        JSObject result = new JSObject();
        result.put("supported", isBiometricSupported(statusCode));
        result.put("available", statusCode == BiometricManager.BIOMETRIC_SUCCESS);
        result.put("enrolled", statusCode == BiometricManager.BIOMETRIC_SUCCESS);
        result.put("enabled", hasStoredPayload() && hasSecretKey());
        call.resolve(result);
    }

    @PluginMethod
    public void enableBiometricUnlock(PluginCall call) {
        if (activeCall != null) {
            call.reject(ERROR_BUSY);
            return;
        }

        String passphrase = call.getString("passphrase");
        if (passphrase == null || passphrase.trim().isEmpty()) {
            call.reject(ERROR_MISSING_PASSPHRASE);
            return;
        }

        int statusCode = BiometricManager.from(getContext()).canAuthenticate(AUTHENTICATORS);
        if (statusCode == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) {
            call.reject(ERROR_NOT_ENROLLED);
            return;
        }
        if (!isBiometricSupported(statusCode)) {
            call.reject(ERROR_NOT_SUPPORTED);
            return;
        }
        if (statusCode != BiometricManager.BIOMETRIC_SUCCESS) {
            call.reject(ERROR_NOT_AVAILABLE);
            return;
        }

        try {
            clearStoredPayload();
            deleteSecretKey();
            Cipher cipher = createCipher(Cipher.ENCRYPT_MODE, null);
            beginAuthentication(call, PendingOperation.ENABLE, passphrase, cipher);
        } catch (GeneralSecurityException exception) {
            call.reject(ERROR_NOT_AVAILABLE);
        }
    }

    @PluginMethod
    public void unlockWithBiometrics(PluginCall call) {
        if (activeCall != null) {
            call.reject(ERROR_BUSY);
            return;
        }

        if (!hasStoredPayload() || !hasSecretKey()) {
            clearStoredPayload();
            deleteSecretKey();
            call.reject(ERROR_NOT_ENABLED);
            return;
        }

        int statusCode = BiometricManager.from(getContext()).canAuthenticate(AUTHENTICATORS);
        if (statusCode == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) {
            call.reject(ERROR_NOT_ENROLLED);
            return;
        }
        if (!isBiometricSupported(statusCode)) {
            call.reject(ERROR_NOT_SUPPORTED);
            return;
        }
        if (statusCode != BiometricManager.BIOMETRIC_SUCCESS) {
            call.reject(ERROR_NOT_AVAILABLE);
            return;
        }

        try {
            byte[] iv = readBytes(PREF_IV);
            if (iv == null || iv.length == 0) {
                clearBiometricMaterial();
                call.reject(ERROR_NOT_ENABLED);
                return;
            }

            Cipher cipher = createCipher(Cipher.DECRYPT_MODE, iv);
            beginAuthentication(call, PendingOperation.UNLOCK, null, cipher);
        } catch (KeyPermanentlyInvalidatedException exception) {
            clearBiometricMaterial();
            call.reject(ERROR_KEY_INVALIDATED);
        } catch (GeneralSecurityException exception) {
            clearBiometricMaterial();
            call.reject(ERROR_NOT_AVAILABLE);
        }
    }

    @PluginMethod
    public void disableBiometricUnlock(PluginCall call) {
        clearBiometricMaterial();
        call.resolve();
    }

    private void beginAuthentication(
        PluginCall call,
        PendingOperation operation,
        @Nullable String passphrase,
        Cipher cipher
    ) {
        FragmentActivity activity = getActivity() instanceof FragmentActivity
            ? (FragmentActivity) getActivity()
            : null;

        if (activity == null) {
            call.reject(ERROR_NOT_AVAILABLE);
            return;
        }

        bridge.saveCall(call);
        activeCall = call;
        activeOperation = operation;
        pendingPassphrase = passphrase;

        activity.runOnUiThread(() -> {
            if (activity.isFinishing() || activity.isDestroyed()) {
                PluginCall pendingCall = activeCall;
                clearActiveOperation();
                if (pendingCall != null) {
                    pendingCall.reject(ERROR_NOT_AVAILABLE);
                }
                return;
            }

            try {
                BiometricPrompt prompt = new BiometricPrompt(
                    activity,
                    ContextCompat.getMainExecutor(getContext()),
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationError(int errorCode, CharSequence errString) {
                            PluginCall pendingCall = activeCall;
                            clearActiveOperation();
                            if (pendingCall == null) {
                                return;
                            }

                            if (
                                errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON
                                    || errorCode == BiometricPrompt.ERROR_USER_CANCELED
                                    || errorCode == BiometricPrompt.ERROR_CANCELED
                            ) {
                                pendingCall.reject(ERROR_USER_CANCELED);
                                return;
                            }

                            pendingCall.reject(ERROR_NOT_AVAILABLE);
                        }

                        @Override
                        public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                            PluginCall pendingCall = activeCall;
                            PendingOperation pendingOperation = activeOperation;
                            String storedPassphrase = pendingPassphrase;
                            clearActiveOperation();

                            if (pendingCall == null || pendingOperation == null) {
                                return;
                            }

                            Cipher authenticatedCipher = result.getCryptoObject() != null
                                ? result.getCryptoObject().getCipher()
                                : null;

                            if (authenticatedCipher == null) {
                                pendingCall.reject(ERROR_NOT_AVAILABLE);
                                return;
                            }

                            try {
                                if (pendingOperation == PendingOperation.ENABLE) {
                                    if (storedPassphrase == null) {
                                        pendingCall.reject(ERROR_MISSING_PASSPHRASE);
                                        return;
                                    }

                                    byte[] ciphertext = authenticatedCipher.doFinal(
                                        storedPassphrase.getBytes(StandardCharsets.UTF_8)
                                    );
                                    persistEncryptedPassphrase(ciphertext, authenticatedCipher.getIV());

                                    JSObject response = new JSObject();
                                    response.put("enabled", true);
                                    pendingCall.resolve(response);
                                    return;
                                }

                                byte[] ciphertext = readBytes(PREF_CIPHERTEXT);
                                if (ciphertext == null || ciphertext.length == 0) {
                                    clearBiometricMaterial();
                                    pendingCall.reject(ERROR_NOT_ENABLED);
                                    return;
                                }

                                byte[] plaintext = authenticatedCipher.doFinal(ciphertext);
                                JSObject response = new JSObject();
                                response.put("passphrase", new String(plaintext, StandardCharsets.UTF_8));
                                pendingCall.resolve(response);
                            } catch (GeneralSecurityException exception) {
                                clearBiometricMaterial();
                                pendingCall.reject(ERROR_NOT_AVAILABLE);
                            }
                        }
                    }
                );

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(operation == PendingOperation.ENABLE ? "Enable Biometric Unlock" : "Unlock LUMINA")
                    .setSubtitle(
                        operation == PendingOperation.ENABLE
                            ? "Confirm your biometric to seal the vault passphrase on this device."
                            : "Confirm your biometric to unlock the local vault."
                    )
                    .setNegativeButtonText("Cancel")
                    .build();

                prompt.authenticate(promptInfo, new BiometricPrompt.CryptoObject(cipher));
            } catch (RuntimeException exception) {
                PluginCall pendingCall = activeCall;
                clearActiveOperation();
                if (pendingCall != null) {
                    pendingCall.reject(ERROR_NOT_AVAILABLE);
                }
            }
        });
    }

    private boolean isBiometricSupported(int statusCode) {
        return statusCode != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
            && statusCode != BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED
            && statusCode != BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED;
    }

    private SharedPreferences getPreferences() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private boolean hasStoredPayload() {
        SharedPreferences preferences = getPreferences();
        return preferences.contains(PREF_CIPHERTEXT) && preferences.contains(PREF_IV);
    }

    private void persistEncryptedPassphrase(byte[] ciphertext, byte[] iv) {
        getPreferences()
            .edit()
            .putString(PREF_CIPHERTEXT, Base64.encodeToString(ciphertext, Base64.NO_WRAP))
            .putString(PREF_IV, Base64.encodeToString(iv, Base64.NO_WRAP))
            .commit();
    }

    @Nullable
    private byte[] readBytes(String key) {
        String encodedValue = getPreferences().getString(key, null);
        if (encodedValue == null || encodedValue.isEmpty()) {
            return null;
        }
        return Base64.decode(encodedValue, Base64.NO_WRAP);
    }

    private void clearStoredPayload() {
        getPreferences()
            .edit()
            .remove(PREF_CIPHERTEXT)
            .remove(PREF_IV)
            .commit();
    }

    private void clearBiometricMaterial() {
        clearStoredPayload();
        deleteSecretKey();
    }

    private void clearActiveOperation() {
        activeCall = null;
        activeOperation = null;
        pendingPassphrase = null;
    }

    private Cipher createCipher(int mode, @Nullable byte[] iv)
        throws GeneralSecurityException {
        SecretKey secretKey = getOrCreateSecretKey();
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);

        if (mode == Cipher.ENCRYPT_MODE) {
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        } else {
            if (iv == null || iv.length == 0) {
                throw new GeneralSecurityException(ERROR_NOT_ENABLED);
            }
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);
        }

        return cipher;
    }

    private SecretKey getOrCreateSecretKey() throws GeneralSecurityException {
        KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
        try {
            keyStore.load(null);
        } catch (Exception exception) {
            throw new GeneralSecurityException(exception);
        }

        SecretKey existingKey = (SecretKey) keyStore.getKey(KEY_ALIAS, null);
        if (existingKey != null) {
            return existingKey;
        }

        KeyGenerator keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            KEYSTORE_PROVIDER
        );

        KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        )
            .setKeySize(256)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setUserAuthenticationRequired(true)
            .setInvalidatedByBiometricEnrollment(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            builder.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG);
        } else {
            builder.setUserAuthenticationValidityDurationSeconds(-1);
        }

        keyGenerator.init(builder.build());
        return keyGenerator.generateKey();
    }

    private boolean hasSecretKey() {
        try {
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);
            return keyStore.containsAlias(KEY_ALIAS);
        } catch (Exception exception) {
            return false;
        }
    }

    private void deleteSecretKey() {
        try {
            KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
            keyStore.load(null);
            if (keyStore.containsAlias(KEY_ALIAS)) {
                keyStore.deleteEntry(KEY_ALIAS);
            }
        } catch (Exception ignored) {
            // Key cleanup is best effort.
        }
    }
}
