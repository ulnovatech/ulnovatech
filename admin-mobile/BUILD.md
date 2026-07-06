# Ulnova Admin — Android build

## Prerequisites

- JDK 17+ (`JAVA_HOME` set)
- Android SDK (via Android Studio)
- Node.js 20+
- XAMPP / production API reachable from the device

Check setup:

```powershell
cd admin-mobile
npm run build:apk:check
```

## Environment

| File | Purpose |
|------|---------|
| `.env.development` | Browser dev — proxies `/api` to local XAMPP |
| `.env.production` | Baked into APK — use production or LAN API URL |

For a phone testing against local XAMPP:

```env
VITE_API_URL=http://192.168.x.x/ulnovatech/api
```

## Firebase push (optional but recommended)

1. Firebase project → Android app `store.ulnovatech.admin`
2. Download `google-services.json` → `android/app/google-services.json`
3. Server `ulndash/backend/.env`:

```env
FCM_PROJECT_ID=your-project-id
FCM_CREDENTIALS_PATH=service-account.json
```

## Database migrations (server)

```powershell
# from repo root — requires MySQL running
npm run setup:admin-mobile
```

Or migrations only:

```powershell
php ulndash/backend/scripts/apply_admin_mobile_migrations.php
```

## Debug APK (sideload / USB)

```powershell
# from repo root
npm run build:admin-apk
```

Output: `admin-mobile/android/app/build/outputs/apk/debug/app-debug.apk`

## Signed release APK

1. Generate a keystore (once, store safely — **cannot be recovered**):

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore admin-mobile/keystore/ulnova-admin-release.keystore -alias ulnova-admin -keyalg RSA -keysize 2048 -validity 10000
```

2. Copy `android/keystore.properties.example` → `android/keystore.properties` and fill in passwords.

3. Build:

```powershell
npm run build:admin-apk:release
```

Output: `admin-mobile/android/app/build/outputs/apk/release/app-release.apk`

Install on admin phone (enable “Install unknown apps” for your file manager).

## Version bumps

Edit `android/app/build.gradle`:

- `versionCode` — integer, must increase every Play/sideload update
- `versionName` — human-readable label shown in Android settings
