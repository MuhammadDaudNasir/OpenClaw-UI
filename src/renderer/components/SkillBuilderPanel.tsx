import React, { useMemo, useRef, useState } from 'react'
import { Plus, Play, X, ArrowsClockwise } from '@phosphor-icons/react'
import { useColors } from '../theme'
import { useSessionStore } from '../stores/sessionStore'

type NodeKind = 'time' | 'what' | 'when' | 'where' | 'search' | 'action'

type SkillNode = {
  id: string
  kind: NodeKind
  x: number
  y: number
  value: string
}

const NODE_LABEL: Record<NodeKind, string> = {
  time: 'Time',
  what: 'What',
  when: 'When',
  where: 'Where',
  search: 'Search',
  action: 'Action',
}

function makeNode(kind: NodeKind, x: number, y: number): SkillNode {
  return { id: crypto.randomUUID(), kind, x, y, value: '' }
}

export function SkillBuilderPanel() {
  const colors = useColors()
  const closeSkillBuilder = useSessionStore((s) => s.closeSkillBuilder)
  const sendMessage = useSessionStore((s) => s.sendMessage)

  const [nodes, setNodes] = useState<SkillNode[]>([
    makeNode('when', 60, 80),
    makeNode('time', 300, 80),
    makeNode('what', 540, 80),
    makeNode('where', 60, 260),
    makeNode('search', 300, 260),
    makeNode('action', 540, 260),
  ])

  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null)

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return
    const { id, dx, dy } = dragRef.current
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: Math.max(12, e.clientX - dx), y: Math.max(12, e.clientY - dy) } : n)))
  }

  const onMouseUp = () => {
    dragRef.current = null
  }

  const resetLayout = () => {
    setNodes([
      makeNode('when', 60, 80),
      makeNode('time', 300, 80),
      makeNode('what', 540, 80),
      makeNode('where', 60, 260),
      makeNode('search', 300, 260),
      makeNode('action', 540, 260),
    ])
  }

  const addNode = (kind: NodeKind) => {
    const idx = nodes.length
    setNodes((prev) => [...prev, makeNode(kind, 60 + (idx % 3) * 240, 80 + Math.floor(idx / 3) * 180)])
  }

  const prompt = useMemo(() => {
    const parts = nodes
      .map((n) => ({ label: NODE_LABEL[n.kind], value: n.value.trim() }))
      .filter((n) => n.value.length > 0)
      .map((n) => `${n.label}: ${n.value}`)
    if (parts.length === 0) return 'Build me an OpenClaw skill from this node flow.'
    return [
      'Build me an OpenClaw skill using this node flow:',
      ...parts.map((p) => `- ${p}`),
      'Generate the skill structure, execution logic, and usage notes.',
    ].join('\n')
  }, [nodes])

  return (
    <div data-clui-ui style={{ height: 560, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${colors.containerBorder}` }}>
        <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600 }}>Visual Skill Builder</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={resetLayout} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{ border: `1px solid ${colors.containerBorder}`, color: colors.textSecondary }}>
            <ArrowsClockwise size={12} />
            Reset
          </button>
          <button onClick={closeSkillBuilder} className="w-7 h-7 rounded-md inline-flex items-center justify-center" style={{ border: `1px solid ${colors.containerBorder}`, color: colors.textSecondary }}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, padding: '10px 16px 0' }}>
        {(['time', 'what', 'when', 'where', 'search', 'action'] as NodeKind[]).map((kind) => (
          <button
            key={kind}
            onClick={() => addNode(kind)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px]"
            style={{ border: `1px solid ${colors.containerBorder}`, color: colors.textSecondary }}
          >
            <Plus size={11} />
            {NODE_LABEL[kind]}
          </button>
        ))}
      </div>

      <div
        className="relative"
        style={{ flex: 1, margin: 12, border: `1px solid ${colors.containerBorder}`, borderRadius: 14, overflow: 'hidden', background: colors.surfacePrimary }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {nodes.slice(1).map((node, i) => {
            const prev = nodes[i]
            const x1 = prev.x + 92
            const y1 = prev.y + 34
            const x2 = node.x + 10
            const y2 = node.y + 34
            return <path key={`${prev.id}-${node.id}`} d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`} stroke={colors.containerBorder} fill="none" strokeWidth={1.5} />
          })}
        </svg>

        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute rounded-lg"
            style={{ left: node.x, top: node.y, width: 180, border: `1px solid ${colors.containerBorder}`, background: colors.containerBg, boxShadow: colors.cardShadow }}
          >
            <div
              className="px-2 py-1.5 text-[11px] font-semibold cursor-move"
              style={{ borderBottom: `1px solid ${colors.containerBorder}`, color: colors.textPrimary }}
              onMouseDown={(e) => {
                dragRef.current = { id: node.id, dx: e.clientX - node.x, dy: e.clientY - node.y }
              }}
            >
              {NODE_LABEL[node.kind]}
            </div>
            <div className="p-2">
              <input
                value={node.value}
                placeholder={`Configure ${NODE_LABEL[node.kind].toLowerCase()}...`}
                onChange={(e) => {
                  const value = e.target.value
                  setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, value } : n)))
                }}
                className="w-full bg-transparent text-[11px] outline-none"
                style={{ color: colors.textPrimary }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>Generated Skill Prompt</div>
        <div className="rounded-md p-2 text-[11px] whitespace-pre-wrap" style={{ border: `1px solid ${colors.containerBorder}`, color: colors.textPrimary, background: colors.surfacePrimary, maxHeight: 92, overflow: 'auto' }}>
          {prompt}
        </div>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => sendMessage(prompt)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px]"
            style={{ border: `1px solid ${colors.containerBorder}`, background: colors.accent, color: colors.textOnAccent }}
          >
            <Play size={11} weight="fill" />
            Ask OpenClaw To Build Skill
          </button>
        </div>
      </div>
    </div>
  )
}
