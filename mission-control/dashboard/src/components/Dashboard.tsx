'use client'
import { useState } from 'react'
import { TaxChecklist } from './TaxChecklist'
import { UploadDocs } from './UploadDocs'

type Tab = 'checklist' | 'upload' | 'investments'

const NAV = [
  { id: 'checklist', label: '🧾 Tax Checklist', },
  { id: 'upload',    label: '📎 Upload Docs', },
  { id: 'investments', label: '📈 Investments', },
] as const

function daysLeft() {
  return Math.ceil((new Date('2026-04-15').getTime() - Date.now()) / 86400000)
}

export function Dashboard() {
  const [tab, setTab] = useState<Tab>('checklist')

  return (
    <div className="flex h-screen bg-[#0f1117] text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-[#2d3748] flex flex-col">
        <div className="p-5 border-b border-[#2d3748]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📊</span>
            <span className="font-bold text-white text-lg">EJP</span>
          </div>
          <p className="text-xs text-[#718096]">Mission Control</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setTab(n.id as Tab)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                tab === n.id
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : 'text-[#718096] hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#2d3748]">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-red-400">{daysLeft()}</div>
            <div className="text-xs text-[#718096]">days to Apr 15</div>
          </div>
          <p className="text-xs text-[#718096] mt-3 text-center">Marris Family · 2025</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'checklist' && <TaxChecklist />}
        {tab === 'upload' && <UploadDocs />}
        {tab === 'investments' && (
          <div className="p-8 text-[#718096]">
            <h2 className="text-xl font-bold text-white mb-2">📈 Investment Portfolio</h2>
            <p>USA + NZ portfolio tracker — coming soon.</p>
          </div>
        )}
      </main>
    </div>
  )
}
