'use client'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

const FAMILY = ['Dean', 'Virginia', 'Ella', 'Jack', 'Phoebe', 'Joint'] as const
const COLORS: Record<string, string> = {
  Dean: '#3b82f6', Virginia: '#8b5cf6', Ella: '#ec4899',
  Jack: '#10b981', Phoebe: '#f59e0b', Joint: '#6b7280',
}

type Item = {
  _id: Id<'taxChecklist'>
  item: string
  status: 'pending' | 'done'
  notes?: string
  dueDate?: string
}

function daysUntilDeadline() {
  return Math.ceil((new Date('2026-04-15').getTime() - Date.now()) / 86400000)
}

function getPerson(item: string) {
  return FAMILY.find(p => item.startsWith(p)) ?? 'Joint'
}

function Header({ total, done }: { total: number; done: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  const days = daysUntilDeadline()
  return (
    <header className="border-b border-[#2d3748] pb-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">📊</span>
          <div>
            <h1 className="text-2xl font-bold text-white">EJP Mission Control</h1>
            <p className="text-sm text-[#718096]">Marris Family · 2025 Tax Returns</p>
          </div>
        </div>
        <div className="text-center bg-[#1e2230] border border-red-500/20 rounded-xl px-6 py-3">
          <div className="text-3xl font-black text-red-400">{days}</div>
          <div className="text-xs text-[#718096]">days to April 15</div>
        </div>
      </div>
      <div className="flex items-center gap-8 bg-[#1e2230] border border-[#2d3748] rounded-xl p-5">
        <div><div className="text-3xl font-bold text-white">{total}</div><div className="text-xs text-[#718096] uppercase tracking-wide">Total</div></div>
        <div><div className="text-3xl font-bold text-green-400">{done}</div><div className="text-xs text-[#718096] uppercase tracking-wide">Done</div></div>
        <div><div className="text-3xl font-bold text-yellow-400">{total - done}</div><div className="text-xs text-[#718096] uppercase tracking-wide">Pending</div></div>
        <div className="flex-1">
          <div className="h-3 bg-[#2d3748] rounded-full overflow-hidden mb-1">
            <div className="h-full bg-green-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-[#718096]">{pct}% complete</div>
        </div>
      </div>
    </header>
  )
}

function ChecklistItem({ item, onToggle }: { item: Item; onToggle: (item: Item) => void }) {
  const person = getPerson(item.item)
  const color = COLORS[person]
  const done = item.status === 'done'
  return (
    <div
      onClick={() => onToggle(item)}
      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/5 rounded-lg transition-colors border-b border-[#2d3748] last:border-0"
    >
      <div className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
        style={{ borderColor: color, backgroundColor: done ? color + '33' : 'transparent' }}>
        {done && <span className="text-xs font-bold" style={{ color }}>✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${done ? 'line-through text-[#718096]' : 'text-slate-200'}`}>{item.item}</p>
        {item.notes && <p className="text-xs text-[#718096] mt-0.5">{item.notes}</p>}
        {item.dueDate && <p className="text-xs text-yellow-400 mt-0.5">Due {item.dueDate}</p>}
      </div>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: color + '22', color }}>{person}</span>
    </div>
  )
}

function PersonCard({ person, items, onToggle }: { person: string; items: Item[]; onToggle: (item: Item) => void }) {
  const personItems = person === 'Joint'
    ? items.filter(i => !FAMILY.slice(0, -1).some(p => i.item.startsWith(p)))
    : items.filter(i => i.item.startsWith(person))
  if (!personItems.length) return null
  const done = personItems.filter(i => i.status === 'done').length
  const color = COLORS[person]
  return (
    <div className="bg-[#1e2230] border border-[#2d3748] rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d3748]">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <h3 className="font-semibold flex-1" style={{ color }}>{person}</h3>
        <span className="text-xs text-[#718096]">{done}/{personItems.length}</span>
      </div>
      <div className="p-2">
        {personItems.map(item => <ChecklistItem key={item._id} item={item} onToggle={onToggle} />)}
      </div>
    </div>
  )
}

export function TaxDashboard() {
  const items = useQuery(api.taxChecklist.listByYear, { year: '2025' })
  const updateItem = useMutation(api.taxChecklist.update)

  const handleToggle = (item: Item) => {
    updateItem({ id: item._id, status: item.status === 'done' ? 'pending' : 'done' })
  }

  if (!items) return (
    <div className="flex items-center justify-center h-screen text-[#718096]">Loading...</div>
  )

  const done = items.filter(i => i.status === 'done').length

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Header total={items.length} done={done} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {FAMILY.map(person => (
          <PersonCard key={person} person={person} items={items as Item[]} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  )
}
