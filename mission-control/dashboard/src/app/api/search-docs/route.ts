export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import path from 'path'
// pdf-parse v1 exports a plain function
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string; numpages: number }> = require('pdf-parse')

const STORAGE_ROOT = path.join(process.cwd(), '..', 'storage')

export interface PageHit {
  page: number
  matchCount: number
  snippets: string[]   // one snippet per occurrence (up to 8 per page)
}

export interface SearchResult {
  file: string
  year: string
  person: string
  hits: PageHit[]
  totalMatches: number
}

async function findPDFs(dir: string): Promise<string[]> {
  const files: string[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...await findPDFs(full))
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        files.push(full)
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return files
}

function extractMeta(filePath: string): { year: string; person: string } {
  const rel = path.relative(STORAGE_ROOT, filePath)
  const parts = rel.split(path.sep)
  const yearDir = parts[0] || ''
  const yearMatch = yearDir.match(/(\d{4})/)
  const year = yearMatch ? yearMatch[1] : '?'
  const person = parts.length >= 3 ? parts[1] : 'all'
  return { year, person }
}

// Extract up to maxHits individual context snippets from pageText for a given query
function getSnippets(pageText: string, query: string, maxHits = 8, contextChars = 180): string[] {
  const clean = pageText.replace(/\s+/g, ' ')
  const lower = clean.toLowerCase()
  const qLower = query.toLowerCase()
  const snippets: string[] = []
  let pos = 0

  while (snippets.length < maxHits) {
    const idx = lower.indexOf(qLower, pos)
    if (idx === -1) break

    const start = Math.max(0, idx - contextChars)
    const end = Math.min(clean.length, idx + qLower.length + contextChars)
    let snippet = clean.slice(start, end).trim()
    if (start > 0) snippet = '…' + snippet
    if (end < clean.length) snippet = snippet + '…'
    snippets.push(snippet)

    pos = idx + qLower.length
  }

  return snippets
}

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get('q') || '').trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], error: 'Query too short' })
  }

  const pdfs = await findPDFs(STORAGE_ROOT)
  const results: SearchResult[] = []

  for (const pdfPath of pdfs) {
    try {
      const buffer = await readFile(pdfPath)
      const data = await pdfParse(buffer)
      const { year, person } = extractMeta(pdfPath)
      const relPath = path.relative(STORAGE_ROOT, pdfPath)

      const pages = data.text.split(/\f/)
      const hits: PageHit[] = []

      pages.forEach((pageText: string, pageIndex: number) => {
        const lower = pageText.toLowerCase()
        const qLower = query.toLowerCase()
        let pos = 0
        let matchCount = 0
        while ((pos = lower.indexOf(qLower, pos)) !== -1) {
          matchCount++
          pos += qLower.length
        }
        if (matchCount > 0) {
          hits.push({
            page: pageIndex + 1,
            matchCount,
            snippets: getSnippets(pageText, query),
          })
        }
      })

      if (hits.length > 0) {
        const totalMatches = hits.reduce((s, h) => s + h.matchCount, 0)
        results.push({ file: relPath, year, person, hits, totalMatches })
      }
    } catch (e) {
      console.error(`Failed to parse ${pdfPath}:`, e)
    }
  }

  results.sort((a, b) => b.totalMatches - a.totalMatches)

  return NextResponse.json({ results, query, pdfCount: pdfs.length })
}
