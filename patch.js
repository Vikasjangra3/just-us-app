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
console.log('patched ok');
