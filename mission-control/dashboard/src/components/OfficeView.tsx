'use client'
import { useEffect, useState } from 'react'

type Position = 'desk' | 'meeting' | 'working'
type AgentState = { active: boolean; position: Position }
type Status = {
  agents: { ejp: AgentState; quill: AgentState; flint: AgentState }
  meeting: boolean
  timestamp: number
}

const AGENTS = {
  ejp:   { name: 'EJP',   emoji: '📊', color: '#3b82f6', deskPos: { x: 2, y: 1 } },
  quill: { name: 'Quill', emoji: '🪶', color: '#10b981', deskPos: { x: 6, y: 1 } },
  flint: { name: 'Flint', emoji: '🔥', color: '#f59e0b', deskPos: { x: 10, y: 1 } },
} as const

type AgentKey = keyof typeof AGENTS

// Pixel character component
function PixelChar({ agent, active, label }: { agent: typeof AGENTS[AgentKey]; active: boolean; label?: string }) {
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

// Desk component
function Desk({ agent, agentKey, occupied, active }: {
  agent: typeof AGENTS[AgentKey]; agentKey: AgentKey; occupied: boolean; active: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-16 h-12 rounded-lg border-2 flex items-end justify-center pb-1 transition-all duration-300 ${
        active ? 'border-green-400/60 bg-green-400/5' : 'border-[#2d3748] bg-[#161b27]'
      }`} style={{ borderColor: active ? agent.color + '80' : undefined }}>
        {/* Monitor */}
        <div className={`w-8 h-6 rounded border flex items-center justify-center text-xs transition-colors ${
          active ? 'border-current' : 'border-[#374151]'
        }`} style={{ borderColor: active ? agent.color + '60' : undefined, background: active ? agent.color + '15' : '#0f1117' }}>
          {active ? '💻' : '🖥️'}
        </div>
      </div>
      {occupied && <PixelChar agent={agent} active={active} label={agent.name} />}
      {!occupied && (
        <div className="w-8 h-8 rounded flex items-center justify-center text-[#374151] text-xs border border-[#1e2230]">
          ···
        </div>
      )}
      <span className="text-[9px] text-[#4a5568] uppercase tracking-wider">{agentKey} desk</span>
    </div>
  )
}

// Table component
function Table({ label, icon, agents: agentKeys, status, size = 'md' }: {
  label: string; icon: string; agents: AgentKey[]; status: Status | null; size?: 'sm' | 'md' | 'lg'
}) {
  const w = size === 'lg' ? 'w-48' : size === 'md' ? 'w-36' : 'w-24'
  const h = size === 'lg' ? 'h-20' : 'h-14'
  const anyActive = agentKeys.some(k => status?.agents[k]?.active)
  const atTable = agentKeys.filter(k => status?.agents[k]?.position !== 'desk')

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] text-[#718096] uppercase tracking-wider font-semibold">{label}</span>
      <div className={`${w} ${h} rounded-xl border-2 flex items-center justify-center gap-3 relative transition-all duration-300`}
        style={{
          borderColor: anyActive ? '#10b981' + '80' : '#2d3748',
          background: anyActive ? '#10b98108' : '#161b27'
        }}>
        <span className="text-lg opacity-30">{icon}</span>
        {atTable.map(k => (
          <PixelChar key={k} agent={AGENTS[k]} active={status?.agents[k]?.active ?? false} />
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-all ${
      active
        ? 'border-green-400/40 bg-green-400/10 text-green-400'
        : 'border-[#2d3748] bg-[#161b27] text-[#4a5568]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-[#374151]'}`} />
      {label}
    </div>
  )
}

