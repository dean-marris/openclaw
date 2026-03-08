'use client'
import { useState, useRef } from 'react'

const PEOPLE = ['auto-detect', 'dean', 'virginia', 'ella', 'jack', 'phoebe', 'joint']

type UploadResult = {
  filename: string
  folder: string
  size: number
  ok: boolean
  error?: string
}

export function UploadDocs() {
  const [person, setPerson] = useState('auto-detect')
  const [results, setResults] = useState<UploadResult[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
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
        newResults.push({ filename: file.name, folder: data.folder, size: file.size, ok: data.ok, error: data.error })
      } catch (e) {
        newResults.push({ filename: file.name, folder: '', size: file.size, ok: false, error: String(e) })
      }
    }

    setResults(prev => [...newResults, ...prev])
    setUploading(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-1">📎 Upload Documents</h2>
      <p className="text-sm text-[#718096] mb-6">
        Drop tax docs here — I'll auto-route by filename, or pick a person manually.
        <br />
        <span className="text-xs">NZ/EROAD files → joint · dean-w2 → dean · etc.</span>
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
        <div className="text-4xl mb-3">{uploading ? '⏳' : '📄'}</div>
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
          <h3 className="text-sm font-semibold text-[#718096] uppercase tracking-wide">Uploaded</h3>
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
              r.ok ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
            }`}>
              <span>{r.ok ? '✅' : '❌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{r.filename}</p>
                {r.ok && <p className="text-xs text-[#718096]">Saved to <span className="text-blue-400">{r.folder}/</span></p>}
                {r.error && <p className="text-xs text-red-400">{r.error}</p>}
              </div>
              <span className="text-xs text-[#718096]">{(r.size / 1024).toFixed(0)}KB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
