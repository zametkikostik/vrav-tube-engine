# App icons

Required by Tauri (`tauri.conf.json` → `bundle.icon`):

- `32x32.png`, `128x128.png`, `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

## Generate

From repo root:

```bash
# 1) Placeholder source (or drop your own 1024×1024 PNG as icon.png)
python3 scripts/generate-icons.py

# 2) Full set via Tauri CLI (recommended)
npm install -D @tauri-apps/cli@2
npx tauri icon src-tauri/icons/icon.png
```

CI runs these steps automatically before `tauri build`.

Replace `icon.png` with your brand asset before a public release.