export function OfficeView() {
  const [status, setStatus] = useState<Status | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agent-status')
      const data = await res.json()
      setStatus(data)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(fetchStatus, 5000)
    return () => clearInterval(iv)
  }, [])

  const ejp   = status?.agents.ejp
  const quill = status?.agents.quill
  const flint = status?.agents.flint

  const ejpAtDesk   = !ejp?.active   || ejp?.position   === 'desk'
  const quillAtDesk = !quill?.active || quill?.position === 'desk'
  const flintAtDesk = !flint?.active || flint?.position === 'desk'

  const atMeeting = [
    ...( status?.meeting && ejp?.active   ? ['ejp'   as AgentKey] : []),
    ...( status?.meeting && quill?.active ? ['quill' as AgentKey] : []),
    ...( status?.meeting && flint?.active ? ['flint' as AgentKey] : []),
  ]

  const ejpWorking   = ejp?.position   === 'working' && !status?.meeting
  const quillWorking = quill?.position === 'working' && !status?.meeting
  const flintWorking = flint?.position === 'working' && !status?.meeting

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">🏢 The Office</h2>
          <p className="text-xs text-[#718096] mt-0.5">Live agent status — refreshes every 5s</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge label="EJP"   active={ejp?.active   ?? false} />
          <StatusBadge label="Quill" active={quill?.active ?? false} />
          <StatusBadge label="Flint" active={flint?.active ?? false} />
          {lastUpdate && <span className="text-[10px] text-[#374151] ml-1">↻ {lastUpdate}</span>}
        </div>
      </div>

      {/* Office floor plan */}
      <div className="bg-[#0c0f18] border border-[#1e2230] rounded-2xl p-6 space-y-8 relative overflow-hidden">
        {/* Floor grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)' }} />

        {/* Room label */}
        <div className="absolute top-3 left-4 text-[10px] text-[#1e2a3a] uppercase tracking-widest font-bold">Marris Mission Control HQ</div>

        {/* Desks row */}
        <div>
          <p className="text-[10px] text-[#2d3748] uppercase tracking-widest mb-4 pl-1">— Workstations —</p>
          <div className="flex justify-around items-end">
            <Desk agent={AGENTS.ejp}   agentKey="ejp"   occupied={ejpAtDesk}   active={ejp?.active   ?? false} />
            <Desk agent={AGENTS.quill} agentKey="quill" occupied={quillAtDesk} active={quill?.active ?? false} />
            <Desk agent={AGENTS.flint} agentKey="flint" occupied={flintAtDesk} active={flint?.active ?? false} />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-[#1e2230]" />

        {/* Meeting + Action tables */}
        <div>
          <p className="text-[10px] text-[#2d3748] uppercase tracking-widest mb-4 pl-1">— Collaboration Zone —</p>
          <div className="flex justify-around items-start">
            <Table
              label="Meeting Table"
              icon="🤝"
              agents={['ejp', 'quill', 'flint']}
              status={status}
              size="lg"
            />
            <div className="flex flex-col gap-4">
              <p className="text-[10px] text-[#2d3748] uppercase tracking-widest text-center">Action Tables</p>
              <div className="flex gap-4">
                <Table label="EJP"   icon="📊" agents={['ejp']}   status={ejpWorking   ? status : null} size="sm" />
                <Table label="Quill" icon="🪶" agents={['quill']} status={quillWorking ? status : null} size="sm" />
                <Table label="Flint" icon="🔥" agents={['flint']} status={flintWorking ? status : null} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="border-t border-[#1e2230] pt-4 flex items-center gap-3 flex-wrap">
          {!ejp?.active && !quill?.active && !flint?.active && (
            <span className="text-xs text-[#374151]">💤 All agents idle</span>
          )}
          {status?.meeting && <span className="text-xs text-green-400 animate-pulse">🤝 Team meeting in progress</span>}
          {ejpWorking   && <span className="text-xs text-blue-400">📊 EJP working</span>}
          {quillWorking && <span className="text-xs text-green-400">🪶 Quill on taxes</span>}
          {flintWorking && <span className="text-xs text-yellow-400">🔥 Flint on investments</span>}
        </div>
      </div>
    </div>
  )
}
