'use client'
import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'

type ChunkResult = {
  _id: string
  fileName: string
  year: string
  person: string
  text: string
  pageNumber?: number
  chunkIndex: number
  _score: number
}

export function TaxSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ChunkResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const searchChunks = useAction(api.taxDocuments.searchChunks)

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setSearched(true)
    try {
      const chunks = await searchChunks({ query: q })
      setResults(chunks as ChunkResult[])
    } catch (e) {
      console.error('Search failed:', e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h2 className="text-xl font-bold text-white mb-1">🔍 Ask EJP</h2>
      <p className="text-sm text-[#718096] mb-5">
        Semantic search across all indexed tax documents using AI embeddings.
      </p>

      {/* Search input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. What were our capital gains in 2024?"
          className="flex-1 bg-[#1e2230] border border-[#2d3748] rounded-xl px-4 py-3
                     text-slate-200 placeholder:text-[#4a5568] focus:outline-none
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-sm"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/30
                     disabled:text-blue-400/50 text-white text-sm font-medium rounded-xl
                     transition-colors flex-shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching…
            </span>
          ) : (
            'Ask EJP'
          )}
        </button>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-[#718096] mb-2">
            {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>
          {results.map((chunk, i) => (
            <div
              key={chunk._id ?? i}
              className="bg-[#1e2230] border border-[#2d3748] rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d3748] bg-[#161925]">
                <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                  {chunk.year}
                </span>
                <p className="text-sm font-medium text-slate-200 truncate flex-1">
                  {chunk.fileName}
                </p>
                {chunk.pageNumber != null && (
                  <span className="text-xs text-[#718096] bg-[#0f1117] px-2 py-1 rounded border border-[#2d3748] flex-shrink-0">
                    Page {chunk.pageNumber}
                  </span>
                )}
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {chunk.text.length > 500 ? chunk.text.slice(0, 500) + '…' : chunk.text}
                </p>
                <p className="text-[10px] text-[#4a5568] mt-2">
                  {chunk.person} · score {chunk._score?.toFixed(3)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 text-[#4a5568]">
          <div className="text-4xl mb-3">🔎</div>
          <p className="text-sm">No results found for <span className="text-slate-400">&quot;{query}&quot;</span></p>
          <p className="text-xs mt-1">Try rephrasing your question or check if documents have been indexed</p>
        </div>
      )}

      {/* Initial empty state */}
      {!loading && !searched && (
        <div className="text-center py-12 text-[#4a5568]">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm">Ask EJP anything about your tax documents</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {['capital gains 2024', 'W-2 income', 'mortgage interest', 'EROAD dividends', 'NZ tax credits'].map(term => (
              <button
                key={term}
                onClick={() => { setQuery(term); }}
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
