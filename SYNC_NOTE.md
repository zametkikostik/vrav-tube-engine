# Sync note

Most of the project is on GitHub.

**Still need a local `git push` for large files:**

- `src/App.tsx` (~37 KB)
- `server/src/routes/audit.ts` (~9 KB)

From project folder:

```bash
cd /path/to/vrav-tube-engine
git add src/App.tsx server/src/routes/audit.ts
git commit -m "feat: App UI and audit route"
git push origin main
```

Or force-push the full local commit:

```bash
git push -u origin main --force
```
