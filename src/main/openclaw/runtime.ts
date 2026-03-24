import { execSync } from 'child_process'
import { homedir } from 'os'
import { join } from 'path'
import { getCliEnv } from '../cli-env'

const DEFAULT_CLI = 'openclaw'
const LEGACY_CLI = 'claude'

const OPENCLAW_HOME_ENV = 'OPENCLAW_HOME_DIR'
const OPENCLAW_CLI_ENV = 'OPENCLAW_CLI'

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export function getCliCommandCandidates(): string[] {
  const envOverride = process.env[OPENCLAW_CLI_ENV]?.trim()
  return uniq([envOverride || '', DEFAULT_CLI, LEGACY_CLI])
}

export function findCliBinary(): string {
  const candidates = [
    '/usr/local/bin/openclaw',
    '/opt/homebrew/bin/openclaw',
    join(homedir(), '.npm-global/bin/openclaw'),
    '/usr/local/bin/claude',
    '/opt/homebrew/bin/claude',
    join(homedir(), '.npm-global/bin/claude'),
  ]

  for (const c of candidates) {
    try {
      execSync(`test -x "${c}"`, { stdio: 'ignore' })
      return c
    } catch {}
  }

  const env = getCliEnv()
  for (const cmd of getCliCommandCandidates()) {
    try {
      const resolved = execSync(`/bin/zsh -lc "whence -p ${cmd} 2>/dev/null"`, { encoding: 'utf-8', env }).trim()
      if (resolved) return resolved
    } catch {}
    try {
      const resolved = execSync(`/bin/bash -lc "which ${cmd} 2>/dev/null"`, { encoding: 'utf-8', env }).trim()
      if (resolved) return resolved
    } catch {}
  }

  return getCliCommandCandidates()[0]
}

export function getAgentDataHomes(): string[] {
  const envOverride = process.env[OPENCLAW_HOME_ENV]?.trim()
  return uniq([
    envOverride || '',
    join(homedir(), '.openclaw'),
    join(homedir(), '.claude'),
  ])
}

export function getPrimaryAgentHome(): string {
  return getAgentDataHomes()[0]
}
