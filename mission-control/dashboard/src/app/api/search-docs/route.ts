import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir, stat } from 'fs/promises'
import path from 'path'
import * as pdfParseModule from 'pdf-parse'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buf: Buffer) => Promise<{ text: string; numpages: number }> = (pdfParseModule as any).default ?? pdfParseModule

const STORAGE_ROOT = path.join(process.cwd(), '..', 'storage')

export interface SearchResult {
  file: string          // relative path from storage root
  year: string
  person: string
  page: number
  snippet: string       // ~200 chars around the match
  matchCount: number
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
  // e.g. 2025-taxes/dean/file.pdf  OR  2023-taxes/file.pdf
  const yearDir = parts[0] || ''
  const yearMatch = yearDir.match(/(\d{4})/)
  const year = yearMatch ? yearMatch[1] : '?'
  const person = parts.length >= 3 ? parts[1] : 'all'
  return { year, person }
}

function getSnippet(text: string, query: string, snippetLen = 220): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return ''
  const start = Math.max(0, idx - 80)
  const end = Math.min(text.length, idx + query.length + 140)
  let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim()
  if (start > 0) snippet = '…' + snippet
  if (end < text.length) snippet = snippet + '…'
  return snippet
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get('q') || '').trim()

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

      // Search page by page
      // pdf-parse gives us full text; split by form-feed for pages
      const pages = data.text.split(/\f/)
      let totalMatches = 0

      pages.forEach((pageText: string, pageIndex: number) => {
        const lower = pageText.toLowerCase()
        const qLower = query.toLowerCase()
        let pos = 0
        let pageMatches = 0
        while ((pos = lower.indexOf(qLower, pos)) !== -1) {
          pageMatches++
          pos += qLower.length
        }
        if (pageMatches > 0) {
          totalMatches += pageMatches
          results.push({
            file: relPath,
            year,
            person,
            page: pageIndex + 1,
            snippet: getSnippet(pageText, query),
            matchCount: pageMatches,
          })
        }
      })
    } catch (e) {
      // skip unreadable PDFs
      console.error(`Failed to parse ${pdfPath}:`, e)
    }
  }

  // Sort: more matches first
  results.sort((a, b) => b.matchCount - a.matchCount)

  return NextResponse.json({ results, query, pdfCount: pdfs.length })
}
