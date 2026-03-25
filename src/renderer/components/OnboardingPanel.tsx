import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RocketLaunch, Terminal, FolderOpen, Wrench, X, Key, Plugs, Compass, ArrowRight, ArrowLeft, Check, Keyboard } from '@phosphor-icons/react'
import { useColors } from '../theme'

interface OnboardingInfo {
  version: string
  email: string | null
  homePath: string
  cliCommand: string
  authSupported: boolean
}

export function OnboardingPanel({
  info,
  onOpenTerminal,
  onPickWorkspace,
  onOpenMarketplace,
  onOpenControlCenter,
  onStartTour,
  onDismiss,
}: {
  info: OnboardingInfo
  onOpenTerminal: () => void
  onPickWorkspace: () => void
  onOpenMarketplace: () => void
  onOpenControlCenter: () => void
  onStartTour: () => void
  onDismiss: () => void
}) {
  const colors = useColors()
  const [step, setStep] = useState(0)

  const versionKnown = !!info.version && info.version !== 'unknown'
  const hasAuth = !!info.email || !info.authSupported
  const statusReady = versionKnown && hasAuth

  const [provider, setProvider] = useState('openai')
  const [providerOptions, setProviderOptions] = useState<string[]>([
    'openai',
    'anthropic',
    'google',
    'xai',
    'ollama',
    'openrouter',
  ])
  const [customProvider, setCustomProvider] = useState('')
  const [useCustomProvider, setUseCustomProvider] = useState(false)
  const [providerApiKey, setProviderApiKey] = useState('')
  const [selectedGateway, setSelectedGateway] = useState<'telegram' | 'discord' | 'whatsapp'>('telegram')
  const [discordToken, setDiscordToken] = useState('')
  const [telegramToken, setTelegramToken] = useState('')
  const [whatsappToken, setWhatsappToken] = useState('')
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkOutput, setLinkOutput] = useState<string | null>(null)

  const totalSteps = 6
  const progress = Math.round(((step + 1) / totalSteps) * 100)
  const canContinue = step < totalSteps - 1

  const maskedProviderKey = useMemo(() => {
    if (!providerApiKey) return 'Not saved'
    if (providerApiKey.length < 8) return 'Saved'
    return `${providerApiKey.slice(0, 4)}...${providerApiKey.slice(-3)}`
  }, [providerApiKey])

  const saveIntegrations = () => {
    const selectedProvider = useCustomProvider ? customProvider.trim() : provider
    const payload = {
      provider: selectedProvider || provider,
      providerApiKey,
      gateways: {
        preferred: selectedGateway,
        discordToken,
        telegramToken,
        whatsappToken,
      },
      savedAt: Date.now(),
    }
    localStorage.setItem('openclaw-onboarding-integrations-v1', JSON.stringify(payload))
  }

  const finishOnboarding = () => {
    saveIntegrations()
    localStorage.setItem('openclaw-onboarding-complete', '1')
    localStorage.setItem('openclaw-onboarding-dismissed', '1')
    onDismiss()
  }

  useEffect(() => {
    const loadProviderOptions = async () => {
      try {
        const info = await window.clui.openclawModelInfo()
        if (!info.ok) return
        const dynamic = info.providers.map((p) => p.id).filter(Boolean)
        const merged = Array.from(new Set([...dynamic, ...providerOptions]))
        setProviderOptions(merged)
        if (info.provider && merged.includes(info.provider)) setProvider(info.provider)
      } catch {}
    }
    void loadProviderOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      data-clui-ui
      className="glass-surface no-drag"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 20,
        padding: 14,
        border: `1px solid ${colors.containerBorder}`,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RocketLaunch size={16} style={{ color: colors.accent }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
              OpenClaw Onboarding
            </div>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              Connect your local CLI, workspace, and skills catalog.
            </div>
          </div>
        </div>
        <motion.button
          onClick={onDismiss}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{ background: 'none', border: 'none', color: colors.textTertiary, cursor: 'pointer' }}
          title="Dismiss onboarding"
        >
          <X size={14} />
        </motion.button>
      </div>

      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        <div style={{ fontSize: 10, color: colors.textTertiary }}>
          Step {step + 1} of {totalSteps} • {progress}% complete
        </div>
        <div style={{ height: 6, borderRadius: 99, background: colors.surfacePrimary, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: colors.accent, transition: 'width 0.2s ease' }} />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <Block title="Welcome" icon={<RocketLaunch size={13} />} colors={colors}>
                <div style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.45 }}>
                  This wizard configures OpenClaw and gives you a guided UI tour so first-run users can start fast.
                </div>
              </Block>
            )}

            {step === 1 && (
              <>
                <Step
                  done={versionKnown}
                  label="CLI detected"
                  detail={versionKnown ? `${info.cliCommand} ${info.version}` : `Install ${info.cliCommand} and ensure it is on PATH.`}
                  icon={<Terminal size={13} />}
                  colors={colors}
                  actionLabel="Open Terminal"
                  onAction={onOpenTerminal}
                />
                <Step
                  done={hasAuth}
                  label="Authentication"
                  detail={hasAuth ? (info.email ? `Signed in as ${info.email}` : 'Auth check not exposed by this CLI build.') : `Run ${info.cliCommand} once to sign in.`}
                  icon={<Wrench size={13} />}
                  colors={colors}
                  actionLabel={`Run ${info.cliCommand}`}
                  onAction={onOpenTerminal}
                />
                <Step
                  done={statusReady}
                  label="Workspace"
                  detail={`Select your project root (default: ${info.homePath}).`}
                  icon={<FolderOpen size={13} />}
                  colors={colors}
                  actionLabel="Choose Folder"
                  onAction={onPickWorkspace}
                />
              </>
            )}

            {step === 2 && (
              <Block title="Provider API Key" icon={<Key size={13} />} colors={colors}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    style={fieldStyle(colors)}
                    disabled={useCustomProvider}
                  >
                    {providerOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: colors.textSecondary }}>
                    <input type="checkbox" checked={useCustomProvider} onChange={(e) => setUseCustomProvider(e.target.checked)} />
                    Use custom provider id
                  </label>
                  {useCustomProvider && (
                    <input
                      type="text"
                      placeholder="e.g. groq, together, azure-openai"
                      value={customProvider}
                      onChange={(e) => setCustomProvider(e.target.value)}
                      style={fieldStyle(colors)}
                    />
                  )}
                  <input
                    type="password"
                    placeholder="Paste provider API key"
                    value={providerApiKey}
                    onChange={(e) => setProviderApiKey(e.target.value)}
                    style={fieldStyle(colors)}
                  />
                  <div style={{ fontSize: 10, color: colors.textTertiary }}>
                    Saved key: {maskedProviderKey}
                  </div>
                </div>
              </Block>
            )}

            {step === 3 && (
              <Block title="Gateway Integrations" icon={<Plugs size={13} />} colors={colors}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <select
                    value={selectedGateway}
                    onChange={(e) => {
                      setSelectedGateway(e.target.value as 'telegram' | 'discord' | 'whatsapp')
                      setLinkOutput(null)
                    }}
                    style={fieldStyle(colors)}
                  >
                    <option value="telegram">Telegram</option>
                    <option value="discord">Discord</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>

                  {selectedGateway === 'telegram' && (
                    <>
                      <div style={noteStyle(colors)}>
                        Telegram setup: open <strong>@BotFather</strong> in Telegram, run <code>/newbot</code>, then paste the token below.
                      </div>
                      <input type="password" placeholder="Telegram bot token" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} style={fieldStyle(colors)} />
                    </>
                  )}

                  {selectedGateway === 'discord' && (
                    <>
                      <div style={noteStyle(colors)}>
                        Discord setup: create an app in Discord Developer Portal, add a bot, then copy the bot token below.
                      </div>
                      <input type="password" placeholder="Discord bot token" value={discordToken} onChange={(e) => setDiscordToken(e.target.value)} style={fieldStyle(colors)} />
                    </>
                  )}

                  {selectedGateway === 'whatsapp' && (
                    <>
                      <div style={noteStyle(colors)}>
                        WhatsApp setup usually uses QR pairing. Click <strong>Start QR Link</strong>, then scan the terminal QR from your WhatsApp app.
                      </div>
                      <input type="password" placeholder="WhatsApp access token (optional / cloud mode)" value={whatsappToken} onChange={(e) => setWhatsappToken(e.target.value)} style={fieldStyle(colors)} />
                      <button
                        onClick={async () => {
                          setLinkBusy(true)
                          const res = await window.clui.openclawRun('gateway_link_whatsapp_qr')
                          setLinkOutput(res.ok ? (res.output || 'QR link command started.') : (res.error || res.output || 'QR link command failed.'))
                          setLinkBusy(false)
                          onOpenTerminal()
                        }}
                        style={smallBtn(colors)}
                      >
                        {linkBusy ? 'Starting...' : 'Start QR Link'}
                      </button>
                    </>
                  )}

                  {linkOutput && (
                    <div style={{ ...noteStyle(colors), whiteSpace: 'pre-wrap' }}>
                      {linkOutput}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={saveIntegrations} style={smallBtn(colors)}>Save Keys</button>
                    <button onClick={onOpenControlCenter} style={smallBtn(colors)}>Open Agent Controls</button>
                  </div>
                </div>
              </Block>
            )}

            {step === 4 && (
              <Block title="Shortcuts" icon={<Keyboard size={13} />} colors={colors}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <ShortcutRow keys="⌥ Space" action="Toggle launcher" colors={colors} />
                  <ShortcutRow keys="⌘ ⇧ K" action="Toggle launcher fallback" colors={colors} />
                  <ShortcutRow keys="⌘ ⇧ M" action="Open Community Skills" colors={colors} />
                  <ShortcutRow keys="⌘ ⇧ A" action="Open Agents Control Center" colors={colors} />
                  <ShortcutRow keys="⌘ ⇧ S" action="Open Settings Control Center" colors={colors} />
                  <ShortcutRow keys="⎋" action="Hide window" colors={colors} />
                </div>
              </Block>
            )}

            {step === 5 && (
              <Block title="UI Tour" icon={<Compass size={13} />} colors={colors}>
                <div style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.45 }}>
                  Start a guided walkthrough of tabs, quick settings, skills marketplace, and full control center.
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <button onClick={onStartTour} style={smallBtn(colors)}>Start Tour</button>
                  <button onClick={onOpenMarketplace} style={smallBtn(colors)}>Open Marketplace</button>
                </div>
              </Block>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={navBtn(colors, step === 0)}>
          <ArrowLeft size={12} /> Back
        </motion.button>
        <div style={{ display: 'flex', gap: 6 }}>
          {canContinue ? (
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))} style={primaryBtn(colors)}>
              Next <ArrowRight size={12} />
            </motion.button>
          ) : (
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={finishOnboarding} style={primaryBtn(colors)}>
              Finish <Check size={12} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function fieldStyle(colors: ReturnType<typeof useColors>): React.CSSProperties {
  return {
    width: '100%',
    fontSize: 11,
    borderRadius: 8,
    background: colors.surfacePrimary,
    color: colors.textPrimary,
    border: `1px solid ${colors.containerBorder}`,
    padding: '7px 9px',
    fontFamily: 'inherit',
  }
}

function noteStyle(colors: ReturnType<typeof useColors>): React.CSSProperties {
  return {
    fontSize: 10,
    color: colors.textSecondary,
    border: `1px solid ${colors.containerBorder}`,
    borderRadius: 8,
    background: colors.surfacePrimary,
    padding: '7px 9px',
    lineHeight: 1.45,
  }
}

function smallBtn(colors: ReturnType<typeof useColors>): React.CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 600,
    padding: '5px 8px',
    borderRadius: 7,
    border: `1px solid ${colors.containerBorder}`,
    background: colors.surfacePrimary,
    color: colors.textSecondary,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

function navBtn(colors: ReturnType<typeof useColors>, disabled: boolean): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: 8,
    border: `1px solid ${colors.containerBorder}`,
    background: colors.surfacePrimary,
    color: disabled ? colors.textTertiary : colors.textSecondary,
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  }
}

