'use client'
import { useState, useEffect } from 'react'
import { TaxChecklist } from './TaxChecklist'
import { UploadDocs } from './UploadDocs'
import { OfficeView } from './OfficeView'
import { ASBAccounts } from './ASBAccounts'
import { SearchDocs } from './SearchDocs'
import { KeyContacts } from './KeyContacts'

type Tab = 'checklist' | 'upload' | 'search' | 'investments' | 'office' | 'asb' | 'contacts'

const NAV = [
  { id: 'checklist',   label: '🧾 Tax Checklist' },
  { id: 'upload',      label: '📎 Upload Docs' },
  { id: 'search',      label: '🔍 Search Docs' },
  { id: 'asb',         label: '🏦 ASB Accounts' },
  { id: 'contacts',    label: '👔 Key Contacts' },
  { id: 'investments', label: '📈 Investments' },
  { id: 'office',      label: '🏢 The Office' },
] as const

export function Dashboard() {
  const [tab, setTab] = useState<Tab>('checklist')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    setDays(Math.ceil((new Date('2026-04-15').getTime() - Date.now()) / 86400000))
  }, [])

  const currentNav = NAV.find(n => n.id === tab)

  return (
    <div className="flex h-screen bg-[#0f1117] text-slate-200 overflow-hidden">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-56 flex-shrink-0 border-r border-[#2d3748] flex flex-col
        bg-[#0f1117] transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 border-b border-[#2d3748]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📊</span>
            <span className="font-bold text-white text-lg">EJP</span>
            <button className="ml-auto md:hidden text-[#718096] hover:text-white p-1" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
          <p className="text-xs text-[#718096]">Mission Control</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => { setTab(n.id as Tab); setSidebarOpen(false) }}
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
            <div className="text-2xl font-black text-red-400">{days ?? '—'}</div>
            <div className="text-xs text-[#718096]">days to Apr 15</div>
          </div>
          <p className="text-xs text-[#718096] mt-3 text-center">Marris Family · 2025</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#2d3748] flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-[#718096] hover:text-white p-1 text-xl">☰</button>
          <span className="text-sm font-medium text-slate-300">{currentNav?.label}</span>
          <div className="ml-auto bg-red-500/10 border border-red-500/20 rounded px-2 py-1 text-xs text-red-400 font-bold">
            {days ?? '—'}d left
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'checklist'   && <TaxChecklist />}
          {tab === 'upload'      && <UploadDocs />}
          {tab === 'search'      && <SearchDocs />}
          {tab === 'asb'         && <ASBAccounts />}
          {tab === 'contacts'    && <KeyContacts />}
          {tab === 'office'      && <OfficeView />}
          {tab === 'investments' && (
            <div className="p-8 text-[#718096]">
              <h2 className="text-xl font-bold text-white mb-2">📈 Investment Portfolio</h2>
              <p>USA + NZ portfolio tracker — coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
