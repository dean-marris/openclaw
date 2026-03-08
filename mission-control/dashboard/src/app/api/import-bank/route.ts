import { NextRequest, NextResponse } from 'next/server'

type Transaction = {
  date: string
  description: string
  amount: number
  balance?: number
  currency: string
  type: 'credit' | 'debit'
  isDistribution: boolean
}

const DISTRIBUTION_KEYWORDS = [
  'distribution', 'dividend', 'marris', 'shareholder', 'salary',
  'income', 'trust', 'payment from', 'transfer from',
]

function detectDistribution(description: string): boolean {
  const lower = description.toLowerCase()
  return DISTRIBUTION_KEYWORDS.some(k => lower.includes(k))
}

function parseNZBankCSV(csv: string): Transaction[] {
  const lines = csv.trim().split('\n').map(l => l.trim()).filter(Boolean)
  const transactions: Transaction[] = []

  for (const line of lines) {
    if (!line || line.toLowerCase().includes('date') || line.toLowerCase().includes('type')) continue

    // Try ANZ format: Date,Amount,Description,Balance
    // Try BNZ format: Date,Amount,Payee,Memo,Balance  
    // Try ASB format: Date,Unique Id,Tran Type,Cheque Number,Payee,Memo,Amount
    // Generic: split by comma, find date + amount

    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
    if (cols.length < 3) continue

    // Find date (first col that looks like a date)
    const dateCol = cols.find(c => /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(c) || /\d{4}-\d{2}-\d{2}/.test(c))
    if (!dateCol) continue

    // Find amount (first col that looks like a number, possibly negative)
    const amountStr = cols.find(c => /^-?\d+\.?\d*$/.test(c.replace(',', '')))
    if (!amountStr) continue

    const amount = parseFloat(amountStr.replace(',', ''))
    const description = cols.slice(2).filter(c => c && c !== amountStr && c !== dateCol).join(' ').trim()

    transactions.push({
      date: dateCol,
      description,
      amount: Math.abs(amount),
      currency: 'NZD',
      type: amount >= 0 ? 'credit' : 'debit',
      isDistribution: detectDistribution(description),
    })
  }

  return transactions
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const text = await file.text()
    const transactions = parseNZBankCSV(text)

    const distributions = transactions.filter(t => t.isDistribution && t.type === 'credit')
    const totalDistributions = distributions.reduce((sum, t) => sum + t.amount, 0)
    const totalCredits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({
      ok: true,
      filename: file.name,
      transactions: transactions.length,
      distributions: distributions.length,
      totalDistributions,
      totalCredits,
      currency: 'NZD',
      data: transactions,
      distributionList: distributions,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
