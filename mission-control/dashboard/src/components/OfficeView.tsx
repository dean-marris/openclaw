'use client'
import { useEffect, useState } from 'react'

/* ─── Agent roster ─── */
const AGENTS = {
  ejp:   { name: 'EJP',   emoji: '📊', color: '#3b82f6', model: 'claude-sonnet-4-6', role: 'Finance & Tax Orchestrator' },
  quill: { name: 'Quill', emoji: '🪶', color: '#a78bfa', model: 'claude-sonnet-4-6', role: 'Tax Specialist' },
  flint: { name: 'Flint', emoji: '🔥', color: '#f59e0b', model: 'claude-sonnet-4-6', role: 'Investment Portfolio' },
  jack:  { name: 'Jack',  emoji: '🤖', color: '#10b981', model: 'claude-sonnet-4-6', role: 'Coding Agent' },
} as const

type AgentKey = keyof typeof AGENTS
type AgentInfo = typeof AGENTS[AgentKey]

const AGENT_PATHS: Record<AgentKey, string> = {
  ejp:   '~/.openclaw/workspace/',
  quill: 'marris_openclaw/agents/tax-agent/',
  flint: 'marris_openclaw/agents/flint/',
  jack:  'marris_openclaw/jack-workspace/',
}

const FILE_TABS = ['SOUL.md', 'AGENTS.md', 'TOOLS.md', 'IDENTITY.md', 'SKILLS.md'] as const
type FileTab = typeof FILE_TABS[number]

/* ─── Pixel character ─── */
function PixelChar({ agent, active, label }: { agent: AgentInfo; active: boolean; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`relative w-8 h-8 flex items-center justify-center text-xl rounded transition-all duration-500 ${
        active ? 'animate-bounce' : ''
      }`} style={{ filter: active ? `drop-shadow(0 0 6px ${agent.color})` : 'none' }}>
        {agent.emoji}
        {active && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 border border-[#0f1117] animate-pulse" />
        )}
      </div>
      {label && <span className="text-[9px] font-bold" style={{ color: agent.color }}>{label}</span>}
    </div>
  )
}

/* ─── Desk ─── */
function Desk({ agent, agentKey, active }: { agent: AgentInfo; agentKey: AgentKey; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 transition-all duration-500">
      <div className="w-24 h-20 rounded-xl border-2 flex items-end justify-center pb-2 transition-all duration-500"
        style={{
          borderColor: active ? agent.color : '#2d3748',
          background: active ? agent.color + '55' : '#161b27',
          boxShadow: active ? `0 0 20px ${agent.color}60` : 'none',
        }}>
        <div className="w-10 h-7 rounded border-2 flex items-center justify-center text-base transition-all duration-300"
          style={{
            borderColor: active ? agent.color : '#374151',
            background: active ? agent.color + '30' : '#0f1117',
          }}>
          {active ? '💻' : '🖥️'}
        </div>
      </div>
      <PixelChar agent={agent} active={active} label={agent.name} />
      <span className="text-[9px] text-[#4a5568] uppercase tracking-wider">{agentKey} desk</span>
    </div>
  )
}

