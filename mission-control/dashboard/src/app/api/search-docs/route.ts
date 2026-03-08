export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import path from 'path'

// pdfjs-dist is ESM — loaded via dynamic import inside the handler

const STORAGE_ROOT = path.join(process.cwd(), '..', 'storage')

export interface PageHit {
  page: number
  matchCount: number
  snippets: string[]
  imageOnly: boolean   // true if no text could be extracted from this page
}

export interface SearchResult {
  file: string
  year: string
  person: string
  hits: PageHit[]
  totalMatches: number
  totalPages: number
  imageOnlyPages: number  // pages we couldn't search (scanned images)
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

function getSnippets(pageText: string, query: string, maxHits = 8, contextChars = 200): string[] {
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

// Extract text from each page using pdfjs-dist (accurate per-page)
async function extractPages(buffer: Buffer): Promise<{ pageNum: number; text: string }[]> {
  // Dynamic import required — pdfjs-dist is ESM-only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(buffer)
  const doc = await pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    disableWorker: true,
    verbosity: 0,
  }).promise

  const pages: { pageNum: number; text: string }[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = content.items.map((item: any) => item.str ?? '').join(' ')
    pages.push({ pageNum: i, text })
  }

  return pages
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
      const { year, person } = extractMeta(pdfPath)
      const relPath = path.relative(STORAGE_ROOT, pdfPath)

      const pages = await extractPages(buffer)
      const hits: PageHit[] = []
      let imageOnlyPages = 0

      for (const { pageNum, text } of pages) {
        const charCount = text.replace(/\s+/g, '').length
        const isImageOnly = charCount < 15

        if (isImageOnly) {
          imageOnlyPages++
          continue
        }

        const lower = text.toLowerCase()
        const qLower = query.toLowerCase()
        let pos = 0
        let matchCount = 0
        while ((pos = lower.indexOf(qLower, pos)) !== -1) {
          matchCount++
          pos += qLower.length
        }

        if (matchCount > 0) {
          hits.push({
            page: pageNum,
            matchCount,
            snippets: getSnippets(text, query),
            imageOnly: false,
          })
        }
      }

      if (hits.length > 0 || imageOnlyPages > 0) {
        const totalMatches = hits.reduce((s, h) => s + h.matchCount, 0)
        if (totalMatches > 0) {
          results.push({
            file: relPath,
            year,
            person,
            hits,
            totalMatches,
            totalPages: pages.length,
            imageOnlyPages,
          })
        }
      }
    } catch (e) {
      console.error(`Failed to parse ${pdfPath}:`, e)
    }
  }

  results.sort((a, b) => b.totalMatches - a.totalMatches)

  return NextResponse.json({ results, query, pdfCount: pdfs.length })
}
