export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { readFile, mkdtemp, rm } from 'fs/promises'
import { exec as execCb } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import path from 'path'

const exec = promisify(execCb)

const STORAGE_ROOT = path.join(process.cwd(), '..', 'storage')

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const file = searchParams.get('file')    // e.g. "2024-taxes/2024 Marris...pdf"
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  if (!file || isNaN(page) || page < 1) {
    return new NextResponse('Bad request', { status: 400 })
  }

  // Security: resolve and confirm it stays inside STORAGE_ROOT
  const resolved = path.resolve(STORAGE_ROOT, file)
  if (!resolved.startsWith(STORAGE_ROOT)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  let tmpDir: string | null = null
  try {
    tmpDir = await mkdtemp(path.join(tmpdir(), 'ejp-page-'))
    const outPng = path.join(tmpDir, 'page.png')

    const escapedPdf = resolved.replace(/'/g, "'\\''")
    const escapedPng = outPng.replace(/'/g, "'\\''")

    // Render at 150 DPI — good quality, reasonable size (~200–400KB per page)
    await exec(
      `gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r150 ` +
      `-dFirstPage=${page} -dLastPage=${page} ` +
      `-sOutputFile='${escapedPng}' '${escapedPdf}' 2>/dev/null`
    )

    const buf = await readFile(outPng)

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'image/png',
        // Cache for 10 minutes — pages don't change often
        'Cache-Control': 'public, max-age=600',
      },
    })
  } catch (e) {
    console.error('page-image error:', e)
    return new NextResponse('Render failed', { status: 500 })
  } finally {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true })
  }
}
