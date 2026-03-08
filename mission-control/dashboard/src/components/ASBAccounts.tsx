'use client'
import { useState, useRef } from 'react'
import { api } from '../../../convex/_generated/api'
import { useQuery, useMutation } from 'convex/react'

type ParsedAccount = {
  accountNumber: string
  accountName: string
  bank: 'ASB'
  currency: 'NZD'
  transactions: {
    date: string
    description: string
    amount: number
    type: 'credit' | 'debit'
    uniqueId?: string
    tranType?: string
    year: string
    accountNumber: string
  }[]
  highestBalance: number
  highestBalanceDate: string
  totalCredits: number
  totalDebits: number
  transactionCount: number
}

export function ASBAccounts() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const accounts = useQuery(api.bankAccounts.listAccounts)
  const transactions = useQuery(
    api.bankAccounts.listTransactions,
    selectedAccount ? { accountNumber: selectedAccount, year: yearFilter || undefined } : 'skip'
  )
  const upsertAccount = useMutation(api.bankAccounts.upsertAccount)
  const insertTransactions = useMutation(api.bankAccounts.insertTransactions)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/import-bank', { method: 'POST', body: form })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Import failed')

      for (const acct of data.accounts as ParsedAccount[]) {
        await upsertAccount({
          accountNumber: acct.accountNumber,
          accountName: acct.accountName,
          bank: acct.bank,
          currency: acct.currency,
          highestBalance: acct.highestBalance,
          highestBalanceDate: acct.highestBalanceDate,
          lastImportedAt: Date.now(),
        })

        const yearGroups: Record<string, typeof acct.transactions> = {}
        for (const txn of acct.transactions) {
          if (!yearGroups[txn.year]) yearGroups[txn.year] = []
          yearGroups[txn.year].push(txn)
        }

        for (const [year, txns] of Object.entries(yearGroups)) {
          await insertTransactions({
            accountNumber: acct.accountNumber,
            year,
            transactions: txns,
          })
        }
      }

      setImportMsg(`Imported ${data.totalAccounts} account(s), ${data.totalTransactions} transactions`)
      if (data.accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(data.accounts[0].accountNumber)
      }
    } catch (err) {
      setImportMsg(`Error: ${err}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const uniqueYears = transactions
    ? [...new Set(transactions.map(t => t.year))].sort().reverse()
    : []

  const totalCredits = transactions?.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0) ?? 0
  const totalDebits = transactions?.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0) ?? 0
  const txnCount = transactions?.length ?? 0

  const selectedAcctData = accounts?.find(a => a.accountNumber === selectedAccount)

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">ASB Accounts</h2>
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      </div>

      {importMsg && (
        <div className={`text-sm px-4 py-2 rounded-lg ${importMsg.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {importMsg}
        </div>
      )}

      {/* Account selector cards */}
      {accounts && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map(acct => (
            <button
              key={acct.accountNumber}
              onClick={() => { setSelectedAccount(acct.accountNumber); setYearFilter('') }}
              className={`text-left p-4 rounded-lg border transition-colors ${
                selectedAccount === acct.accountNumber
                  ? 'bg-blue-600/20 border-blue-500/40 text-white'
                  : 'bg-[#1e2230] border-[#2d3748] text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-medium text-sm">{acct.accountName}</div>
              <div className="text-xs text-slate-400 mt-1">
                ...{acct.accountNumber.slice(-8)}
              </div>
              <div className="text-amber-400 font-bold text-sm mt-2">
                NZ$ {acct.highestBalance.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected account view */}
      {selectedAccount && transactions && (
        <div className="space-y-4">
          {/* Year filter + stats */}
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="bg-[#1e2230] border border-[#2d3748] text-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All years</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex gap-4 text-sm">
              <span className="text-green-400">Credits: NZ$ {totalCredits.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
              <span className="text-red-400">Debits: NZ$ {totalDebits.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}</span>
              <span className="text-slate-400">{txnCount} transactions</span>
            </div>
          </div>

          {/* Highest balance box */}
          {selectedAcctData && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <span className="text-amber-400 font-bold">
                Highest Balance: NZ$ {selectedAcctData.highestBalance.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-amber-300 ml-2">({selectedAcctData.highestBalanceDate})</span>
              <span className="text-amber-200/70 ml-2 text-sm">— Required for FBAR/CPA reporting</span>
            </div>
          )}

          {/* Transaction table */}
          <div className="bg-[#1e2230] border border-[#2d3748] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2d3748] text-slate-400 text-left">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, i) => (
                    <tr key={i} className="border-b border-[#2d3748]/50 hover:bg-white/5">
                      <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">{txn.date}</td>
                      <td className="px-4 py-2.5 text-slate-300 max-w-xs truncate">{txn.description}</td>
                      <td className={`px-4 py-2.5 text-right font-mono whitespace-nowrap ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {txn.type === 'debit' ? '-' : ''}NZ$ {Math.abs(txn.amount).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          txn.type === 'credit'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {txn.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length === 0 && (
              <div className="text-center py-8 text-slate-500">No transactions found</div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
