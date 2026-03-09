import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { execSync } from 'child_process'
import path from 'path'

const STORAGE_ROOT = path.join(process.cwd(), '..', 'storage', '2025-taxes')
const CONVEX_URL = 'http://127.0.0.1:3210'
const GDRIVE_ROOT = '1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5'

const PERSON_PATTERNS: Record<string, string[]> = {
  dean:     ['dean', 'deans'],
  virginia: ['virginia', 'ginnie', 'ginny'],
  ella:     ['ella'],
  jack:     ['jack'],
  phoebe:   ['phoebe'],
  joint:    ['joint', 'mortgage', 'property', 'donation', 'nz', 'eroad', 'bank'],
}

// Keyword → checklist item text fragment for auto-linking
const DOC_KEYWORDS: [RegExp, string][] = [
  [/1098[\-_]?t/i, 'Education expenses (1098-T tuition statement)'],
  [/1099[\-_]?nec/i, 'W-2 or 1099 income documents'],
  [/1095/i, '1095-C Employer-Provided Health Insurance'],
  [/1099/i, 'W-2 or 1099 income documents'],
  [/w[\-_]?2/i, 'W-2 or 1099 income documents'],
]

function detectFolder(filename: string): string {
  const lower = filename.toLowerCase()
  for (const [folder, patterns] of Object.entries(PERSON_PATTERNS)) {
    if (patterns.some(p => lower.includes(p))) return folder
  }
  return 'joint'
}

function fileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image'
  if (ext === 'csv') return 'csv'
  if (ext === 'xlsx') return 'xlsx'
  return 'other'
}

async function convexMutation(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args }),
  })
  return res.json()
}

async function convexQuery(fnPath: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fnPath, args }),
  })
  return res.json()
}

// Find or create a person subfolder in Google Drive
// Maps person name → Drive folder ID under GDRIVE_ROOT
const driveSubfolderCache: Record<string, string> = {}

// Hardcoded IDs for the known subfolders under marris_openclaw/mission-control/storage/2025-taxes/
// These were confirmed via gog drive ls on 2026-03-08
const KNOWN_SUBFOLDER_IDS: Record<string, string> = {
  dean:     '17X6mq2o8eJUlwazIpzGG2F9j2tRJmwfk',
  ella:     '1H4vjQTqUaH7Wy3eZ07uZ0Gtln8WyIoqr',
  joint:    '1RrnkAwY0wqRXp1tXJUW1L5N7LGlFqgLD',
  virginia: '1Mt76nQc9e71598-wUia7QC-64TK6ZarZ',
  jack:     '1hnSRf0-SYHOdi1W4JLlgBnjbXyW_VdPj',
  phoebe:   '1mRtt91HnZyRUEvNafk3m9ebks3_g3G1x',
}

async function getDriveSubfolder(person: string): Promise<string> {
  if (driveSubfolderCache[person]) return driveSubfolderCache[person]

  // Use known IDs first — fast and reliable
  if (KNOWN_SUBFOLDER_IDS[person]) {
    driveSubfolderCache[person] = KNOWN_SUBFOLDER_IDS[person]
    return KNOWN_SUBFOLDER_IDS[person]
  }

  try {
    // gog drive ls --json returns a plain array, not { files: [] }
    const out = execSync(
      `GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive ls --parent "${GDRIVE_ROOT}" --json --query "name='${person}'"`,
      { encoding: 'utf-8', timeout: 15000 }
    )
    const parsed = JSON.parse(out)
    // Handle both array and { files: [] } shapes
    const items: { id: string }[] = Array.isArray(parsed) ? parsed : (parsed.files ?? [])
    if (items.length > 0) {
      driveSubfolderCache[person] = items[0].id
      return items[0].id
    }

    // Create subfolder
    const mkOut = execSync(
      `GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive mkdir "${person}" --parent "${GDRIVE_ROOT}" --json`,
      { encoding: 'utf-8', timeout: 15000 }
    )
    const mkParsed = JSON.parse(mkOut)
    const folderId = mkParsed.id || mkParsed.fileId || mkParsed.folderId
    if (folderId) {
      driveSubfolderCache[person] = folderId
      return folderId
    }
  } catch {
    // Fall back to root folder
  }
  return GDRIVE_ROOT
}

async function matchChecklist(person: string, filename: string): Promise<string | null> {
  const lower = filename.toLowerCase()

  // Find keyword match
  let matchText: string | null = null
  for (const [regex, text] of DOC_KEYWORDS) {
    if (regex.test(lower)) {
      matchText = text
      break
    }
  }
  if (!matchText) return null

  // Query checklist items for year 2025
  try {
    const data = await convexQuery('taxChecklist:listByYear', { year: '2025' })
    const items = data.value as { _id: string; item: string }[] | undefined
    if (!items) return null

    // Find best match: person prefix + keyword fragment
    const personCap = person.charAt(0).toUpperCase() + person.slice(1)
    const match = items.find(
      (i) => i.item.startsWith(personCap) && i.item.includes(matchText!)
    )
    if (match) return match._id

    // Fall back: Joint items (items not prefixed by any person name)
    const fallback = items.find(
      (i) => i.item.includes(matchText!) && !['Dean', 'Virginia', 'Ella', 'Jack', 'Phoebe'].some(p => i.item.startsWith(p))
    )
    return fallback?._id ?? null
  } catch {
    return null
  }
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

    // 1. Save to local filesystem
    const bytes = await file.arrayBuffer()
    const dest = path.join(destDir, file.name)
    await writeFile(dest, Buffer.from(bytes))

    const storagePath = `2025-taxes/${folder}/${file.name}`
    const ft = fileType(file.name)
    const ts = Date.now()

    // 2. Convex: storedFiles record
    let storedFileOk = false
    try {
      await convexMutation('storage:add', {
        path: storagePath,
        name: file.name,
        category: 'tax',
        year: '2025',
        person: folder,
      })
      storedFileOk = true
    } catch { /* non-fatal */ }

    // 3. Convex: attachments record (auto-link to checklist)
    let attachmentOk = false
    let matchedItemId: string | null = null
    try {
      matchedItemId = await matchChecklist(folder, file.name)
      if (matchedItemId) {
        await convexMutation('attachments:addAttachment', {
          checklistItemId: matchedItemId,
          fileName: file.name,
          fileType: ft,
          storagePath,
          year: '2025',
          person: folder,
          uploadedAt: ts,
        })
        attachmentOk = true
      }
    } catch { /* non-fatal */ }

    // 4. Google Drive upload
    let driveOk = false
    try {
      const parentId = await getDriveSubfolder(folder)
      execSync(
        `GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive upload "${dest}" --parent "${parentId}" --no-input`,
        { timeout: 30000 }
      )
      driveOk = true
    } catch { /* non-fatal */ }

    return NextResponse.json({
      ok: true,
      filename: file.name,
      folder,
      path: dest,
      size: file.size,
      storedFile: storedFileOk,
      attachment: attachmentOk,
      matchedItemId,
      drive: driveOk,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
