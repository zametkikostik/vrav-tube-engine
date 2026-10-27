# Сборка VRAV Tube Engine — Web / Desktop / Android

## 1. Web

```bash
npm install
npm run dev
cd server && npm i && npm run dev
```

Production:
```bash
npm run build
```

## 2. Desktop — Tauri 2

Requires Rust + system webkit deps.

```bash
npm install -D @tauri-apps/cli@2
npm run tauri:dev
npm run tauri:build
```

## 3. Android — Capacitor

```bash
npm install -D @capacitor/cli @capacitor/core
npm install @capacitor/android
npm run build && npx cap add android && npx cap open android
```

Emulator API: `http://10.0.2.2:8787`

## 4. Version sync

```bash
npm run sync-version
```

Source: `package.json` version → tauri.conf.json, Cargo.toml, android gradle.

## 5. CI

- `.github/workflows/web.yml`
- `.github/workflows/desktop.yml`
- `.github/workflows/android.yml`

Tag `v0.1.0` → GitHub Release with artifacts.
