import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const STORAGE_ROOT = path.join(process.cwd(), '..', 'storage', '2025-taxes')

const PERSON_PATTERNS: Record<string, string[]> = {
  dean:     ['dean', 'deans'],
  virginia: ['virginia', 'ginny'],
  ella:     ['ella'],
  jack:     ['jack'],
  phoebe:   ['phoebe'],
  joint:    ['joint', 'mortgage', 'property', 'donation', 'nz', 'eroad', 'bank'],
}

function detectFolder(filename: string): string {
  const lower = filename.toLowerCase()
  for (const [folder, patterns] of Object.entries(PERSON_PATTERNS)) {
    if (patterns.some(p => lower.includes(p))) return folder
  }
  return 'joint'
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File
    const forcePerson = form.get('person') as string | null

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const folder = forcePerson || detectFolder(file.name)
    const destDir = path.join(STORAGE_ROOT, folder)
    await mkdir(destDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const dest = path.join(destDir, file.name)
    await writeFile(dest, Buffer.from(bytes))

    return NextResponse.json({
      ok: true,
      filename: file.name,
      folder,
      path: dest,
      size: file.size,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
