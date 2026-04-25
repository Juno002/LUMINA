# Capacitor resolves plugin metadata, permission aliases, and callbacks via runtime annotations.
# Preserve those annotations and plugin members so release builds behave like debug builds.
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations,AnnotationDefault,EnclosingMethod,InnerClasses

-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

-keepclassmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
}
