import React, { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Play, X, ArrowsClockwise, Trash } from '@phosphor-icons/react'
import { useColors } from '../theme'
import { useSessionStore } from '../stores/sessionStore'

type NodeKind =
  | 'trigger'
  | 'planner'
  | 'time_window'
  | 'schedule'
  | 'condition'
  | 'switch'
  | 'context_handoff'
  | 'tool_profile'
  | 'permission_gate'
  | 'search_reddit'
  | 'search_web'
  | 'memory_read'
  | 'memory_write'
  | 'action_run'
  | 'retry_backoff'
  | 'completion_check'
  | 'notify'
  | 'fallback'

type SkillNode = {
  id: string
  kind: NodeKind
  x: number
  y: number
  value: string
}

type SkillEdge = {
  id: string
  from: string
  to: string
}

const NODE_META: Record<NodeKind, { label: string; color: string; placeholder: string }> = {
  trigger: { label: 'Trigger', color: '#5aa4ff', placeholder: 'What starts this flow?' },
  planner: { label: 'Planner', color: '#ff7a45', placeholder: 'Deterministic plan strategy...' },
  time_window: { label: 'Time Window', color: '#34c759', placeholder: 'Allowed time range...' },
  schedule: { label: 'Schedule', color: '#20b26b', placeholder: 'Cron / daily / weekly...' },
  condition: { label: 'If Condition', color: '#ef5350', placeholder: 'Condition expression...' },
  switch: { label: 'Switch Branch', color: '#ff4d4f', placeholder: 'Case routing rules...' },
  context_handoff: { label: 'Context Handoff', color: '#00c2d1', placeholder: 'What context to pass?' },
  tool_profile: { label: 'Tool Profile', color: '#a970ff', placeholder: 'messaging/full/custom...' },
  permission_gate: { label: 'Permission Gate', color: '#ff6ab3', placeholder: 'Approval policy...' },
  search_reddit: { label: 'Search Reddit', color: '#4f8cff', placeholder: 'Reddit query/source...' },
  search_web: { label: 'Search Web', color: '#3e92cc', placeholder: 'Web query/domain...' },
  memory_read: { label: 'Memory Read', color: '#f6c945', placeholder: 'Load state/ref data...' },
  memory_write: { label: 'Memory Write', color: '#e0a800', placeholder: 'Persist outputs/state...' },
  action_run: { label: 'Action', color: '#ff9f43', placeholder: 'Main operation/task...' },
  retry_backoff: { label: 'Retry/Backoff', color: '#ff5f87', placeholder: 'Retry count & delay...' },
  completion_check: { label: 'Completion Check', color: '#ff5252', placeholder: 'Done criteria...' },
  notify: { label: 'Notify', color: '#2dd4bf', placeholder: 'Who/where to notify...' },
  fallback: { label: 'Fallback', color: '#9aa4b2', placeholder: 'Fallback path...' },
}

function makeNode(kind: NodeKind, x: number, y: number): SkillNode {
  return { id: crypto.randomUUID(), kind, x, y, value: '' }
}

