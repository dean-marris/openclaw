'use client'
import { useState, useCallback, useRef } from 'react'

type SearchResult = {
  file: string
  year: string
  person: string
  page: number
  snippet: string
  matchCount: number
}

type SearchResponse = {
  results: SearchResult[]
  query: string
  pdfCount: number
  error?: string
}

const PERSON_EMOJI: Record<string, string> = {
  dean: '👨',
  virginia: '👩',
  ella: '👧',
  jack: '👦',
  phoebe: '🧒',
  joint: '🏠',
  all: '📁',
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">{part}</mark>
        : part
    )
  } catch {
    return text
  }
}

export function SearchDocs() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState<{ pdfCount: number; query: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setMeta(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/search-docs?q=${encodeURIComponent(q)}`)
      if (!res.ok) {
        const text = await res.text()
        setError(`Server error ${res.status}: ${text.slice(0, 200)}`)
        return
      }
      const data: SearchResponse = await res.json()
      if (data.error) setError(data.error)
      else {
        setResults(data.results)
        setMeta({ pdfCount: data.pdfCount, query: data.query })
      }
    } catch (e) {
      setError(`Search failed: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 500)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      search(query)
    }
  }

  // Group results by file
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.file]) acc[r.file] = []
    acc[r.file].push(r)
    return acc
  }, {})

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-xl font-bold text-white mb-1">🔍 Search Tax Returns</h2>
      <p className="text-sm text-[#718096] mb-6">
        Search across all uploaded tax PDFs — 2023, 2024, and 2025. 
        Finds matches by page with context snippets.
      </p>

      {/* Search input */}
      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={'Search\u2026 e.g. \u201cW-2\u201d, \u201ccapital gains\u201d, \u201cmortgage\u201d, \u201cEROAD\u201d'}
          className="w-full bg-[#1e2230] border border-[#2d3748] rounded-xl px-4 py-3 pl-11 
                     text-slate-200 placeholder:text-[#4a5568] focus:outline-none 
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-sm"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a5568]">
          {loading ? '⏳' : '🔍'}
        </span>
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setMeta(null) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-slate-300 text-lg"
          >✕</button>
        )}
      </div>

      {/* Status bar */}
      {meta && !loading && (
        <p className="text-xs text-[#718096] mb-4">
          {results.length === 0
            ? `No matches in ${meta.pdfCount} PDF${meta.pdfCount !== 1 ? 's' : ''}`
            : `${results.length} match${results.length !== 1 ? 'es' : ''} across ${Object.keys(grouped).length} file${Object.keys(grouped).length !== 1 ? 's' : ''} · searched ${meta.pdfCount} PDFs`
          }
        </p>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results grouped by file */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([file, hits]) => {
            const first = hits[0]
            const emoji = PERSON_EMOJI[first.person] ?? '📄'
            const fileName = file.split('/').pop() ?? file
            const totalHits = hits.reduce((s, h) => s + h.matchCount, 0)

            return (
              <div key={file} className="bg-[#1e2230] border border-[#2d3748] rounded-xl overflow-hidden">
                {/* File header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d3748] bg-[#161925]">
                  <span className="text-lg">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{fileName}</p>
                    <p className="text-xs text-[#718096]">
                      {first.year} · {first.person} · {totalHits} match{totalHits !== 1 ? 'es' : ''} on {hits.length} page{hits.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full font-medium">
                    {first.year}
                  </span>
                </div>

                {/* Page hits */}
                <div className="divide-y divide-[#2d3748]">
                  {hits.map((hit, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-medium text-[#718096] bg-[#0f1117] px-2 py-0.5 rounded">
                          Page {hit.page}
                        </span>
                        {hit.matchCount > 1 && (
                          <span className="text-xs text-[#4a5568]">{hit.matchCount}× found</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-mono">
                        {highlight(hit.snippet, query)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && query.length >= 2 && results.length === 0 && meta && (
        <div className="text-center py-12 text-[#4a5568]">
          <div className="text-4xl mb-3">🔎</div>
          <p className="text-sm">No matches for <span className="text-slate-400">"{query}"</span></p>
          <p className="text-xs mt-1">Try a different term or check if the PDF has been uploaded</p>
        </div>
      )}

      {/* Hint when empty */}
      {!query && (
        <div className="text-center py-12 text-[#4a5568]">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-sm">Type to search inside your tax returns</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {['W-2', 'capital gains', 'mortgage', '1099', 'EROAD', 'dividend'].map(term => (
              <button
                key={term}
                onClick={() => { setQuery(term); search(term) }}
                className="text-xs px-3 py-1.5 bg-[#1e2230] border border-[#2d3748] rounded-full text-[#718096] hover:text-slate-300 hover:border-[#4a5568] transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
