import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const javaHome = process.env.JAVA_HOME
const envPath = process.env.PATH || ''
const googleServices = path.join(__dirname, '..', 'android', 'app', 'google-services.json')

const hasJava =
  Boolean(javaHome) ||
  /\bjava(\.exe)?\b/i.test(envPath) ||
  process.platform !== 'win32'

if (!hasJava) {
  console.error(`
Ulnova Admin APK build requires Java (JDK 17+).

1. Install Android Studio (includes JDK) or Temurin JDK 17.
2. Set JAVA_HOME, e.g.:
   setx JAVA_HOME "C:\\Program Files\\Android\\Android Studio\\jbr"
3. Install Android SDK via Android Studio → SDK Manager.
4. From repo root: npm run build:admin-apk

Debug APK output:
  admin-mobile/android/app/build/outputs/apk/debug/app-debug.apk

For a physical device on local XAMPP, set before build:
  admin-mobile/.env.production
  VITE_API_URL=http://<your-LAN-IP>/ulnovatech/api

Production API (default):
  VITE_API_URL=https://ulnovatech.store/api
`)
  process.exit(1)
}

if (!fs.existsSync(googleServices)) {
  console.warn(`
Push notifications require Firebase:
  1. Create a Firebase project for store.ulnovatech.admin
  2. Add an Android app with package store.ulnovatech.admin
  3. Download google-services.json → admin-mobile/android/app/google-services.json
  4. Set FCM_PROJECT_ID in ulndash/backend/.env
  5. Use a service account JSON with Firebase Cloud Messaging API enabled
`)
} else {
  console.log('google-services.json found.')
}

console.log('Android build environment looks OK. Run: npm run build:apk')
