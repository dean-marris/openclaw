'use client'
import { useState, useRef } from 'react'

type Transaction = {
  date: string; description: string; amount: number
  currency: string; type: 'credit' | 'debit'; isDistribution: boolean
}

type ImportResult = {
  ok: boolean; filename: string; transactions: number
  distributions: number; totalDistributions: number; totalCredits: number
  currency: string; data: Transaction[]; distributionList: Transaction[]
  error?: string
}

const NZD_USD = 0.61 // approximate — user can override

export function BankImport() {
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [rate, setRate] = useState(NZD_USD)
  const [filter, setFilter] = useState<'all' | 'distributions'>('distributions')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/import-bank', { method: 'POST', body: form })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({ ok: false, error: String(e) } as ImportResult)
    }
    setLoading(false)
  }

  const shown = result ? (filter === 'distributions' ? result.distributionList : result.data) : []

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-xl font-bold text-white mb-1">🏦 NZ Bank Statement Import</h2>
      <p className="text-sm text-[#718096] mb-6">
        Upload your NZ bank statement (CSV). I'll find all distributions and calculate USD equivalents.
      </p>

      {/* Rate input */}
      <div className="flex items-center gap-3 mb-5 bg-[#1e2230] border border-[#2d3748] rounded-lg p-3">
        <span className="text-sm text-[#718096]">NZD/USD rate:</span>
        <input type="number" step="0.001" value={rate}
          onChange={e => setRate(parseFloat(e.target.value))}
          className="w-20 bg-[#0f1117] border border-[#374151] rounded px-2 py-1 text-sm text-white text-center" />
        <span className="text-xs text-[#718096]">1 NZD = {rate} USD · Use IRS annual average for taxes</span>
      </div>

      {/* Upload area */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[#2d3748] hover:border-blue-400/50 rounded-xl p-8 text-center cursor-pointer transition-colors mb-6"
      >
        <div className="text-3xl mb-2">{loading ? '⏳' : '📄'}</div>
        <p className="text-sm text-slate-300">{loading ? 'Parsing...' : 'Click to upload NZ bank statement CSV'}</p>
        <p className="text-xs text-[#718096] mt-1">ANZ · BNZ · ASB · Westpac · Kiwibank formats supported</p>
        <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {result?.ok && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#1e2230] border border-[#2d3748] rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{result.transactions}</div>
              <div className="text-xs text-[#718096] mt-0.5">Total transactions</div>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">{result.distributions}</div>
              <div className="text-xs text-[#718096] mt-0.5">Distributions identified</div>
            </div>
            <div className="bg-[#1e2230] border border-[#2d3748] rounded-xl p-4">
              <div className="text-lg font-bold text-white">
                NZ${result.totalDistributions.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-[#718096] mt-0.5">Total distributions (NZD)</div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <div className="text-lg font-bold text-blue-400">
                US${(result.totalDistributions * rate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-[#718096] mt-0.5">Distributions in USD @ {rate}</div>
            </div>
          </div>

          {/* Filter toggle */}
          <div className="flex gap-2 mb-3">
            {(['distributions', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-[#1e2230] text-[#718096] border border-[#2d3748] hover:text-white'
                }`}>
                {f === 'distributions' ? `Distributions (${result.distributions})` : `All (${result.transactions})`}
              </button>
            ))}
          </div>

          {/* Transactions table */}
          <div className="bg-[#1e2230] border border-[#2d3748] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2d3748] text-[#718096] text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Description</th>
                  <th className="text-right px-4 py-2">NZD</th>
                  <th className="text-right px-4 py-2">USD</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t, i) => (
                  <tr key={i} className="border-b border-[#161b27] hover:bg-white/2">
                    <td className="px-4 py-2 text-[#718096] whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-2 text-slate-300 max-w-xs truncate">{t.description}</td>
                    <td className={`px-4 py-2 text-right font-mono ${t.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'debit' ? '-' : '+'}${t.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[#718096]">
                      ${(t.amount * rate).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {t.isDistribution && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">dist</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && (
              <p className="text-center text-[#718096] text-sm py-8">No {filter === 'distributions' ? 'distributions' : 'transactions'} found</p>
            )}
          </div>
        </>
      )}

      {result && !result.ok && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          Error: {result.error}
        </div>
      )}
    </div>
  )
}
