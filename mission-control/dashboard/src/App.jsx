import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import './App.css'

const FAMILY = ['Dean', 'Virginia', 'Ella', 'Jack', 'Phoebe', 'Joint']
const COLORS = {
  Dean: '#3b82f6',
  Virginia: '#8b5cf6',
  Ella: '#ec4899',
  Jack: '#10b981',
  Phoebe: '#f59e0b',
  Joint: '#6b7280',
}

function Header() {
  const daysLeft = Math.ceil((new Date('2026-04-15') - new Date()) / 86400000)
  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">📊</span>
        <div>
          <h1>EJP Mission Control</h1>
          <p className="subtitle">Marris Family · 2025 Tax Returns</p>
        </div>
      </div>
      <div className="deadline-badge">
        <span className="deadline-num">{daysLeft}</span>
        <span className="deadline-label">days to April 15</span>
      </div>
    </header>
  )
}

function StatsBar({ items }) {
  const total = items?.length || 0
  const done = items?.filter(i => i.status === 'done').length || 0
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-num">{total}</span>
        <span className="stat-label">Total Items</span>
      </div>
      <div className="stat">
        <span className="stat-num green">{done}</span>
        <span className="stat-label">Completed</span>
      </div>
      <div className="stat">
        <span className="stat-num yellow">{total - done}</span>
        <span className="stat-label">Pending</span>
      </div>
      <div className="stat progress-stat">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="stat-label">{pct}% complete</span>
      </div>
    </div>
  )
}

function ChecklistItem({ item, onToggle }) {
  const person = FAMILY.find(p => item.item.startsWith(p)) || 'Joint'
  const color = COLORS[person] || COLORS.Joint
  return (
    <div className={`checklist-item ${item.status === 'done' ? 'done' : ''}`} onClick={() => onToggle(item)}>
      <div className="item-check" style={{ borderColor: color }}>
        {item.status === 'done' && <span className="check-mark" style={{ color }}>✓</span>}
      </div>
      <div className="item-body">
        <span className="item-text">{item.item}</span>
        {item.notes && <span className="item-notes">{item.notes}</span>}
        {item.dueDate && <span className="item-due">Due {item.dueDate}</span>}
      </div>
      <div className="item-person" style={{ background: color + '22', color }}>
        {person}
      </div>
    </div>
  )
}

function PersonSection({ person, items, onToggle }) {
  const color = COLORS[person]
  const personItems = items.filter(i => {
    if (person === 'Joint') return !FAMILY.slice(0, -1).some(p => i.item.startsWith(p))
    return i.item.startsWith(person)
  })
  if (!personItems.length) return null
  const done = personItems.filter(i => i.status === 'done').length
  return (
    <div className="person-section">
      <div className="person-header">
        <span className="person-dot" style={{ background: color }} />
        <h3 style={{ color }}>{person}</h3>
        <span className="person-count">{done}/{personItems.length}</span>
      </div>
      {personItems.map(item => (
        <ChecklistItem key={item._id} item={item} onToggle={onToggle} />
      ))}
    </div>
  )
}

export default function App() {
  const items = useQuery(api.taxChecklist.listByYear, { year: '2025' })
  const updateItem = useMutation(api.taxChecklist.update)

  const handleToggle = async (item) => {
    await updateItem({
      id: item._id,
      status: item.status === 'done' ? 'pending' : 'done',
    })
  }

  if (!items) return <div className="loading">Loading...</div>

  return (
    <div className="app">
      <Header />
      <StatsBar items={items} />
      <main className="main">
        <div className="checklist-grid">
          {FAMILY.map(person => (
            <PersonSection
              key={person}
              person={person}
              items={items}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