/* ─── Status badge ─── */
function StatusBadge({ agent, agentKey, active }: { agent: AgentInfo; agentKey: AgentKey; active: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-all`}
      style={active ? {
        borderColor: agent.color + '60',
        background: agent.color + '15',
        color: agent.color,
      } : {
        borderColor: '#2d3748',
        background: '#161b27',
        color: '#4a5568',
      }}>
      <span className={`w-1.5 h-1.5 rounded-full`}
        style={{ background: active ? agent.color : '#374151' }} />
      {agent.name}
    </div>
  )
}

/* ─── Agent files panel ─── */
function AgentFilesPanel() {
  const [selectedAgent, setSelectedAgent] = useState<AgentKey | null>(null)
  const [activeFile, setActiveFile] = useState<FileTab>('SOUL.md')
  const [content, setContent] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedAgent) { setContent(null); return }
    setLoading(true)
    setFileError(null)
    setContent(null)
    fetch(`/api/agent-files?agent=${selectedAgent}&file=${activeFile}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setFileError(data.error)
        else setContent(data.content)
      })
      .catch(() => setFileError('Failed to fetch file'))
      .finally(() => setLoading(false))
  }, [selectedAgent, activeFile])

  const sel = selectedAgent ? AGENTS[selectedAgent] : null

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-white mb-4">📁 Agent Files</h3>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left: agent list */}
        <div className="md:w-64 flex-shrink-0 space-y-2">
          {(Object.entries(AGENTS) as [AgentKey, AgentInfo][]).map(([key, agent]) => (
            <button
              key={key}
              onClick={() => { setSelectedAgent(key); setActiveFile('SOUL.md') }}
              className="w-full text-left px-4 py-3 rounded-xl border transition-all"
              style={selectedAgent === key ? {
                borderColor: agent.color + '60',
                background: agent.color + '10',
              } : {
                borderColor: '#2d3748',
                background: '#1e2230',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{agent.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{agent.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0f1117] border border-[#2d3748] text-[#718096] font-mono">
                      {agent.model}
                    </span>
                  </div>
                  <p className="text-xs text-[#718096] mt-0.5">{agent.role}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: file viewer */}
        <div className="flex-1 min-w-0">
          {!selectedAgent || !sel ? (
            <div className="flex items-center justify-center h-48 border border-[#2d3748] rounded-xl bg-[#1e2230]">
              <p className="text-sm text-[#4a5568]">Select an agent to view their config files</p>
            </div>
          ) : (
            <div className="border border-[#2d3748] rounded-xl bg-[#1e2230] overflow-hidden">
              {/* File tabs */}
              <div className="flex border-b border-[#2d3748] overflow-x-auto">
                {FILE_TABS.map(file => (
                  <button
                    key={file}
                    onClick={() => setActiveFile(file)}
                    className="px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors"
                    style={activeFile === file ? {
                      color: sel.color,
                      borderBottom: `2px solid ${sel.color}`,
                      background: sel.color + '08',
                    } : { color: '#718096' }}
                  >
                    {file}
                  </button>
                ))}
              </div>

              {/* Content area */}
              <div className="p-4 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <svg className="animate-spin h-6 w-6" style={{ color: sel.color }} viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : fileError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#4a5568]">📄 {fileError}</p>
                    <p className="text-xs text-[#374151] mt-1">{AGENT_PATHS[selectedAgent]}{activeFile}</p>
                  </div>
                ) : content ? (
                  <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed break-words">
                    {content}
                  </pre>
                ) : null}
              </div>

              {/* Edit hint */}
              <div className="px-4 py-2 border-t border-[#2d3748] bg-[#161925]">
                <p className="text-[10px] text-[#4a5568]">
                  ✏️ {AGENT_PATHS[selectedAgent]}{activeFile}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main OfficeView ─── */
export function OfficeView() {
  const [status, setStatus] = useState<Record<string, { active: boolean }> | null>(null)
  const [lastUpdate, setLastUpdate] = useState('')
  const [demo, setDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agent-status')
      const data = await res.json()
      setStatus(data?.agents ?? null)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(fetchStatus, 5000)
    return () => clearInterval(iv)
  }, [])

  // Demo sequence: light up each agent one by one, then all together, then off
  useEffect(() => {
    if (!demo) { setDemoStep(0); return }
    const steps = [1, 2, 3, 4, 5, 6]
    let i = 0
    const iv = setInterval(() => {
      i++
      setDemoStep(i)
      if (i >= steps.length) { clearInterval(iv); setTimeout(() => { setDemo(false); setDemoStep(0) }, 1200) }
    }, 700)
    return () => clearInterval(iv)
  }, [demo])

  const ejpActive   = demo ? demoStep >= 1 : (status?.ejp?.active   ?? false)
  const quillActive = demo ? demoStep >= 2 : (status?.quill?.active  ?? false)
  const flintActive = demo ? demoStep >= 3 : (status?.flint?.active  ?? false)
  const jackActive  = demo ? demoStep >= 4 : (status?.jack?.active   ?? false)
  const anyActive   = ejpActive || quillActive || flintActive || jackActive

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">🏢 The Office</h2>
          <p className="text-xs text-[#718096] mt-0.5">Live agent status — refreshes every 5s</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge agent={AGENTS.ejp}   agentKey="ejp"   active={ejpActive} />
          <StatusBadge agent={AGENTS.quill} agentKey="quill" active={quillActive} />
          <StatusBadge agent={AGENTS.flint} agentKey="flint" active={flintActive} />
          <StatusBadge agent={AGENTS.jack}  agentKey="jack"  active={jackActive} />
          {lastUpdate && <span className="text-[10px] text-[#374151] ml-1">↻ {lastUpdate}</span>}
          <button
            onClick={() => setDemo(true)}
            disabled={demo}
            className="ml-2 px-3 py-1 rounded-lg text-xs font-medium border transition-all disabled:opacity-50"
            style={{ borderColor: '#2d3748', background: '#1e2230', color: '#718096' }}
          >
            {demo ? '🎬 Running...' : '🎬 Demo'}
          </button>
        </div>
      </div>

      {/* Office floor plan */}
      <div className="bg-[#0c0f18] border border-[#1e2230] rounded-2xl p-6 relative overflow-hidden">
        {/* Floor grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)' }} />

        <div className="absolute top-3 left-4 text-[10px] text-[#1e2a3a] uppercase tracking-widest font-bold">Marris Mission Control HQ</div>

        {/* Workstations — 4 agents in a row */}
        <div className="mt-4">
          <p className="text-[10px] text-[#2d3748] uppercase tracking-widest mb-5 pl-1">— Workstations —</p>
          <div className="flex justify-around items-end flex-wrap gap-6">
            <Desk agent={AGENTS.ejp}   agentKey="ejp"   active={ejpActive} />
            <Desk agent={AGENTS.quill} agentKey="quill" active={quillActive} />
            <Desk agent={AGENTS.flint} agentKey="flint" active={flintActive} />
            <Desk agent={AGENTS.jack}  agentKey="jack"  active={jackActive} />
          </div>
        </div>

        {/* Status bar */}
        <div className="border-t border-[#1e2230] pt-4 mt-6 flex items-center gap-3 flex-wrap">
          {!anyActive && <span className="text-xs text-[#374151]">💤 All agents idle</span>}
          {ejpActive   && <span className="text-xs" style={{ color: AGENTS.ejp.color }}>📊 EJP active</span>}
          {quillActive && <span className="text-xs" style={{ color: AGENTS.quill.color }}>🪶 Quill working on taxes</span>}
          {flintActive && <span className="text-xs" style={{ color: AGENTS.flint.color }}>🔥 Flint tracking investments</span>}
          {jackActive  && <span className="text-xs" style={{ color: AGENTS.jack.color }}>🤖 Jack coding</span>}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(AGENTS) as [AgentKey, AgentInfo][]).map(([key, agent]) => (
          <div key={key} className="bg-[#1e2230] border border-[#2d3748] rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">{agent.emoji}</span>
            <div>
              <div className="text-sm font-semibold text-white">{agent.name}</div>
              <div className="text-xs text-[#718096]">{agent.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Files Panel */}
      <AgentFilesPanel />
    </div>
  )
}
