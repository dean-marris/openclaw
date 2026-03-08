import { NextRequest, NextResponse } from 'next/server'

type Transaction = {
  date: string
  description: string
  amount: number
  balance?: number
  type: 'credit' | 'debit'
  uniqueId?: string
  tranType?: string
  year: string
  accountNumber: string
}

type AccountBlock = {
  accountNumber: string
  accountName: string
  bank: 'ASB'
  currency: 'NZD'
  transactions: Transaction[]
  highestBalance: number
  highestBalanceDate: string
  totalCredits: number
  totalDebits: number
  transactionCount: number
}

function parseASBCSV(csv: string): AccountBlock[] {
  const lines = csv.split('\n').map(l => l.trimEnd())
  const accounts: AccountBlock[] = []

  let i = 0
  while (i < lines.length) {
    const lineLower = lines[i].toLowerCase()

    if (lineLower.includes('account name')) {
      // Next line has the actual account name and number
      i++
      if (i >= lines.length) break

      const valueLine = lines[i]
      const valueCols = valueLine.split(',').map(c => c.trim())
      const accountName = valueCols[0] || 'Unknown'
      const accountNumber = valueCols[1] || 'Unknown'

      // Skip until we find the header row (Date ,Unique Id ,...)
      i++
      while (i < lines.length) {
        if (lines[i].toLowerCase().trimStart().startsWith('date')) {
          i++ // skip header row
          break
        }
        i++
      }

      // Parse transactions until blank line or next account block
      const transactions: Transaction[] = []
      let highestBalance = 0
      let highestBalanceDate = ''
      let totalCredits = 0
      let totalDebits = 0

      while (i < lines.length) {
        const row = lines[i].trim()
        if (!row) { i++; break }
        if (row.toLowerCase().includes('account name')) break

        const cols = row.split(',').map(c => c.trim())
        if (cols.length < 7) { i++; continue }

        const date = cols[0]
        if (!date || !/^\d{4}\/\d{2}\/\d{2}$/.test(date)) { i++; continue }

        const uniqueId = cols[1] || undefined
        const tranType = cols[2] || undefined
        const payee = cols[4] || ''
        const memo = cols[5] || ''
        const description = (payee + ' ' + memo).trim()
        const amount = parseFloat(cols[6])

        if (isNaN(amount)) { i++; continue }

        const type: 'credit' | 'debit' = amount >= 0 ? 'credit' : 'debit'
        const year = date.substring(0, 4)

        if (type === 'credit') {
          totalCredits += amount
          if (amount > highestBalance) {
            highestBalance = amount
            highestBalanceDate = date
          }
        } else {
          totalDebits += Math.abs(amount)
        }

        transactions.push({
          date,
          description,
          amount,
          type,
          uniqueId,
          tranType,
          year,
          accountNumber,
        })

        i++
      }

      accounts.push({
        accountNumber,
        accountName,
        bank: 'ASB',
        currency: 'NZD',
        transactions,
        highestBalance,
        highestBalanceDate,
        totalCredits,
        totalDebits,
        transactionCount: transactions.length,
      })
    } else {
      i++
    }
  }

  return accounts
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const text = await file.text()
    const accounts = parseASBCSV(text)

    const totalTransactions = accounts.reduce((sum, a) => sum + a.transactionCount, 0)

    return NextResponse.json({
      ok: true,
      accounts,
      totalAccounts: accounts.length,
      totalTransactions,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
