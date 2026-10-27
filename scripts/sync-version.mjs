#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const version = pkg.version
if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error('Invalid version in package.json:', version)
  process.exit(1)
}

const [maj, min, pat] = version.split('.').map(n => parseInt(n, 10))
const versionCode = maj * 10000 + min * 100 + pat

const tauriPath = join(root, 'src-tauri/tauri.conf.json')
if (existsSync(tauriPath)) {
  const tauri = JSON.parse(readFileSync(tauriPath, 'utf8'))
  tauri.version = version
  writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n')
  console.log('✓ tauri.conf.json →', version)
}

const cargoPath = join(root, 'src-tauri/Cargo.toml')
if (existsSync(cargoPath)) {
  let cargo = readFileSync(cargoPath, 'utf8')
  cargo = cargo.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`)
  writeFileSync(cargoPath, cargo)
  console.log('✓ Cargo.toml →', version)
}

for (const rel of ['android/app/build.gradle', 'android/app/build.gradle.kts']) {
  const gp = join(root, rel)
  if (!existsSync(gp)) continue
  let g = readFileSync(gp, 'utf8')
  if (rel.endsWith('.kts')) {
    g = g
      .replace(/versionCode\s*=\s*\d+/, `versionCode = ${versionCode}`)
      .replace(/versionName\s*=\s*"[^"]+"/, `versionName = "${version}"`)
  } else {
    g = g
      .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
      .replace(/versionName\s+"[^"]+"/, `versionName "${version}"`)
  }
  writeFileSync(gp, g)
  console.log('✓', rel, '→', version, `(code ${versionCode})`)
}

console.log('Version sync complete:', version)
