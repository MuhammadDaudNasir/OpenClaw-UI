import React, { useEffect, useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Paperclip, Camera, HeadCircuit, Sparkle } from '@phosphor-icons/react'
import { TabStrip } from './components/TabStrip'
import { ConversationView } from './components/ConversationView'
import { InputBar } from './components/InputBar'
import { StatusBar } from './components/StatusBar'
import { MarketplacePanel } from './components/MarketplacePanel'
import { OnboardingPanel } from './components/OnboardingPanel'
import { ControlCenterPanel } from './components/ControlCenterPanel'
import { GuidedTourOverlay, type TourStep } from './components/GuidedTourOverlay'
import { PopoverLayerProvider } from './components/PopoverLayer'
import { useClaudeEvents } from './hooks/useClaudeEvents'
import { useHealthReconciliation } from './hooks/useHealthReconciliation'
import { useWorkingMonitor } from './hooks/useWorkingMonitor'
import { useSessionStore } from './stores/sessionStore'
import { useColors, useThemeStore, spacing } from './theme'

const TRANSITION = { duration: 0.26, ease: [0.4, 0, 0.1, 1] as const }

export default function App() {
  useClaudeEvents()
  useHealthReconciliation()
  useWorkingMonitor()

  const activeTabStatus = useSessionStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.status)
  const addAttachments = useSessionStore((s) => s.addAttachments)
  const staticInfo = useSessionStore((s) => s.staticInfo)
  const setBaseDirectory = useSessionStore((s) => s.setBaseDirectory)
  const colors = useColors()
  const setSystemTheme = useThemeStore((s) => s.setSystemTheme)
  const expandedUI = useThemeStore((s) => s.expandedUI)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const isExpanded = useSessionStore((s) => s.isExpanded)
  const marketplaceOpen = useSessionStore((s) => s.marketplaceOpen)
  const controlCenterOpen = useSessionStore((s) => s.controlCenterOpen)
  const isRunning = activeTabStatus === 'running' || activeTabStatus === 'connecting'

  // ─── Theme initialization ───
  useEffect(() => {
    // Get initial OS theme — setSystemTheme respects themeMode (system/light/dark)
    window.clui.getTheme().then(({ isDark }) => {
      setSystemTheme(isDark)
    }).catch(() => {})

    // Listen for OS theme changes
    const unsub = window.clui.onThemeChange((isDark) => {
      setSystemTheme(isDark)
    })
    return unsub
  }, [setSystemTheme])

  useEffect(() => {
    useSessionStore.getState().initStaticInfo().then(() => {
      const homeDir = useSessionStore.getState().staticInfo?.homePath || '~'
      const tab = useSessionStore.getState().tabs[0]
      if (tab) {
        // Set working directory to home by default (user hasn't chosen yet)
        useSessionStore.setState((s) => ({
          tabs: s.tabs.map((t, i) => (i === 0 ? { ...t, workingDirectory: homeDir, hasChosenDirectory: false } : t)),
        }))
        window.clui.createTab().then(({ tabId }) => {
          useSessionStore.setState((s) => ({
            tabs: s.tabs.map((t, i) => (i === 0 ? { ...t, id: tabId } : t)),
            activeTabId: tabId,
          }))
        }).catch(() => {})
      }

      const info = useSessionStore.getState().staticInfo
      const complete = localStorage.getItem('openclaw-onboarding-complete') === '1'
      const needsOnboarding = !complete && !!info
      setShowOnboarding(needsOnboarding)
    })
  }, [])

  // Every time the launcher is shown again, start from chat-only mode.
  useEffect(() => {
    return window.clui.onWindowShown(() => {
      useSessionStore.getState().closeAuxPanels()
    })
  }, [])

  const onboardingInfo = useMemo(() => {
    if (!staticInfo) return null
    return {
      version: staticInfo.version,
      email: staticInfo.email,
      homePath: staticInfo.homePath,
      cliCommand: staticInfo.cliCommand,
      authSupported: staticInfo.authSupported,
    }
  }, [staticInfo])

  useEffect(() => {
    const handler = () => setShowOnboarding(true)
    window.addEventListener('openclaw:show-onboarding', handler)
    return () => window.removeEventListener('openclaw:show-onboarding', handler)
  }, [])

  useEffect(() => {
    return window.clui.onShortcutAction((action) => {
      if (action === 'toggle-marketplace') {
        useSessionStore.getState().toggleMarketplace()
        return
      }
      if (action === 'open-agents') {
        useSessionStore.getState().openControlCenter('agents')
        return
      }
      if (action === 'open-settings') {
        useSessionStore.getState().openControlCenter('settings')
      }
    })
  }, [])

  const tourSteps = useMemo<TourStep[]>(() => ([
    {
      id: 'tabs',
      title: 'Tabs & Sessions',
      body: 'Use tabs to manage separate OpenClaw sessions. Click a tab to focus, or create a new one.',
      selector: '[data-tour=\"tabs\"]',
    },
    {
      id: 'input',
      title: 'Prompt Input',
      body: 'Type prompts here, add attachments, and run slash commands like /model or /skills.',
      selector: '[data-tour=\"input\"]',
    },
    {
      id: 'quick-settings',
      title: 'Quick Settings',
      body: 'Open quick settings to switch theme, full width mode, and access OpenClaw checks.',
      selector: '[data-tour=\"settings-trigger\"]',
    },
    {
      id: 'left-actions',
      title: 'Top Action Bar',
      body: 'These actions handle files, screenshots, Control Center, and community skill sets.',
      selector: '[data-tour=\"left-actions\"]',
    },
    {
      id: 'marketplace',
      title: 'Community Skills',
      body: 'Browse and install native or ClawHub skills from the Skills Marketplace.',
      selector: '[data-tour=\"marketplace-panel\"]',
    },
    {
      id: 'control-center',
      title: 'Agent Control Center',
      body: 'Use this full panel to run OpenClaw commands and manage provider/model settings.',
      selector: '[data-tour=\"control-center-panel\"]',
    },
  ]), [])

  useEffect(() => {
    if (!tourOpen) return
    const current = tourSteps[tourStep]?.id
    if (current === 'marketplace' && !marketplaceOpen) useSessionStore.getState().toggleMarketplace()
    if (current !== 'marketplace' && marketplaceOpen) useSessionStore.getState().closeMarketplace()
    if (current === 'control-center' && !controlCenterOpen) useSessionStore.getState().openControlCenter('agents')
    if (current !== 'control-center' && controlCenterOpen) useSessionStore.getState().closeControlCenter()
  }, [tourOpen, tourStep, tourSteps, marketplaceOpen, controlCenterOpen])

  // OS-level click-through (RAF-throttled to avoid per-pixel IPC)
  useEffect(() => {
    if (!window.clui?.setIgnoreMouseEvents) return
    let lastIgnored: boolean | null = null

    const onMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const isUI = !!(el && el.closest('[data-clui-ui]'))
      const shouldIgnore = !isUI
      if (shouldIgnore !== lastIgnored) {
        lastIgnored = shouldIgnore
        if (shouldIgnore) {
          window.clui.setIgnoreMouseEvents(true, { forward: true })
        } else {
          window.clui.setIgnoreMouseEvents(false)
        }
      }
    }

    const onMouseLeave = () => {
      if (lastIgnored !== true) {
        lastIgnored = true
        window.clui.setIgnoreMouseEvents(true, { forward: true })
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  // Layout dimensions — expandedUI widens and heightens the panel
  const contentWidth = expandedUI ? 700 : spacing.contentWidth
  const cardExpandedWidth = expandedUI ? 700 : 460
  const cardCollapsedWidth = expandedUI ? 670 : 430
  const cardCollapsedMargin = expandedUI ? 15 : 15
  const bodyMaxHeight = expandedUI ? 520 : 400

  const handleScreenshot = useCallback(async () => {
    const result = await window.clui.takeScreenshot()
    if (!result) return
    addAttachments([result])
  }, [addAttachments])

  const handleAttachFile = useCallback(async () => {
    const files = await window.clui.attachFiles()
    if (!files || files.length === 0) return
    addAttachments(files)
  }, [addAttachments])

  const handlePickWorkspace = useCallback(async () => {
    const dir = await window.clui.selectDirectory()
    if (dir) setBaseDirectory(dir)
  }, [setBaseDirectory])

  return (
    <PopoverLayerProvider>
      <div className="flex flex-col justify-end h-full" style={{ background: 'transparent' }}>

        {/* ─── 460px content column, centered. Circles overflow left. ─── */}
        <div style={{ width: contentWidth, position: 'relative', margin: '0 auto', transition: 'width 0.26s cubic-bezier(0.4, 0, 0.1, 1)' }}>

          {showOnboarding && onboardingInfo && (
            <div
              data-clui-ui
              style={{
                width: Math.min(720, expandedUI ? 720 : 620),
                maxWidth: 720,
                marginLeft: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <OnboardingPanel
                info={onboardingInfo}
                onOpenTerminal={() => { window.clui.openInTerminal(null, onboardingInfo.homePath) }}
                onPickWorkspace={handlePickWorkspace}
                onOpenMarketplace={() => useSessionStore.getState().toggleMarketplace()}
                onOpenControlCenter={() => useSessionStore.getState().openControlCenter('settings')}
                onStartTour={() => {
                  setShowOnboarding(false)
                  setTourStep(0)
                  setTourOpen(true)
                }}
                onDismiss={() => {
                  localStorage.setItem('openclaw-onboarding-dismissed', '1')
                  setShowOnboarding(false)
                }}
              />
            </div>
          )}

          <AnimatePresence initial={false}>
            {controlCenterOpen && (
              <div
                data-clui-ui
                data-tour="control-center-panel"
                style={{
                  width: 920,
                  maxWidth: 920,
                  marginLeft: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 14,
                  position: 'relative',
                  zIndex: 31,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.985 }}
                  transition={TRANSITION}
                >
                  <div
                    data-clui-ui
                    className="glass-surface overflow-hidden no-drag"
                    style={{
                      borderRadius: 24,
                      maxHeight: 560,
                    }}
                  >
                    <ControlCenterPanel />
                  </div>
                </motion.div>
              </div>
            )}

            {marketplaceOpen && (
              <div
                data-clui-ui
                data-tour="marketplace-panel"
                style={{
                  width: 720,
                  maxWidth: 720,
                  marginLeft: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 14,
                  position: 'relative',
                  zIndex: 30,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.985 }}
                  transition={TRANSITION}
                >
                  <div
                    data-clui-ui
                    className="glass-surface overflow-hidden no-drag"
                    style={{
                      borderRadius: 24,
                      maxHeight: 470,
                    }}
                  >
                    <MarketplacePanel />
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/*
            ─── Tabs / message shell ───
            This always remains the chat shell. The marketplace is a separate
            panel rendered above it, never inside it.
          */}
          <motion.div
            data-clui-ui
            className="overflow-hidden flex flex-col drag-region"
            animate={{
              width: isExpanded ? cardExpandedWidth : cardCollapsedWidth,
              marginBottom: isExpanded ? 10 : -14,
              marginLeft: isExpanded ? 0 : cardCollapsedMargin,
              marginRight: isExpanded ? 0 : cardCollapsedMargin,
              background: isExpanded ? colors.containerBg : colors.containerBgCollapsed,
              borderColor: colors.containerBorder,
              boxShadow: isExpanded ? colors.cardShadow : colors.cardShadowCollapsed,
            }}
            transition={TRANSITION}
            style={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: 20,
              position: 'relative',
              zIndex: isExpanded ? 20 : 10,
            }}
          >
            {/* Top row: tabs + action controls */}
            <div
              className="no-drag"
              style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8 }}
            >
              <div data-tour="tabs" style={{ flex: 1, minWidth: 0 }}>
                <TabStrip />
              </div>
              <div data-tour="left-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className="glass-surface"
                  title="Attach file"
                  onClick={handleAttachFile}
                  disabled={isRunning}
                  style={topActionBtnStyle(colors, isRunning)}
                >
                  <Paperclip size={14} />
                </button>
                <button
                  className="glass-surface"
                  title="Take screenshot"
                  onClick={handleScreenshot}
                  disabled={isRunning}
                  style={topActionBtnStyle(colors, isRunning)}
                >
                  <Camera size={14} />
                </button>
                <button
                  className="glass-surface"
                  title="OpenClaw Control Center"
                  onClick={() => useSessionStore.getState().openControlCenter('agents')}
                  disabled={isRunning}
                  style={topActionBtnStyle(colors, isRunning)}
                >
                  <HeadCircuit size={14} />
                </button>
                <button
                  className="glass-surface"
                  title="Community Skill Sets"
                  onClick={() => useSessionStore.getState().toggleMarketplace()}
                  disabled={isRunning}
                  style={topActionBtnStyle(colors, isRunning)}
                >
                  <Sparkle size={14} />
                </button>
              </div>
            </div>

            {/* Body — chat history only; the marketplace is a separate overlay above */}
            <motion.div
              initial={false}
              animate={{
                height: isExpanded ? 'auto' : 0,
                opacity: isExpanded ? 1 : 0,
              }}
              transition={TRANSITION}
              className="overflow-hidden no-drag"
            >
              <div style={{ maxHeight: bodyMaxHeight }}>
                <ConversationView />
                <StatusBar />
              </div>
            </motion.div>
          </motion.div>

          {/* Input row */}
          <div data-clui-ui className="relative" style={{ minHeight: 46, zIndex: 25, marginBottom: 10 }}>
            {/* Input pill */}
            <div
              data-clui-ui
              data-tour="input"
              className="glass-surface w-full"
              style={{ minHeight: 50, borderRadius: 25, padding: '0 6px 0 16px', background: colors.inputPillBg }}
            >
              <InputBar />
            </div>
          </div>
        </div>
      </div>
      <GuidedTourOverlay
        open={tourOpen}
        steps={tourSteps}
        stepIndex={tourStep}
        onPrev={() => setTourStep((s) => Math.max(0, s - 1))}
        onNext={() => {
          if (tourStep >= tourSteps.length - 1) {
            setTourOpen(false)
            localStorage.setItem('openclaw-onboarding-complete', '1')
            localStorage.setItem('openclaw-onboarding-dismissed', '1')
            return
          }
          setTourStep((s) => Math.min(tourSteps.length - 1, s + 1))
        }}
        onClose={() => setTourOpen(false)}
      />
    </PopoverLayerProvider>
  )
}

function topActionBtnStyle(colors: ReturnType<typeof useColors>, disabled: boolean): React.CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: `1px solid ${colors.containerBorder}`,
    background: colors.surfacePrimary,
    color: disabled ? colors.textTertiary : colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
