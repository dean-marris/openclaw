'use client'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useState, useRef, useCallback, useEffect } from 'react'

const FAMILY = ['Dean', 'Virginia', 'Ella', 'Jack', 'Phoebe', 'Joint'] as const
const COLORS: Record<string, string> = {
  Dean: '#3b82f6', Virginia: '#8b5cf6', Ella: '#ec4899',
  Jack: '#10b981', Phoebe: '#f59e0b', Joint: '#6b7280',
}

const TYPE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  pdf:   { label: 'PDF',  bg: 'rgba(239,68,68,0.15)',  text: '#ef4444' },
  image: { label: 'IMG',  bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  csv:   { label: 'CSV',  bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  xlsx:  { label: 'XLSX', bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
}

type Item = {
  _id: Id<'taxChecklist'>
  item: string
  status: 'pending' | 'done'
  notes?: string
  dueDate?: string
}

type Attachment = {
  _id: Id<'attachments'>
  checklistItemId: string
  fileName: string
  fileType: string
  storagePath: string
  year: string
  person: string
  uploadedAt: number
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

/* ── CSV Preview ─────────────────────────────────────────── */

function CsvPreview({ url }: { url: string }) {
  const [rows, setRows] = useState<string[][]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(url)
      .then(r => r.text())
      .then(text => {
        const parsed = text.trim().split('\n').map(line => line.split(','))
        setRows(parsed.slice(0, 100)) // cap at 100 rows
      })
      .catch(() => setError('Failed to load CSV'))
  }, [url])

  if (error) return <p className="text-red-400 text-sm p-4">{error}</p>
  if (!rows.length) return <p className="text-[#718096] text-sm p-4">Loading...</p>

  return (
    <div className="overflow-auto max-h-[60vh] rounded-lg border border-[#2d3748]">
      <table className="text-xs text-slate-300 w-full">
        <thead>
          <tr className="bg-[#1a1f2e] sticky top-0">
            {rows[0].map((cell, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-slate-400 border-b border-[#2d3748] whitespace-nowrap">{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, ri) => (
            <tr key={ri} className="hover:bg-white/5">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 border-b border-[#2d3748]/50 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Preview Modal (mobile) / Panel (desktop) ────────────── */

function PreviewOverlay({ attachment, onClose }: { attachment: Attachment; onClose: () => void }) {
  const url = `/api/preview-file?path=${encodeURIComponent(attachment.storagePath)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 md:hidden" onClick={onClose}>
      <div className="bg-[#1e2230] rounded-xl border border-[#2d3748] w-full max-w-lg max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-[#2d3748]">
          <span className="text-sm text-slate-300 truncate">{attachment.fileName}</span>
          <button onClick={onClose} className="text-[#718096] hover:text-white text-lg px-2">✕</button>
        </div>
        <div className="p-3">
          <PreviewContent attachment={attachment} url={url} />
        </div>
      </div>
    </div>
  )
}

function PreviewContent({ attachment, url }: { attachment: Attachment; url: string }) {
  if (attachment.fileType === 'pdf') {
    return <iframe src={url} className="w-full h-[60vh] rounded-lg border border-[#2d3748]" />
  }
  if (attachment.fileType === 'image') {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={url} alt={attachment.fileName} className="max-w-full rounded-lg border border-[#2d3748]" />
  }
  if (attachment.fileType === 'csv') {
    return <CsvPreview url={url} />
  }
  if (attachment.fileType === 'xlsx') {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 mb-3">Excel files can be opened in Numbers or Excel</p>
        <a href={url} download={attachment.fileName}
          className="inline-block px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors">
          Download {attachment.fileName}
        </a>
      </div>
    )
  }
  return <p className="text-[#718096] text-sm">Preview not available for this file type.</p>
}

/* ── Attachment Panel (per checklist item) ────────────────── */

function AttachmentPanel({ itemId, person }: { itemId: string; person: string }) {
  const attachments = useQuery(api.attachments.getAttachments, { checklistItemId: itemId })
  const removeAttachment = useMutation(api.attachments.removeAttachment)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewAtt, setPreviewAtt] = useState<Attachment | null>(null)
  const [desktopPreviewId, setDesktopPreviewId] = useState<string | null>(null)

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('checklistItemId', itemId)
      form.append('year', '2025')
      form.append('person', person)
      await fetch('/api/upload-attachment', { method: 'POST', body: form })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [itemId, person])

  const handleRemove = useCallback(async (id: Id<'attachments'>) => {
    if (desktopPreviewId === id) setDesktopPreviewId(null)
    await removeAttachment({ id })
  }, [removeAttachment, desktopPreviewId])

  const desktopPreviewAtt = attachments?.find(a => a._id === desktopPreviewId) as Attachment | undefined

  return (
    <div className="mt-2 ml-8 mr-2 p-3 bg-[#161b26] rounded-lg border border-[#2d3748]/60">
      {/* Upload button */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs px-3 py-1.5 bg-[#2d3748] hover:bg-[#3d4a5c] text-slate-300 rounded-lg transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : '+ Add file'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx"
          onChange={handleUpload}
          className="hidden"
        />
        <span className="text-xs text-[#718096]">PDF, images, CSV, XLSX</span>
      </div>

      {/* File list */}
      {attachments && attachments.length > 0 && (
        <div className="space-y-1">
          {(attachments as Attachment[]).map(att => {
            const badge = TYPE_BADGES[att.fileType] || { label: att.fileType.toUpperCase(), bg: 'rgba(107,114,128,0.15)', text: '#6b7280' }
            const isDesktopActive = desktopPreviewId === att._id
            return (
              <div key={att._id}>
                <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 group transition-colors ${isDesktopActive ? 'bg-white/5' : ''}`}>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                  <button
                    onClick={() => {
                      // mobile: modal, desktop: inline panel
                      if (window.innerWidth < 768) {
                        setPreviewAtt(att)
                      } else {
                        setDesktopPreviewId(isDesktopActive ? null : att._id)
                      }
                    }}
                    className="flex-1 text-left text-xs text-slate-300 hover:text-white truncate transition-colors"
                  >
                    {att.fileName}
                  </button>
                  <button
                    onClick={() => handleRemove(att._id)}
                    className="text-[#718096] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity px-1"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
                {/* Desktop inline preview */}
                {isDesktopActive && desktopPreviewAtt && (
                  <div className="hidden md:block mt-2 mb-2 ml-2">
                    <PreviewContent attachment={desktopPreviewAtt} url={`/api/preview-file?path=${encodeURIComponent(desktopPreviewAtt.storagePath)}`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {attachments && attachments.length === 0 && (
        <p className="text-xs text-[#718096] italic">No files attached yet</p>
      )}

      {/* Mobile preview modal */}
      {previewAtt && <PreviewOverlay attachment={previewAtt} onClose={() => setPreviewAtt(null)} />}
    </div>
  )
}

/* ── Checklist Item ──────────────────────────────────────── */

function ChecklistItem({ item, onToggle, attachmentCount }: { item: Item; onToggle: (item: Item) => void; attachmentCount: number }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const person = getPerson(item.item)
  const color = COLORS[person]
  const done = item.status === 'done'

  return (
    <div className="border-b border-[#2d3748] last:border-0">
      <div className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/5 rounded-lg transition-colors">
        <div
          onClick={() => onToggle(item)}
          className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
          style={{ borderColor: color, backgroundColor: done ? color + '33' : 'transparent' }}
        >
          {done && <span className="text-xs font-bold" style={{ color }}>✓</span>}
        </div>
        <div className="flex-1 min-w-0" onClick={() => onToggle(item)}>
          <p className={`text-sm leading-snug ${done ? 'line-through text-[#718096]' : 'text-slate-200'}`}>{item.item}</p>
          {item.notes && <p className="text-xs text-[#718096] mt-0.5">{item.notes}</p>}
          {item.dueDate && <p className="text-xs text-yellow-400 mt-0.5">Due {item.dueDate}</p>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setPanelOpen(!panelOpen) }}
          className="relative text-sm flex-shrink-0 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          title="Attachments"
        >
          📎
          {attachmentCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-500 text-[10px] text-white font-bold flex items-center justify-center">
              {attachmentCount}
            </span>
          )}
        </button>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: color + '22', color }}>{person}</span>
      </div>
      {panelOpen && <AttachmentPanel itemId={item._id} person={person} />}
    </div>
  )
}

/* ── Attachment count hook ───────────────────────────────── */

function useAttachmentCounts(items: Item[] | undefined) {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!items?.length) return
    const ids = items.map(i => i._id)

    // Fetch all counts via Convex HTTP API
    Promise.all(
      ids.map(id =>
        fetch('http://127.0.0.1:3210/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'attachments:getAttachments', args: { checklistItemId: id } }),
        })
          .then(r => r.json())
          .then(data => ({ id, count: Array.isArray(data.value) ? data.value.length : 0 }))
          .catch(() => ({ id, count: 0 }))
      )
    ).then(results => {
      const map: Record<string, number> = {}
      for (const { id, count } of results) map[id] = count
      setCounts(map)
    })
  }, [items])

  return counts
}

/* ── Person Card ─────────────────────────────────────────── */

function PersonCard({ person, items, onToggle, counts }: { person: string; items: Item[]; onToggle: (item: Item) => void; counts: Record<string, number> }) {
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
        {personItems.map(item => (
          <ChecklistItem key={item._id} item={item} onToggle={onToggle} attachmentCount={counts[item._id] ?? 0} />
        ))}
      </div>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────── */

export function TaxChecklist() {
  const items = useQuery(api.taxChecklist.listByYear, { year: '2025' })
  const updateItem = useMutation(api.taxChecklist.update)
  const counts = useAttachmentCounts(items as Item[] | undefined)

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
          <PersonCard key={person} person={person} items={items as Item[]} onToggle={handleToggle} counts={counts} />
        ))}
      </div>
    </div>
  )
}
