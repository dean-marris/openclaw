'use client'
import { useState, useCallback, useRef } from 'react'

type PageHit = {
  page: number
  matchCount: number
  snippets: string[]
}

type SearchResult = {
  file: string
  year: string
  person: string
  hits: PageHit[]
  totalMatches: number
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
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-400/40 text-yellow-100 rounded px-0.5 font-semibold">{part}</mark>
      : part
  )
}

export function SearchDocs() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState<{ pdfCount: number; query: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
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
        setExpanded({})
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

  const togglePage = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const totalHitsAcrossAll = results.reduce((s, r) => s + r.totalMatches, 0)

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h2 className="text-xl font-bold text-white mb-1">🔍 Search Tax Returns</h2>
      <p className="text-sm text-[#718096] mb-5">
        Full-text search across all uploaded tax PDFs. Each match shown with context.
      </p>

      {/* Search input */}
      <div className="relative mb-5">
        <input
          type="text"
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="e.g. W-2, capital gains, mortgage, EROAD, dividend"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-slate-300 text-lg px-1"
          >✕</button>
        )}
      </div>

      {/* Status bar */}
      {meta && !loading && (
        <p className="text-xs text-[#718096] mb-4">
          {results.length === 0
            ? `No matches in ${meta.pdfCount} PDF${meta.pdfCount !== 1 ? 's' : ''}`
            : `${totalHitsAcrossAll} match${totalHitsAcrossAll !== 1 ? 'es' : ''} across ${results.length} file${results.length !== 1 ? 's' : ''} · searched ${meta.pdfCount} PDFs`
          }
        </p>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-5">
        {results.map((result) => {
          const emoji = PERSON_EMOJI[result.person] ?? '📄'
          const fileName = result.file.split('/').pop() ?? result.file

          return (
            <div key={result.file} className="bg-[#1e2230] border border-[#2d3748] rounded-xl overflow-hidden">
              {/* File header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d3748] bg-[#161925]">
                <span className="text-lg">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{fileName}</p>
                  <p className="text-xs text-[#718096]">
                    {result.year} · {result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''} on {result.hits.length} page{result.hits.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                  {result.year}
                </span>
              </div>

              {/* Page hits */}
              <div className="divide-y divide-[#2d3748]">
                {result.hits.map((hit) => {
                  const pageKey = `${result.file}::${hit.page}`
                  const isExpanded = !!expanded[pageKey]
                  const visibleSnippets = isExpanded ? hit.snippets : hit.snippets.slice(0, 2)
                  const hiddenCount = hit.snippets.length - 2

                  return (
                    <div key={hit.page} className="px-4 py-3">
                      {/* Page badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-[#718096] bg-[#0f1117] px-2 py-1 rounded border border-[#2d3748]">
                          Page {hit.page}
                        </span>
                        <span className="text-xs text-blue-400 font-medium">
                          {hit.matchCount} match{hit.matchCount !== 1 ? 'es' : ''}
                        </span>
                      </div>

                      {/* Snippets */}
                      <div className="space-y-2">
                        {visibleSnippets.map((snippet, si) => (
                          <div key={si} className="bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-2.5">
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {highlight(snippet, query)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Show more / less toggle */}
                      {hit.snippets.length > 2 && (
                        <button
                          onClick={() => togglePage(pageKey)}
                          className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {isExpanded
                            ? '↑ Show less'
                            : `↓ Show ${hiddenCount} more match${hiddenCount !== 1 ? 'es' : ''} on this page`
                          }
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {!loading && query.length >= 2 && results.length === 0 && meta && (
        <div className="text-center py-12 text-[#4a5568]">
          <div className="text-4xl mb-3">🔎</div>
          <p className="text-sm">No matches for <span className="text-slate-400">&quot;{query}&quot;</span></p>
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
