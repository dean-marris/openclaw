export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { readFile, readdir, mkdtemp, rm } from 'fs/promises'
import { exec as execCb } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import path from 'path'

const exec = promisify(execCb)

// pdfjs-dist is ESM — loaded via dynamic import inside extractPages()

const STORAGE_ROOT = path.join(process.cwd(), '..', 'storage')
const MAX_OCR_PAGES = 20   // safety cap per PDF to avoid timeout

export interface PageHit {
  page: number
  matchCount: number
  snippets: string[]
  ocr: boolean   // true = text came from OCR (was image-only)
}

export interface SearchResult {
  file: string
  year: string
  person: string
  hits: PageHit[]
  totalMatches: number
  totalPages: number
  ocrPages: number   // how many pages needed OCR
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
  } catch { /* skip unreadable dirs */ }
  return files
}

function extractMeta(filePath: string): { year: string; person: string } {
  const rel = path.relative(STORAGE_ROOT, filePath)
  const parts = rel.split(path.sep)
  const yearMatch = (parts[0] || '').match(/(\d{4})/)
  return {
    year: yearMatch ? yearMatch[1] : '?',
    person: parts.length >= 3 ? parts[1] : 'all',
  }
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

// OCR a single page of a PDF using gs (render) + tesseract (read)
async function ocrPage(pdfPath: string, pageNum: number, tmpDir: string): Promise<string> {
  const outPng = path.join(tmpDir, `page-${pageNum}.png`)
  const escapedPdf = pdfPath.replace(/'/g, "'\\''")
  const escapedPng = outPng.replace(/'/g, "'\\''")

  // Render at 300 DPI for good OCR accuracy
  await exec(
    `gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r300 -dFirstPage=${pageNum} -dLastPage=${pageNum} -sOutputFile='${escapedPng}' '${escapedPdf}' 2>/dev/null`
  )

  const { stdout } = await exec(
    `tesseract '${escapedPng}' stdout --psm 6 -l eng 2>/dev/null`
  )

  return stdout
}

// Extract text from each page via pdfjs-dist, with OCR fallback for image-only pages
async function extractPages(
  buffer: Buffer,
  pdfPath: string,
): Promise<{ pageNum: number; text: string; ocr: boolean }[]> {
  // Dynamic import — pdfjs-dist is ESM-only
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

  // First pass: collect native text per page, flag image-only pages
  const rawPages: { pageNum: number; text: string; imageOnly: boolean }[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = content.items.map((item: any) => item.str ?? '').join(' ')
    const charCount = text.replace(/\s+/g, '').length
    rawPages.push({ pageNum: i, text, imageOnly: charCount < 15 })
  }

  const imageOnlyNums = rawPages.filter(p => p.imageOnly).map(p => p.pageNum)

  // Second pass: OCR image-only pages (up to cap)
  let tmpDir: string | null = null
  const ocrResults: Record<number, string> = {}

  const pagesToOcr = imageOnlyNums.slice(0, MAX_OCR_PAGES)
  if (pagesToOcr.length > 0) {
    tmpDir = await mkdtemp(path.join(tmpdir(), 'ejp-ocr-'))
    try {
      for (const pageNum of pagesToOcr) {
        try {
          ocrResults[pageNum] = await ocrPage(pdfPath, pageNum, tmpDir)
        } catch (e) {
          console.error(`OCR failed for page ${pageNum}:`, e)
          ocrResults[pageNum] = ''
        }
      }
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  }

  return rawPages.map(p => ({
    pageNum: p.pageNum,
    text: p.imageOnly ? (ocrResults[p.pageNum] ?? '') : p.text,
    ocr: p.imageOnly,
  }))
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
      const pages = await extractPages(buffer, pdfPath)

      const hits: PageHit[] = []
      let ocrPages = 0

      for (const { pageNum, text, ocr } of pages) {
        if (ocr) ocrPages++

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
            ocr,
          })
        }
      }

      if (hits.length > 0) {
        results.push({
          file: relPath,
          year,
          person,
          hits,
          totalMatches: hits.reduce((s, h) => s + h.matchCount, 0),
          totalPages: pages.length,
          ocrPages,
        })
      }
    } catch (e) {
      console.error(`Failed to process ${pdfPath}:`, e)
    }
  }

  results.sort((a, b) => b.totalMatches - a.totalMatches)
  return NextResponse.json({ results, query, pdfCount: pdfs.length })
}
