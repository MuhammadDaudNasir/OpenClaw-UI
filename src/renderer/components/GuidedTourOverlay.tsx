import React, { useEffect, useMemo, useState } from 'react'
import { X } from '@phosphor-icons/react'
import { useColors } from '../theme'

export interface TourStep {
  id: string
  title: string
  body: string
  selector: string
}

export function GuidedTourOverlay({
  open,
  steps,
  stepIndex,
  onNext,
  onPrev,
  onClose,
}: {
  open: boolean
  steps: TourStep[]
  stepIndex: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}) {
  const colors = useColors()
  const current = steps[stepIndex]
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!open || !current) return
    const update = () => {
      const el = document.querySelector(current.selector) as HTMLElement | null
      setRect(el ? el.getBoundingClientRect() : null)
    }
    update()
    window.addEventListener('resize', update)
    const t = setInterval(update, 220)
    return () => {
      window.removeEventListener('resize', update)
      clearInterval(t)
    }
  }, [open, current])

  const cardPos = useMemo(() => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    const top = Math.min(window.innerHeight - 180, rect.bottom + 12)
    const left = Math.min(window.innerWidth - 330, Math.max(12, rect.left))
    return { top, left }
  }, [rect])

  if (!open || !current) return null

  return (
    <div
      data-clui-ui
      className="no-drag"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.26)',
        zIndex: 120,
        pointerEvents: 'auto',
      }}
    >
      {rect && (
        <div
          style={{
            position: 'fixed',
            left: rect.left - 4,
            top: rect.top - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            borderRadius: 12,
            border: `2px solid ${colors.accent}`,
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.28)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          ...cardPos,
          width: 318,
          borderRadius: 14,
          border: `1px solid ${colors.containerBorder}`,
          background: colors.containerBg,
          boxShadow: colors.cardShadow,
          padding: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }}>{current.title}</div>
            <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>
              Step {stepIndex + 1} of {steps.length}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textTertiary, cursor: 'pointer' }}>
            <X size={13} />
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: colors.textSecondary, lineHeight: 1.45 }}>
          {current.body}
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onPrev} disabled={stepIndex === 0} style={btn(colors, stepIndex === 0)}>
            Back
          </button>
          <button onClick={onNext} style={primary(colors)}>
            {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

function btn(colors: ReturnType<typeof useColors>, disabled: boolean): React.CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 600,
    padding: '5px 8px',
    borderRadius: 7,
    border: `1px solid ${colors.containerBorder}`,
    background: colors.surfacePrimary,
    color: disabled ? colors.textTertiary : colors.textSecondary,
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
  }
}

function primary(colors: ReturnType<typeof useColors>): React.CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 700,
    padding: '5px 9px',
    borderRadius: 7,
    border: `1px solid ${colors.accentBorder}`,
    background: colors.accentLight,
    color: colors.accent,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}