function primaryBtn(colors: ReturnType<typeof useColors>): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    padding: '6px 10px',
    borderRadius: 8,
    border: `1px solid ${colors.accentBorder}`,
    background: colors.accentLight,
    color: colors.accent,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  }
}

function Block({ title, icon, colors, children }: {
  title: string
  icon: React.ReactNode
  colors: ReturnType<typeof useColors>
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        border: `1px solid ${colors.containerBorder}`,
        borderRadius: 10,
        background: colors.surfaceHover,
        padding: '8px 10px',
      }}
    >
      <div style={{ fontSize: 11, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Step({
  done,
  label,
  detail,
  icon,
  colors,
  actionLabel,
  onAction,
}: {
  done: boolean
  label: string
  detail: string
  icon: React.ReactNode
  colors: ReturnType<typeof useColors>
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div
      style={{
        border: `1px solid ${colors.containerBorder}`,
        borderRadius: 10,
        background: colors.surfaceHover,
        padding: '8px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: done ? colors.statusComplete : colors.statusRunning }}>{done ? '●' : '○'}</span>
          {icon}
          <span>{label}</span>
        </div>
        <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {detail}
        </div>
      </div>
      <button
        onClick={onAction}
        style={{
          flexShrink: 0,
          fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 7,
          background: colors.surfacePrimary, color: colors.textSecondary,
          border: `1px solid ${colors.containerBorder}`, cursor: 'pointer',
        }}
      >
        {actionLabel}
      </button>
    </div>
  )
}

function ShortcutRow({
  keys,
  action,
  colors,
}: {
  keys: string
  action: string
  colors: ReturnType<typeof useColors>
}) {
  return (
    <div
      style={{
        border: `1px solid ${colors.containerBorder}`,
        borderRadius: 8,
        background: colors.surfaceHover,
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <code style={{ fontSize: 10, color: colors.textPrimary, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        {keys}
      </code>
      <span style={{ fontSize: 10, color: colors.textSecondary }}>
        {action}
      </span>
    </div>
  )
}
