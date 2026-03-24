import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { DotsThree, Bell, ArrowsOutSimple, Moon, GearSix, Terminal, Heartbeat, FolderOpen, Sparkle, Keyboard, ClipboardText } from '@phosphor-icons/react'
import { useThemeStore } from '../theme'
import { useSessionStore } from '../stores/sessionStore'
import { usePopoverLayer } from './PopoverLayer'
import { useColors } from '../theme'

function RowToggle({
  checked,
  onChange,
  colors,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  colors: ReturnType<typeof useColors>
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors"
      style={{
        background: checked ? colors.accent : colors.surfaceSecondary,
        border: `1px solid ${checked ? colors.accent : colors.containerBorder}`,
      }}
    >
      <span
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all"
        style={{
          left: checked ? 18 : 2,
          background: '#fff',
        }}
      />
    </button>
  )
}

function ActionBtn({
  colors,
  icon,
  label,
  onClick,
}: {
  colors: ReturnType<typeof useColors>
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 10,
        fontWeight: 600,
        border: `1px solid ${colors.containerBorder}`,
        background: colors.surfacePrimary,
        color: colors.textSecondary,
        borderRadius: 8,
        padding: '5px 7px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        fontFamily: 'inherit',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

/* ─── Settings popover ─── */

export function SettingsPopover() {
  const soundEnabled = useThemeStore((s) => s.soundEnabled)
  const setSoundEnabled = useThemeStore((s) => s.setSoundEnabled)
  const themeMode = useThemeStore((s) => s.themeMode)
  const setThemeMode = useThemeStore((s) => s.setThemeMode)
  const expandedUI = useThemeStore((s) => s.expandedUI)
  const setExpandedUI = useThemeStore((s) => s.setExpandedUI)
  const isExpanded = useSessionStore((s) => s.isExpanded)
  const staticInfo = useSessionStore((s) => s.staticInfo)
  const openclawUpdateInfo = useSessionStore((s) => s.openclawUpdateInfo)
  const openclawUpdateBusy = useSessionStore((s) => s.openclawUpdateBusy)
  const checkOpenclawUpdate = useSessionStore((s) => s.checkOpenclawUpdate)
  const runOpenclawUpgrade = useSessionStore((s) => s.runOpenclawUpgrade)
  const openControlCenter = useSessionStore((s) => s.openControlCenter)
  const popoverLayer = usePopoverLayer()
  const colors = useColors()

  const [open, setOpen] = useState(false)
  const [healthChecking, setHealthChecking] = useState(false)
  const [healthText, setHealthText] = useState<string | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [utilityText, setUtilityText] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ right: number; top?: number; bottom?: number; maxHeight?: number }>({ right: 0 })

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 6
    const margin = 8
    const right = window.innerWidth - rect.right

    if (isExpanded) {
      const top = rect.bottom + gap
      setPos({
        top,
        right,
        maxHeight: Math.max(120, window.innerHeight - top - margin),
      })
      return
    }

    setPos({
      bottom: window.innerHeight - rect.top + gap,
      right,
      maxHeight: undefined,
    })
  }, [isExpanded])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onResize = () => updatePos()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open, updatePos])

  useEffect(() => {
    if (!open) return
    let raf = 0
    const tick = () => {
      updatePos()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [open, expandedUI, isExpanded, updatePos])

  const handleToggle = () => {
    if (!open) updatePos()
    setOpen((o) => !o)
  }

  const runHealth = async () => {
    setHealthChecking(true)
    const res = await window.clui.openclawHealth()
    if (res.ok) {
      const singleLine = (res.output || 'OK').split('\n').find(Boolean) || 'OK'
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
      'Cmd/Ctrl+Shift+K — Toggle fallback launcher',
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
    <>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        data-tour="settings-trigger"
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors"
        style={{ color: colors.textTertiary }}
        title="Settings"
      >
        <DotsThree size={16} weight="bold" />
      </button>

      {popoverLayer && open && createPortal(
        <motion.div
          ref={popoverRef}
          data-clui-ui
          initial={{ opacity: 0, y: isExpanded ? -4 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isExpanded ? -4 : 4 }}
          transition={{ duration: 0.12 }}
          className="rounded-xl"
          style={{
            position: 'fixed',
            ...(pos.top != null ? { top: pos.top } : {}),
            ...(pos.bottom != null ? { bottom: pos.bottom } : {}),
            right: pos.right,
            width: 252,
            pointerEvents: 'auto',
            background: colors.popoverBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: colors.popoverShadow,
            border: `1px solid ${colors.popoverBorder}`,
            ...(pos.maxHeight != null ? { maxHeight: pos.maxHeight, overflowY: 'auto' as const } : {}),
          }}
        >
          <div className="p-3 flex flex-col gap-2.5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowsOutSimple size={14} style={{ color: colors.textTertiary }} />
                  <div className="text-[12px] font-medium" style={{ color: colors.textPrimary }}>
                    Full width
                  </div>
                </div>
                <RowToggle checked={expandedUI} onChange={setExpandedUI} colors={colors} label="Toggle full width panel" />
              </div>
            </div>

            <div style={{ height: 1, background: colors.popoverBorder }} />

            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Bell size={14} style={{ color: colors.textTertiary }} />
                  <div className="text-[12px] font-medium" style={{ color: colors.textPrimary }}>
                    Notification sound
                  </div>
                </div>
                <RowToggle checked={soundEnabled} onChange={setSoundEnabled} colors={colors} label="Toggle notification sound" />
              </div>
            </div>

            <div style={{ height: 1, background: colors.popoverBorder }} />

            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Moon size={14} style={{ color: colors.textTertiary }} />
                  <div className="text-[12px] font-medium" style={{ color: colors.textPrimary }}>
                    Dark theme
                  </div>
                </div>
                <RowToggle checked={themeMode === 'dark'} onChange={(next) => setThemeMode(next ? 'dark' : 'light')} colors={colors} label="Toggle dark theme" />
              </div>
            </div>

            <div style={{ height: 1, background: colors.popoverBorder }} />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <GearSix size={14} style={{ color: colors.textTertiary }} />
                <div className="text-[12px] font-medium" style={{ color: colors.textPrimary }}>
                  OpenClaw Controls
                </div>
              </div>

              <div
                style={{
                  border: `1px solid ${colors.containerBorder}`,
                  borderRadius: 10,
                  background: colors.surfaceHover,
                  padding: '8px 9px',
                  marginBottom: 7,
                }}
              >
                <div className="text-[10px]" style={{ color: colors.textSecondary }}>
                  {staticInfo?.cliCommand || 'openclaw'} {staticInfo?.version || 'unknown'}
                </div>
                <div className="text-[10px]" style={{ color: colors.textTertiary, marginTop: 2 }}>
                  {staticInfo?.email
                    ? `Signed in as ${staticInfo.email}`
                    : staticInfo?.authSupported === false
                      ? 'Auth status not exposed by this CLI build'
                      : 'Not authenticated yet'}
                </div>
                {healthText && (
                  <div className="text-[10px]" style={{ color: colors.textTertiary, marginTop: 4 }}>
                    {healthText}
                  </div>
                )}
                {openclawUpdateInfo && (
                  <div className="text-[10px]" style={{ color: colors.textTertiary, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                    {openclawUpdateInfo.split('\n').slice(0, 3).join('\n')}
                  </div>
                )}
              </div>

              <div
                style={{
                  border: `1px solid ${colors.containerBorder}`,
                  borderRadius: 10,
                  background: colors.surfacePrimary,
                  padding: '8px 9px',
                  marginBottom: 7,
                }}
              >
                <div className="text-[10px] font-semibold" style={{ color: colors.textPrimary }}>
                  Credits & Attribution
                </div>
                <div className="text-[10px]" style={{ color: colors.textTertiary, marginTop: 2, lineHeight: 1.45 }}>
                  Original project foundation by lcoutodemos (clui-cc). This OpenClaw UI fork is maintained by Muhammad Daud Nasir.
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { void window.clui.openExternal('https://github.com/lcoutodemos/clui-cc') }}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '4px 7px',
                      borderRadius: 7,
                      border: `1px solid ${colors.containerBorder}`,
                      background: colors.surfaceHover,
                      color: colors.textSecondary,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Open Original Repo
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <ActionBtn
                  colors={colors}
                  icon={<Heartbeat size={11} />}
                  label={healthChecking ? 'Checking...' : 'Health'}
                  onClick={() => { void runHealth() }}
                />
                <ActionBtn
                  colors={colors}
                  icon={<Sparkle size={11} />}
                  label="Onboard"
                  onClick={() => { void window.clui.openclawOnboard() }}
                />
                <ActionBtn
                  colors={colors}
                  icon={<Terminal size={11} />}
                  label="Terminal"
                  onClick={() => { void window.clui.openInTerminal(null, staticInfo?.homePath || '~') }}
                />
                <ActionBtn
                  colors={colors}
                  icon={<FolderOpen size={11} />}
                  label="Open Home"
                  onClick={() => { if (staticInfo?.homePath) void window.clui.openPath(`${staticInfo.homePath}/.openclaw`) }}
                />
                <ActionBtn
                  colors={colors}
                  icon={<Sparkle size={11} />}
                  label={openclawUpdateBusy ? 'Checking...' : 'Check Update'}
                  onClick={() => { void checkOpenclawUpdate() }}
                />
                <ActionBtn
                  colors={colors}
                  icon={<Sparkle size={11} />}
                  label={openclawUpdateBusy ? 'Upgrading...' : 'Upgrade'}
                  onClick={() => { void runOpenclawUpgrade() }}
                />
              </div>

              <div style={{ marginTop: 6 }}>
                <button
                  onClick={openOnboarding}
                  style={{
                    width: '100%',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: `1px dashed ${colors.accentBorderMedium}`,
                    background: colors.accentLight,
                    color: colors.accent,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Reopen Onboarding
                </button>
              </div>
              <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  onClick={() => openControlCenter('settings')}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: `1px solid ${colors.containerBorder}`,
                    background: colors.surfacePrimary,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Full Settings
                </button>
                <button
                  onClick={() => openControlCenter('agents')}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: `1px solid ${colors.containerBorder}`,
                    background: colors.surfacePrimary,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Agents Tab
                </button>
              </div>

              <div style={{ height: 1, background: colors.popoverBorder, marginTop: 8, marginBottom: 8 }} />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Keyboard size={14} style={{ color: colors.textTertiary }} />
                  <div className="text-[12px] font-medium" style={{ color: colors.textPrimary }}>
                    Utilities
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <ActionBtn
                    colors={colors}
                    icon={<ClipboardText size={11} />}
                    label="Copy Diagnostics"
                    onClick={() => { void copyDiagnostics() }}
                  />
                  <ActionBtn
                    colors={colors}
                    icon={<Keyboard size={11} />}
                    label={showShortcuts ? 'Hide Keys' : 'Show Keys'}
                    onClick={() => setShowShortcuts((v) => !v)}
                  />
                  <ActionBtn
                    colors={colors}
                    icon={<ClipboardText size={11} />}
                    label="Copy Keys"
                    onClick={() => { void copyShortcutCheatsheet() }}
                  />
                  <ActionBtn
                    colors={colors}
                    icon={<Sparkle size={11} />}
                    label="Reset Onboarding"
                    onClick={openOnboarding}
                  />
                </div>
                {showShortcuts && (
                  <div
                    style={{
                      marginTop: 6,
                      border: `1px solid ${colors.containerBorder}`,
                      borderRadius: 8,
                      background: colors.surfaceHover,
                      padding: '6px 7px',
                      fontSize: 10,
                      color: colors.textSecondary,
                      lineHeight: 1.45,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    Alt+Space — Toggle launcher{'\n'}
                    Cmd/Ctrl+Shift+K — Toggle launcher fallback{'\n'}
                    Cmd/Ctrl+Shift+M — Open community skills{'\n'}
                    Cmd/Ctrl+Shift+A — Open agents control center{'\n'}
                    Cmd/Ctrl+Shift+S — Open settings control center{'\n'}
                    Esc — Hide window
                  </div>
                )}
                {utilityText && (
                  <div style={{ marginTop: 6, fontSize: 10, color: colors.textTertiary }}>
                    {utilityText}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>,
        popoverLayer,
      )}
    </>
  )
}
