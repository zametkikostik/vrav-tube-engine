# How to publish a release with installers

## Why the release page only had Source code

Creating a tag/release **does not** auto-attach binaries.  
Workflows must upload files with `softprops/action-gh-release` (or similar).

## Correct flow

### Option A — new tag (recommended)

```bash
# Prefer semver without extra dot: v0.1.1 not v.0.1
git checkout main
git pull
git tag v0.1.1
git push origin v0.1.1
```

This starts workflow **Release assets** (`.github/workflows/release.yml`), which:

1. Builds web → `vrav-web-dist.zip`
2. Builds Linux Tauri → `.AppImage` / `.deb`
3. Builds Windows Tauri → `.msi` / NSIS
4. Attaches everything to the GitHub Release for that tag

Wait until the workflow is green, then refresh:

https://github.com/zametkikostik/vrav-tube-engine/releases

### Option B — attach to existing tag `v.0.1`

1. Open **Actions** → **Release assets** → **Run workflow**
2. Input tag: `v.0.1`
3. Run → when finished, files appear under that release

### Option C — manual from Actions artifacts

1. Open a green **Desktop Build** / **Web CI** run
2. Download artifacts at the bottom of the job
3. On the Release page → **Edit** → upload the zip/exe/AppImage manually

## Tag naming

| Good | Avoid |
|------|--------|
| `v0.1.0` | `v.0.1` (works with `v*` but non-standard) |
| `v1.0.0` | `0.1` (may not trigger `v*` workflows) |
