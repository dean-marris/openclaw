import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const ALLOWED_FILES = ['SOUL.md', 'AGENTS.md', 'TOOLS.md', 'IDENTITY.md', 'MEMORY.md', 'SKILLS.md']

const AGENT_PATHS: Record<string, string> = {
  ejp:   '/Users/deanmarris/.openclaw/workspace',
  quill: '/Users/deanmarris/My Drive/marris_openclaw/agents/tax-agent',
  flint: '/Users/deanmarris/My Drive/marris_openclaw/agents/flint',
  jack:  '/Users/deanmarris/My Drive/marris_openclaw/jack-workspace',
}

export async function GET(req: NextRequest) {
  const agent = req.nextUrl.searchParams.get('agent')
  const file = req.nextUrl.searchParams.get('file')

  if (!agent || !file) {
    return NextResponse.json({ error: 'Missing agent or file parameter' }, { status: 400 })
  }

  if (!AGENT_PATHS[agent]) {
    return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 400 })
  }

  if (!ALLOWED_FILES.includes(file)) {
    return NextResponse.json({ error: `File not allowed: ${file}` }, { status: 400 })
  }

  const filePath = join(AGENT_PATHS[agent], file)

  try {
    const content = await readFile(filePath, 'utf-8')
    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ error: `File not found: ${file}` }, { status: 404 })
  }
}
