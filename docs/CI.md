# CI notes

## Lockfile error fixed

GitHub Actions was failing with:

```text
Error: Dependencies lock file is not found
Supported file patterns: package-lock.json, npm-shrinkwrap.json, yarn.lock
```

**Cause:** `actions/setup-node` with `cache: npm` requires a lockfile in the repo.  
**Fix:** workflows no longer set `cache: npm`. They use `npm install` instead of `npm ci`.

## Optional: restore npm cache (faster CI)

After a successful local install, commit the lockfile:

```bash
npm install
cd server && npm install && cd ..
git add package-lock.json server/package-lock.json
git commit -m "chore: add package-lock for CI cache"
git push
```

Then in workflows you can set again:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
- run: npm ci
```

## Web job

- `npm install` → `npm run build` → upload `dist`

## Desktop / Android

May need full Tauri / Capacitor project files and secrets for signed release builds.
