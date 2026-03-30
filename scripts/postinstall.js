#!/usr/bin/env node
const { spawnSync } = require('node:child_process')
const path = require('node:path')

// macOS-only icon patch for local Electron dev app.
if (process.platform !== 'darwin') {
  process.exit(0)
}

const script = path.join(__dirname, 'patch-dev-icon.sh')
const res = spawnSync('bash', [script], { stdio: 'inherit' })
if (res.error) {
  console.warn(`[postinstall] skipped icon patch: ${res.error.message}`)
  process.exit(0)
}
process.exit(typeof res.status === 'number' ? res.status : 0)
