import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Robot, SlidersHorizontal, Terminal, Play, Stop, ArrowsClockwise, FolderOpen, Keyboard, ClipboardText, Heartbeat, Sparkle } from '@phosphor-icons/react'
import { useSessionStore } from '../stores/sessionStore'
import { useColors } from '../theme'

function formatStatusText(text: string | null | undefined, maxLines = 5): string {
  if (!text) return ''
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .filter((line) => !/^[\s\-_=+|:┄─━┈]{8,}$/.test(line))
    .slice(0, maxLines)
    .join('\n')
}

export function ControlCenterPanel() {
  const colors = useColors()
  const tab = useSessionStore((s) => s.controlCenterTab)
  const setTab = useSessionStore((s) => s.setControlCenterTab)
  const close = useSessionStore((s) => s.closeControlCenter)

  return (
    <div data-clui-ui style={{ height: 560, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${colors.containerBorder}` }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <TabBtn active={tab === 'agents'} label="Agents" icon={<Robot size={14} />} onClick={() => setTab('agents')} colors={colors} />
          <TabBtn active={tab === 'settings'} label="Settings" icon={<SlidersHorizontal size={14} />} onClick={() => setTab('settings')} colors={colors} />
        </div>
        <button onClick={close} style={{ background: 'none', border: 'none', color: colors.textTertiary, cursor: 'pointer' }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <AnimatePresence mode="wait" initial={false}>
          {tab === 'agents' ? (
            <motion.div
              key="agents-tab"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <AgentsTab />
            </motion.div>
          ) : (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <SettingsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function AgentsTab() {
  const colors = useColors()
  const staticInfo = useSessionStore((s) => s.staticInfo)
  const [output, setOutput] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const run = async (action: string) => {
    setBusy(true)
    const res = await window.clui.openclawRun(action)
    if (res.ok) setOutput(res.output || 'Done')
    else setOutput(`${res.error || 'Failed'}\n${res.output || ''}`.trim())
    setBusy(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Card title="Gateway" colors={colors}>
        <Action onClick={() => { void run('gateway_start') }} label="Start Gateway" icon={<Play size={11} />} colors={colors} />
        <Action onClick={() => { void run('gateway_stop') }} label="Stop Gateway" icon={<Stop size={11} />} colors={colors} />
      </Card>
      <Card title="Channels" colors={colors}>
        <Action onClick={() => { void run('channels_status') }} label="Channel Status" icon={<ArrowsClockwise size={11} />} colors={colors} />
        <Action onClick={() => { void window.clui.openInTerminal(null, staticInfo?.homePath || '~') }} label="Open Terminal" icon={<Terminal size={11} />} colors={colors} />
      </Card>
      <Card title="Plugins & Skills" colors={colors}>
        <Action onClick={() => { void run('plugins_list') }} label="List Plugins" icon={<ArrowsClockwise size={11} />} colors={colors} />
        <Action onClick={() => { void run('skills_list') }} label="List Skills" icon={<ArrowsClockwise size={11} />} colors={colors} />
      </Card>
      <Card title="Paths" colors={colors}>
        <Action onClick={() => { if (staticInfo?.homePath) void window.clui.openPath(`${staticInfo.homePath}/.openclaw`) }} label="Open ~/.openclaw" icon={<FolderOpen size={11} />} colors={colors} />
        <Action onClick={() => { if (staticInfo?.homePath) void window.clui.openPath(`${staticInfo.homePath}/.openclaw/workspace`) }} label="Open Workspace" icon={<FolderOpen size={11} />} colors={colors} />
      </Card>

      <div style={{ gridColumn: '1 / -1' }}>
        <div style={{ border: `1px solid ${colors.containerBorder}`, borderRadius: 10, background: colors.surfacePrimary, padding: 10, minHeight: 140 }}>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>
            Command Output {busy ? '(running...)' : ''}
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 11, color: colors.textTertiary, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            {output || 'Run an action to see output.'}
          </pre>
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  const colors = useColors()
  const openclawModels = useSessionStore((s) => s.openclawModels)
  const activeProvider = useSessionStore((s) => s.activeProvider)
  const currentModel = useSessionStore((s) => s.currentOpenclawModel)
  const refresh = useSessionStore((s) => s.refreshOpenclawModels)
  const setOpenclawModel = useSessionStore((s) => s.setOpenclawModel)
  const openclawUpdateInfo = useSessionStore((s) => s.openclawUpdateInfo)
  const openclawUpdateBusy = useSessionStore((s) => s.openclawUpdateBusy)
  const checkOpenclawUpdate = useSessionStore((s) => s.checkOpenclawUpdate)
  const runOpenclawUpgrade = useSessionStore((s) => s.runOpenclawUpgrade)
  const staticInfo = useSessionStore((s) => s.staticInfo)
  const toggleMarketplace = useSessionStore((s) => s.toggleMarketplace)
  const closeControlCenter = useSessionStore((s) => s.closeControlCenter)
  const [healthChecking, setHealthChecking] = useState(false)
  const [healthText, setHealthText] = useState<string | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [utilityText, setUtilityText] = useState<string | null>(null)
  const [providers, setProviders] = useState<string[]>([])
  const [providerModels, setProviderModels] = useState<Record<string, Array<{ id: string; name: string }>>>({})
  const [pendingProvider, setPendingProvider] = useState<string>('')
  const [pendingModel, setPendingModel] = useState<string>('')

  useEffect(() => {
    void (async () => {
      await refresh()
      const info = await window.clui.openclawModelInfo()
      if (!info.ok) return
      const ids = info.providers.map((p) => p.id)
      const map: Record<string, Array<{ id: string; name: string }>> = {}
      for (const p of info.providers) map[p.id] = p.models
      setProviders(ids)
      setProviderModels(map)
      setPendingProvider(info.provider || ids[0] || '')
    })()
  }, [refresh])

  useEffect(() => {
    if (currentModel) setPendingModel(currentModel)
  }, [currentModel])

  useEffect(() => {
    if (activeProvider) setPendingProvider(activeProvider)
  }, [activeProvider])

  useEffect(() => {
    const models = providerModels[pendingProvider] || []
    if (models.length === 0) return
    const hasCurrent = models.some((m) => m.id === pendingModel)
    if (!hasCurrent) setPendingModel(models[0].id)
  }, [pendingProvider, providerModels, pendingModel])

  const visibleModels = providerModels[pendingProvider] || openclawModels.map((m) => ({ id: m.id, name: m.label }))
  const cleanUpdateInfo = formatStatusText(openclawUpdateInfo, 6)

  const runHealth = async () => {
    setHealthChecking(true)
    const res = await window.clui.openclawHealth()
    if (res.ok) {
      const singleLine = formatStatusText(res.output, 1) || 'OK'
      setHealthText(`Health: ${singleLine}`)
    } else {
      setHealthText(`Health failed: ${res.error || 'Unknown error'}`)
    }
    setHealthChecking(false)
  }

  const openOnboarding = () => {
    localStorage.setItem('openclaw-onboarding-dismissed', '0')
    window.dispatchEvent(new Event('openclaw:show-onboarding'))
  }

  const copyDiagnostics = async () => {
    try {
      const payload = await window.clui.getDiagnostics()
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setUtilityText('Diagnostics copied to clipboard.')
    } catch {
      setUtilityText('Failed to copy diagnostics.')
    }
  }

  const copyShortcutCheatsheet = async () => {
    const sheet = [
      'Alt+Space — Toggle launcher',
      'Cmd/Ctrl+Shift+K — Toggle launcher fallback',
      'Cmd/Ctrl+Shift+M — Open community skills',
      'Cmd/Ctrl+Shift+A — Open agents control center',
      'Cmd/Ctrl+Shift+S — Open settings control center',
      'Esc — Hide window',
    ].join('\n')
    try {
      await navigator.clipboard.writeText(sheet)
      setUtilityText('Shortcut list copied.')
    } catch {
      setUtilityText('Failed to copy shortcut list.')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="Model Controls" colors={colors}>
        <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>
          OpenClaw currently enforces one active provider at a time.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <select
            value={pendingProvider}
            onChange={(e) => setPendingProvider(e.target.value)}
            style={{
              width: '100%',
              fontSize: 12,
              borderRadius: 8,
              background: colors.surfacePrimary,
              color: colors.textPrimary,
              border: `1px solid ${colors.containerBorder}`,
              padding: '8px 9px',
            }}
          >
            {(providers.length > 0 ? providers : [activeProvider || '']).filter(Boolean).map((providerId) => (
              <option key={providerId} value={providerId}>{providerId}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: colors.textSecondary, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
            Active provider: <strong style={{ marginLeft: 4 }}>{activeProvider || 'unknown'}</strong>
          </div>
        </div>
        <select
          value={pendingModel}
          onChange={(e) => setPendingModel(e.target.value)}
          style={{
            width: '100%',
            fontSize: 12,
            borderRadius: 8,
            background: colors.surfacePrimary,
            color: colors.textPrimary,
            border: `1px solid ${colors.containerBorder}`,
            padding: '8px 9px',
          }}
        >
          {visibleModels.map((m) => (
            <option key={m.id} value={m.id}>{m.name || m.id} ({m.id})</option>
          ))}
        </select>
        <div style={{ marginTop: 8, display: 'flex', gap: 7 }}>
          <Action
            onClick={() => { if (pendingProvider && pendingModel) void setOpenclawModel(pendingProvider, pendingModel) }}
            label="Apply Model"
            icon={<Play size={11} />}
            colors={colors}
          />
          <Action onClick={() => { void refresh() }} label="Refresh" icon={<ArrowsClockwise size={11} />} colors={colors} />
        </div>
      </Card>

      <Card title="Theme Mode" colors={colors}>
        <div style={{ fontSize: 11, color: colors.textSecondary }}>
          Light theme is supported. Use quick settings in the top-right dots menu to toggle between dark and light.
        </div>
      </Card>

      <Card title="OpenClaw Info" colors={colors}>
        <div style={{ fontSize: 11, color: colors.textSecondary }}>CLI: {staticInfo?.cliCommand || 'openclaw'} {staticInfo?.version || 'unknown'}</div>
        <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>Auth: {staticInfo?.email || (staticInfo?.authSupported === false ? 'not exposed' : 'not connected')}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 7 }}>
          <Action onClick={() => { void runHealth() }} label={healthChecking ? 'Checking Health...' : 'Health'} icon={<Heartbeat size={11} />} colors={colors} />
          <Action onClick={() => { void checkOpenclawUpdate() }} label={openclawUpdateBusy ? 'Checking...' : 'Check Update'} icon={<ArrowsClockwise size={11} />} colors={colors} />
          <Action onClick={() => { void runOpenclawUpgrade() }} label={openclawUpdateBusy ? 'Upgrading...' : 'Upgrade'} icon={<Play size={11} />} colors={colors} />
        </div>
        {healthText && (
          <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            {healthText}
          </div>
        )}
        {cleanUpdateInfo && (
          <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            {cleanUpdateInfo}
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <Action
            onClick={() => {
              closeControlCenter()
              toggleMarketplace()
            }}
            label="Open Skills Marketplace"
            icon={<ArrowsClockwise size={11} />}
            colors={colors}
          />
        </div>
      </Card>

      <Card title="Utilities" colors={colors}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <Action onClick={() => { void copyDiagnostics() }} label="Copy Diagnostics" icon={<ClipboardText size={11} />} colors={colors} />
          <Action onClick={() => { void copyShortcutCheatsheet() }} label="Copy Keys" icon={<Keyboard size={11} />} colors={colors} />
          <Action onClick={openOnboarding} label="Reopen Onboarding" icon={<Sparkle size={11} />} colors={colors} />
          <Action onClick={() => setShowShortcuts((v) => !v)} label={showShortcuts ? 'Hide Keys' : 'Show Keys'} icon={<Keyboard size={11} />} colors={colors} />
        </div>
        {showShortcuts && (
          <div style={{ marginTop: 8, fontSize: 10, color: colors.textSecondary, whiteSpace: 'pre-wrap', lineHeight: 1.45, overflowWrap: 'anywhere' }}>
            Alt+Space — Toggle launcher{'\n'}
            Cmd/Ctrl+Shift+K — Toggle launcher fallback{'\n'}
            Cmd/Ctrl+Shift+M — Open community skills{'\n'}
            Cmd/Ctrl+Shift+A — Open agents control center{'\n'}
            Cmd/Ctrl+Shift+S — Open settings control center{'\n'}
            Esc — Hide window
          </div>
        )}
        {utilityText && (
          <div style={{ marginTop: 8, fontSize: 10, color: colors.textTertiary }}>
            {utilityText}
          </div>
        )}
      </Card>

      <Card title="Credits & Attribution" colors={colors}>
        <div style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.5 }}>
          Original project foundation by lcoutodemos (clui-cc). This OpenClaw UI fork is maintained by Muhammad Daud Nasir.
        </div>
        <div style={{ marginTop: 8 }}>
          <Action onClick={() => { void window.clui.openExternal('https://github.com/lcoutodemos/clui-cc') }} label="Open Original Repo" icon={<FolderOpen size={11} />} colors={colors} />
        </div>
      </Card>
    </div>
  )
}

function Card({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <div style={{ border: `1px solid ${colors.containerBorder}`, borderRadius: 12, background: colors.surfaceHover, padding: 11 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function Action({ onClick, label, icon, colors }: { onClick: () => void; label: string; icon: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        fontWeight: 600,
        border: `1px solid ${colors.containerBorder}`,
        background: colors.surfacePrimary,
        color: colors.textSecondary,
        borderRadius: 8,
        padding: '6px 9px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'inherit',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function TabBtn({ active, label, icon, onClick, colors }: {
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
  colors: ReturnType<typeof useColors>
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      style={{
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${active ? colors.accent : colors.containerBorder}`,
        background: active ? colors.accentLight : colors.surfacePrimary,
        color: active ? colors.accent : colors.textSecondary,
        borderRadius: 999,
        padding: '6px 11px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'inherit',
      }}
    >
      {icon}
      {label}
    </motion.button>
  )
}
