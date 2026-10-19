// Runs in CI after `npx cap add android`: adds permissions + app icon.
const fs = require('fs'), path = require('path');
const res = 'android/app/src/main/res';
const mf = 'android/app/src/main/AndroidManifest.xml';
let x = fs.readFileSync(mf, 'utf8');
const perms = ['CAMERA', 'RECORD_AUDIO', 'MODIFY_AUDIO_SETTINGS', 'VIBRATE'];
let add = '';
for (const p of perms) if (!x.includes('android.permission.' + p)) add += `    <uses-permission android:name="android.permission.${p}" />\n`;
add += '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n';
if (!x.includes('</manifest>')) throw new Error('manifest format changed');
x = x.replace('</manifest>', add + '</manifest>');
fs.writeFileSync(mf, x);
fs.cpSync('assets', res, { recursive: true });
const bg = path.join(res, 'values/ic_launcher_background.xml');
fs.writeFileSync(bg, fs.readFileSync(bg, 'utf8').replace(/#[0-9A-Fa-f]{6}/, '#2B2145'));

// Native helper: lets the website hide the Android status/navigation bar during calls.
const mainJava = `package app.justus.room;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    if (getBridge() != null && getBridge().getWebView() != null) {
      getBridge().getWebView().addJavascriptInterface(new NativeBits(), "JustUsNative");
    }
  }

  public class NativeBits {
    @JavascriptInterface
    public void immersive(final boolean on) {
      runOnUiThread(new Runnable() {
        @Override
        public void run() {
          justUsHideBars(on);
        }
      });
    }
  }

  private void justUsHideBars(boolean on) {
    Window w = getWindow();
    if (Build.VERSION.SDK_INT >= 30) {
      WindowInsetsController c = w.getInsetsController();
      if (c == null) return;
      if (on) {
        c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsets.Type.systemBars());
      } else {
        c.show(WindowInsets.Type.systemBars());
      }
    } else {
      View d = w.getDecorView();
      if (on) {
        d.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
      } else {
        d.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
      }
    }
  }
}
`;
const javaFile = 'android/app/src/main/java/app/justus/room/MainActivity.java';
if (!fs.existsSync(javaFile)) throw new Error('MainActivity.java not found');
fs.writeFileSync(javaFile, mainJava);
console.log('patched ok');