export function SkillBuilderPanel() {
  const colors = useColors()
  const closeSkillBuilder = useSessionStore((s) => s.closeSkillBuilder)
  const sendMessage = useSessionStore((s) => s.sendMessage)

  // Start empty on open — user explicitly composes the flow.
  const [nodes, setNodes] = useState<SkillNode[]>([])
  const [edges, setEdges] = useState<SkillEdge[]>([])

  const [viewport, setViewport] = useState({ x: 0, y: 0 })
  const [mouseCanvas, setMouseCanvas] = useState({ x: 0, y: 0 })
  const [linkFrom, setLinkFrom] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<
  | { mode: 'node'; id: string; dx: number; dy: number }
  | { mode: 'pan'; startX: number; startY: number; baseX: number; baseY: number }
  | null
  >(null)

  const onMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      setMouseCanvas({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
    if (!dragRef.current) return
    if (dragRef.current.mode === 'node') {
      const { id, dx, dy } = dragRef.current
      setNodes((prev) => prev.map((n) => (n.id === id
        ? { ...n, x: Math.max(-2000, e.clientX - viewport.x - dx), y: Math.max(-2000, e.clientY - viewport.y - dy) }
        : n)))
      return
    }
    const { startX, startY, baseX, baseY } = dragRef.current
    setViewport({
      x: baseX + (e.clientX - startX),
      y: baseY + (e.clientY - startY),
    })
  }

  const onMouseUp = () => {
    dragRef.current = null
  }

  const resetLayout = () => {
    setNodes([])
    setEdges([])
    setLinkFrom(null)
    setViewport({ x: 0, y: 0 })
  }

  const addNode = (kind: NodeKind) => {
    const idx = nodes.length
    setNodes((prev) => [...prev, makeNode(kind, 80 + (idx % 4) * 240 - viewport.x, 80 + Math.floor(idx / 4) * 170 - viewport.y)])
  }

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const prompt = useMemo(() => {
    if (nodes.length === 0) {
      return [
        'Build me an OpenClaw skill scaffold.',
        'No nodes are configured yet; propose a sensible default workflow and ask clarifying questions.',
      ].join('\n')
    }

    const ids = new Map(nodes.map((n, i) => [n.id, `N${i + 1}`]))
    const nodeLines = nodes.map((n) => {
      const tag = ids.get(n.id) || n.id
      const meta = NODE_META[n.kind]
      const value = n.value.trim() || '(not configured)'
      return `${tag} [${meta.label}] ${value}`
    })

    const edgeLines = edges
      .map((e) => {
        const from = ids.get(e.from)
        const to = ids.get(e.to)
        if (!from || !to) return null
        return `${from} -> ${to}`
      })
      .filter((v): v is string => !!v)

    return [
      'Build an OpenClaw skill from this visual graph.',
      'Return: 1) skill architecture, 2) node-to-step mapping, 3) implementation sketch, 4) usage examples.',
      '',
      'Nodes:',
      ...nodeLines.map((l) => `- ${l}`),
      '',
      'Connections:',
      ...(edgeLines.length > 0 ? edgeLines.map((l) => `- ${l}`) : ['- (no explicit links; infer a sensible order)']),
      '',
      'Rules:',
      '- Preserve branching semantics when Condition/Switch exists.',
      '- Time/Schedule gates must execute before Action nodes.',
      '- Completion Check and Fallback must be explicit.',
      '- If graph is incomplete, state assumptions clearly.',
    ].join('\n')
  }, [nodes, edges])

  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id))
    setLinkFrom((curr) => (curr === id ? null : curr))
  }

  const createLink = (from: string, to: string) => {
    if (from === to) return
    setEdges((prev) => {
      if (prev.some((e) => e.from === from && e.to === to)) return prev
      return [...prev, { id: crypto.randomUUID(), from, to }]
    })
  }

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

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px 0' }}>
        {(Object.keys(NODE_META) as NodeKind[]).map((kind) => (
          <button
            key={kind}
            onClick={() => addNode(kind)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px]"
            style={{ border: `1px solid ${colors.containerBorder}`, color: colors.textSecondary }}
          >
            <Plus size={11} />
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: NODE_META[kind].color }} />
            {NODE_META[kind].label}
          </button>
        ))}
      </div>

      <div
        ref={canvasRef}
        className="relative"
        style={{ flex: 1, margin: 12, border: `1px solid ${colors.containerBorder}`, borderRadius: 14, overflow: 'hidden', background: colors.surfacePrimary }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            dragRef.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, baseX: viewport.x, baseY: viewport.y }
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${colors.containerBorder}22 1px, transparent 1px), linear-gradient(90deg, ${colors.containerBorder}22 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
            pointerEvents: 'none',
          }}
        />
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {edges.map((edge) => {
            const from = nodeById.get(edge.from)
            const to = nodeById.get(edge.to)
            if (!from || !to) return null
            const x1 = from.x + viewport.x + 198
            const y1 = from.y + viewport.y + 34
            const x2 = to.x + viewport.x + 2
            const y2 = to.y + viewport.y + 34
            return (
              <motion.path
                key={edge.id}
                d={`M ${x1} ${y1} C ${x1 + 70} ${y1}, ${x2 - 70} ${y2}, ${x2} ${y2}`}
                stroke={colors.containerBorder}
                fill="none"
                strokeWidth={2}
                initial={{ pathLength: 0, opacity: 0.3 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.22 }}
              />
            )
          })}
          {linkFrom && nodeById.get(linkFrom) && (
            <path
              d={`M ${nodeById.get(linkFrom)!.x + viewport.x + 198} ${nodeById.get(linkFrom)!.y + viewport.y + 34} C ${nodeById.get(linkFrom)!.x + viewport.x + 268} ${nodeById.get(linkFrom)!.y + viewport.y + 34}, ${mouseCanvas.x - 70} ${mouseCanvas.y}, ${mouseCanvas.x} ${mouseCanvas.y}`}
              stroke={colors.accent}
              fill="none"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}
        </svg>

        <AnimatePresence>
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute rounded-lg"
            style={{ left: node.x + viewport.x, top: node.y + viewport.y, width: 200, border: `1px solid ${colors.containerBorder}`, background: colors.containerBg, boxShadow: colors.cardShadow }}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.16 }}
          >
            <div
              className="px-2 py-1.5 text-[11px] font-semibold cursor-move"
              style={{ borderBottom: `1px solid ${colors.containerBorder}`, color: colors.textPrimary }}
              onMouseDown={(e) => {
                e.stopPropagation()
                dragRef.current = { mode: 'node', id: node.id, dx: e.clientX - (node.x + viewport.x), dy: e.clientY - (node.y + viewport.y) }
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: NODE_META[node.kind].color }} />
                {NODE_META[node.kind].label}
              </span>
              <span className="inline-flex items-center gap-1">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeNode(node.id)
                  }}
                  className="w-5 h-5 rounded inline-flex items-center justify-center"
                  style={{ color: colors.textTertiary }}
                  title="Delete node"
                >
                  <Trash size={11} />
                </button>
              </span>
            </div>
            <div className="p-2">
              <input
                value={node.value}
                placeholder={NODE_META[node.kind].placeholder}
                onChange={(e) => {
                  const value = e.target.value
                  setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...n, value } : n)))
                }}
                className="w-full bg-transparent text-[11px] outline-none"
                style={{ color: colors.textPrimary }}
              />
            </div>
            <button
              className="absolute -left-2 top-[28px] w-3 h-3 rounded-full"
              style={{ background: colors.surfaceHover, border: `1px solid ${colors.containerBorder}` }}
              title="Link target (input)"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                if (linkFrom) {
                  createLink(linkFrom, node.id)
                  setLinkFrom(null)
                }
              }}
            />
            <button
              className="absolute -right-2 top-[28px] w-3 h-3 rounded-full"
              style={{ background: linkFrom === node.id ? colors.accent : NODE_META[node.kind].color, border: `1px solid ${colors.containerBorder}` }}
              title="Link source (output)"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                setLinkFrom((curr) => (curr === node.id ? null : node.id))
              }}
            />
          </motion.div>
        ))}
        </AnimatePresence>
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
