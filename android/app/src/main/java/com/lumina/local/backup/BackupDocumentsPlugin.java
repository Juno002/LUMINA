package com.lumina.local.backup;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import androidx.activity.result.ActivityResult;
import androidx.annotation.Nullable;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONException;

@CapacitorPlugin(name = "BackupDocuments")
public class BackupDocumentsPlugin extends Plugin {

    private static final int BUFFER_SIZE = 16 * 1024;
    private static final String DEFAULT_FILENAME = "lumina-backup.json";
    private static final String DEFAULT_MIME_TYPE = "application/json";
    private static final String ERROR_CONTENT_MISSING = "backup content is missing.";
    private static final String ERROR_OPEN_CANCELED = "openBackupDocument canceled.";
    private static final String ERROR_OPEN_FAILED = "openBackupDocument failed.";
    private static final String ERROR_SAVE_CANCELED = "saveBackupDocument canceled.";
    private static final String ERROR_SAVE_FAILED = "saveBackupDocument failed.";
    private static final String ERROR_SOURCE_URI_MISSING = "sourceUri must be provided.";

    @PluginMethod
    public void saveBackupDocument(PluginCall call) {
        String sourceUri = call.getString("sourceUri");
        if (sourceUri == null || sourceUri.isEmpty()) {
            call.reject(ERROR_SOURCE_URI_MISSING);
            return;
        }

        String filename = call.getString("filename", DEFAULT_FILENAME);
        String mimeType = call.getString("mimeType", DEFAULT_MIME_TYPE);

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        );
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, filename);

        startActivityForResult(call, intent, "saveBackupDocumentResult");
    }

    @PluginMethod
    public void openBackupDocument(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        );

        String[] mimeTypes = parseMimeTypes(call.getArray("mimeTypes"));
        if (mimeTypes.length == 1) {
            intent.setType(mimeTypes[0]);
        } else {
            intent.setType("*/*");
            if (mimeTypes.length > 0) {
                intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
            }
        }

        startActivityForResult(call, intent, "openBackupDocumentResult");
    }

    @ActivityCallback
    private void saveBackupDocumentResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        int resultCode = result.getResultCode();
        if (resultCode == Activity.RESULT_CANCELED) {
            call.reject(ERROR_SAVE_CANCELED);
            return;
        }
        if (resultCode != Activity.RESULT_OK) {
            call.reject(ERROR_SAVE_FAILED);
            return;
        }

        Intent data = result.getData();
        Uri destinationUri = data != null ? data.getData() : null;
        if (destinationUri == null) {
            call.reject(ERROR_SAVE_FAILED);
            return;
        }

        maybePersistUriPermission(data, destinationUri);

        execute(() -> {
            try {
                String sourceUriValue = call.getString("sourceUri");
                if (sourceUriValue == null || sourceUriValue.isEmpty()) {
                    call.reject(ERROR_SOURCE_URI_MISSING);
                    return;
                }

                Uri sourceUri = Uri.parse(sourceUriValue);
                copyUriContents(sourceUri, destinationUri);

                JSObject resultObject = new JSObject();
                resultObject.put("uri", destinationUri.toString());
                resultObject.put("filename", resolveDisplayName(destinationUri, call.getString("filename", DEFAULT_FILENAME)));
                call.resolve(resultObject);
            } catch (Exception exception) {
                call.reject(exception.getMessage() != null ? exception.getMessage() : ERROR_SAVE_FAILED);
            }
        });
    }

    @ActivityCallback
    private void openBackupDocumentResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        int resultCode = result.getResultCode();
        if (resultCode == Activity.RESULT_CANCELED) {
            call.reject(ERROR_OPEN_CANCELED);
            return;
        }
        if (resultCode != Activity.RESULT_OK) {
            call.reject(ERROR_OPEN_FAILED);
            return;
        }

        Intent data = result.getData();
        Uri sourceUri = data != null ? data.getData() : null;
        if (sourceUri == null) {
            call.reject(ERROR_OPEN_FAILED);
            return;
        }

        maybePersistUriPermission(data, sourceUri);

        execute(() -> {
            try {
                String content = readUtf8FromUri(sourceUri);
                if (content.isEmpty()) {
                    call.reject(ERROR_CONTENT_MISSING);
                    return;
                }

                JSObject resultObject = new JSObject();
                resultObject.put("uri", sourceUri.toString());
                resultObject.put("name", resolveDisplayName(sourceUri, DEFAULT_FILENAME));
                resultObject.put("content", content);

                String mimeType = getContext().getContentResolver().getType(sourceUri);
                if (mimeType != null) {
                    resultObject.put("mimeType", mimeType);
                }

                Long size = resolveSize(sourceUri);
                if (size != null) {
                    resultObject.put("size", size);
                }

                call.resolve(resultObject);
            } catch (Exception exception) {
                call.reject(exception.getMessage() != null ? exception.getMessage() : ERROR_OPEN_FAILED);
            }
        });
    }

    private void maybePersistUriPermission(@Nullable Intent data, Uri uri) {
        if (data == null) {
            return;
        }

        int flags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        if (flags == 0) {
            return;
        }

        try {
            getContext().getContentResolver().takePersistableUriPermission(uri, flags);
        } catch (SecurityException ignored) {
            // Persistable access is best effort. Immediate read/write access is enough for this flow.
        }
    }

    private String[] parseMimeTypes(@Nullable JSArray mimeTypes) {
        if (mimeTypes == null) {
            return new String[] { DEFAULT_MIME_TYPE, "application/octet-stream" };
        }

        try {
            String[] parsedMimeTypes = new String[mimeTypes.length()];
            for (int index = 0; index < mimeTypes.length(); index++) {
                parsedMimeTypes[index] = mimeTypes.getString(index);
            }
            return parsedMimeTypes;
        } catch (JSONException exception) {
            return new String[] { DEFAULT_MIME_TYPE, "application/octet-stream" };
        }
    }

    private void copyUriContents(Uri sourceUri, Uri destinationUri) throws IOException {
        try (
            InputStream inputStream = openInputStream(sourceUri);
            OutputStream outputStream = getContext().getContentResolver().openOutputStream(destinationUri)
        ) {
            if (outputStream == null) {
                throw new IOException(ERROR_SAVE_FAILED);
            }

            byte[] buffer = new byte[BUFFER_SIZE];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            outputStream.flush();
        }
    }

    private String readUtf8FromUri(Uri sourceUri) throws IOException {
        try (
            InputStream inputStream = openInputStream(sourceUri);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream()
        ) {
            byte[] buffer = new byte[BUFFER_SIZE];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

            return new String(outputStream.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    private InputStream openInputStream(Uri uri) throws IOException {
        if (ContentResolver.SCHEME_FILE.equalsIgnoreCase(uri.getScheme())) {
            String path = uri.getPath();
            if (path == null || path.isEmpty()) {
                throw new IOException(ERROR_SAVE_FAILED);
            }
            return new FileInputStream(new File(path));
        }

        InputStream inputStream = getContext().getContentResolver().openInputStream(uri);
        if (inputStream == null) {
            throw new IOException(ERROR_OPEN_FAILED);
        }
        return inputStream;
    }

    private String resolveDisplayName(Uri uri, String fallback) {
        try (Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    String value = cursor.getString(index);
                    if (value != null && !value.isEmpty()) {
                        return value;
                    }
                }
            }
        } catch (Exception ignored) {
            // Fallback below.
        }

        String path = uri.getPath();
        if (path != null && !path.isEmpty()) {
            return new File(path).getName();
        }

        return fallback;
    }

    @Nullable
    private Long resolveSize(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.SIZE);
                if (index >= 0 && !cursor.isNull(index)) {
                    return cursor.getLong(index);
                }
            }
        } catch (Exception ignored) {
            // Size is optional metadata.
        }

        return null;
    }
}
