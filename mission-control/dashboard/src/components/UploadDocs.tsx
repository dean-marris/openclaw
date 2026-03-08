'use client'
import { useState, useRef, useEffect } from 'react'

const PEOPLE = ['auto-detect', 'dean', 'virginia', 'ella', 'jack', 'phoebe', 'joint']
const PERSON_TABS = ['dean', 'virginia', 'ella', 'jack', 'phoebe', 'joint'] as const
const TAB_COLORS: Record<string, string> = {
  dean: '#3b82f6', virginia: '#8b5cf6', ella: '#ec4899',
  jack: '#10b981', phoebe: '#f59e0b', joint: '#6b7280',
}

const CONVEX_URL = 'http://127.0.0.1:3210'

type UploadResult = {
  filename: string
  folder: string
  size: number
  ok: boolean
  error?: string
  storedFile?: boolean
  attachment?: boolean
  drive?: boolean
  matchedItemId?: string | null
}

type StoredDoc = {
  _id: string
  fileName: string
  fileType: string
  storagePath: string
  person: string
  year: string
  uploadedAt: number
}

function b64(str: string) {
  return btoa(str)
}

function fileUrl(storagePath: string) {
  return `/api/files?path=${encodeURIComponent(b64(storagePath))}`
}

/* ── Stored Documents Viewer ─────────────────────────────── */

function DocCard({ doc }: { doc: StoredDoc }) {
  const url = fileUrl(doc.storagePath)
  const isImage = doc.fileType === 'image'

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-[#1e2230] border border-[#2d3748] rounded-lg hover:border-[#4a5568] transition-colors group"
    >
      {isImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt={doc.fileName}
          className="w-12 h-12 object-cover rounded border border-[#2d3748] flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded border border-[#2d3748] flex items-center justify-center text-2xl flex-shrink-0 bg-[#161b26]">
          {doc.fileType === 'pdf' ? '\u{1F4C4}' : '\u{1F4CE}'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate group-hover:text-white transition-colors">
          {doc.fileName}
        </p>
        <p className="text-xs text-[#718096]">
          {doc.fileType.toUpperCase()} &middot; {new Date(doc.uploadedAt).toLocaleDateString()}
        </p>
      </div>
    </a>
  )
}

function StoredDocuments({ refreshKey }: { refreshKey: number }) {
  const [tab, setTab] = useState<string>('dean')
  const [docs, setDocs] = useState<StoredDoc[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'attachments:listByPerson',
        args: { person: tab, year: '2025' },
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setDocs(Array.isArray(data.value) ? data.value : [])
      })
      .catch(() => { if (!cancelled) setDocs([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tab, refreshKey])

  return (
    <div className="mt-10">
      <h3 className="text-lg font-bold text-white mb-4">Stored Documents</h3>

      {/* Person tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {PERSON_TABS.map(p => (
          <button
            key={p}
            onClick={() => setTab(p)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              tab === p ? 'border' : 'bg-[#1e2230] text-[#718096] hover:text-white border border-[#2d3748]'
            }`}
            style={tab === p ? {
              background: TAB_COLORS[p] + '22',
              color: TAB_COLORS[p],
              borderColor: TAB_COLORS[p] + '44',
            } : undefined}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Document grid */}
      {loading ? (
        <p className="text-sm text-[#718096]">Loading...</p>
      ) : docs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {docs.map(doc => <DocCard key={doc._id} doc={doc} />)}
        </div>
      ) : (
        <p className="text-sm text-[#718096] italic">No documents for {tab} yet.</p>
      )}
    </div>
  )
}

/* ── Main Upload Component ───────────────────────────────── */

export function UploadDocs() {
  const [person, setPerson] = useState('auto-detect')
  const [results, setResults] = useState<UploadResult[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (files: FileList | File[]) => {
    setUploading(true)
    const arr = Array.from(files)
    const newResults: UploadResult[] = []

    for (const file of arr) {
      const form = new FormData()
      form.append('file', file)
      if (person !== 'auto-detect') form.append('person', person)

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const data = await res.json()
        newResults.push({
          filename: file.name,
          folder: data.folder,
          size: file.size,
          ok: data.ok,
          error: data.error,
          storedFile: data.storedFile,
          attachment: data.attachment,
          drive: data.drive,
          matchedItemId: data.matchedItemId,
        })
      } catch (e) {
        newResults.push({ filename: file.name, folder: '', size: file.size, ok: false, error: String(e) })
      }
    }

    setResults(prev => [...newResults, ...prev])
    setUploading(false)
    setRefreshKey(k => k + 1)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
  }

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-xl font-bold text-white mb-1">Upload Documents</h2>
      <p className="text-sm text-[#718096] mb-6">
        Drop tax docs here — auto-routed by filename to filesystem, Convex, and Google Drive.
        <br />
        <span className="text-xs">NZ/EROAD files &rarr; joint &middot; dean-w2 &rarr; dean &middot; etc.</span>
      </p>

      {/* Person selector */}
      <div className="flex gap-2 flex-wrap mb-5">
        {PEOPLE.map(p => (
          <button key={p} onClick={() => setPerson(p)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              person === p ? 'bg-blue-600 text-white' : 'bg-[#1e2230] text-[#718096] hover:text-white border border-[#2d3748]'
            }`}>
            {p}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-400 bg-blue-400/5' : 'border-[#2d3748] hover:border-[#4a5568] hover:bg-white/2'
        }`}
      >
        <div className="text-4xl mb-3">{uploading ? '\u23F3' : '\u{1F4C4}'}</div>
        <p className="text-sm text-slate-300 font-medium">
          {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
        </p>
        <p className="text-xs text-[#718096] mt-1">PDF, images, any format</p>
        <input ref={inputRef} type="file" multiple className="hidden"
          onChange={e => e.target.files && upload(e.target.files)} />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-[#718096] uppercase tracking-wide">Upload Results</h3>
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
              r.ok ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
            }`}>
              <span>{r.ok ? '\u2705' : '\u274C'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{r.filename}</p>
                {r.ok && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-blue-400">{r.folder}/</span>
                    {r.storedFile && <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">DB</span>}
                    {r.attachment && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">Linked</span>}
                    {r.drive && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">Drive</span>}
                    {r.drive === false && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Drive failed</span>}
                  </div>
                )}
                {r.error && <p className="text-xs text-red-400">{r.error}</p>}
              </div>
              <span className="text-xs text-[#718096]">{(r.size / 1024).toFixed(0)}KB</span>
            </div>
          ))}
        </div>
      )}

      {/* Stored Documents viewer */}
      <StoredDocuments refreshKey={refreshKey} />
    </div>
  )
}
