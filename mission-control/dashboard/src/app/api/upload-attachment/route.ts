import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const STORAGE_ROOT = path.join(process.cwd(), '..', 'storage', '2025-taxes')
const CONVEX_URL = 'http://127.0.0.1:3210'

function fileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image'
  if (ext === 'csv') return 'csv'
  if (ext === 'xlsx') return 'xlsx'
  return 'other'
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File
    const checklistItemId = form.get('checklistItemId') as string
    const year = form.get('year') as string || '2025'
    const person = form.get('person') as string || 'joint'

    if (!file || !checklistItemId) {
      return NextResponse.json({ error: 'Missing file or checklistItemId' }, { status: 400 })
    }

    const folder = person.toLowerCase()
    const destDir = path.join(STORAGE_ROOT, folder)
    await mkdir(destDir, { recursive: true })

    const ts = Date.now()
    const safeName = `${ts}-${file.name}`
    const dest = path.join(destDir, safeName)
    const bytes = await file.arrayBuffer()
    await writeFile(dest, Buffer.from(bytes))

    const storagePath = `2025-taxes/${folder}/${safeName}`
    const ft = fileType(file.name)

    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'attachments:addAttachment',
        args: {
          checklistItemId,
          fileName: file.name,
          fileType: ft,
          storagePath,
          year,
          person,
          uploadedAt: ts,
        },
      }),
    })

    return NextResponse.json({ success: true, fileName: file.name, storagePath })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
