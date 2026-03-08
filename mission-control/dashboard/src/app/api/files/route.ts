import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const STORAGE_ROOT = path.join(process.cwd(), '..', 'storage')

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export async function GET(req: NextRequest) {
  const encoded = req.nextUrl.searchParams.get('path')
  if (!encoded) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  // Decode base64 path
  let filePath: string
  try {
    filePath = Buffer.from(encoded, 'base64').toString('utf-8')
  } catch {
    return NextResponse.json({ error: 'Invalid path encoding' }, { status: 400 })
  }

  // Only allow paths within storage/2025-taxes/
  if (!filePath.startsWith('2025-taxes/')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const resolved = path.resolve(STORAGE_ROOT, filePath)
  if (!resolved.startsWith(path.resolve(STORAGE_ROOT))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const data = await readFile(resolved)
    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME[ext] || 'application/octet-stream'

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': ext === 'xlsx' ? `attachment; filename="${path.basename(filePath)}"` : 'inline',
        'Cache-Control': 'public, max-age=600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
