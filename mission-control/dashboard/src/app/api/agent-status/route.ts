import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const LOG_PATH = '/tmp/openclaw/openclaw-2026-03-07.log'

async function getRecentActivity(agentKeywords: string[], windowMs = 30000): Promise<boolean> {
  try {
    const log = await readFile(LOG_PATH, 'utf8')
    const lines = log.split('\n').slice(-200)
    const cutoff = Date.now() - windowMs
    for (const line of lines.reverse()) {
      if (!line.trim()) continue
      try {
        const entry = JSON.parse(line)
        const ts = new Date(entry._meta?.date || 0).getTime()
        if (ts < cutoff) break
        const text = JSON.stringify(entry).toLowerCase()
        if (agentKeywords.some(k => text.includes(k))) return true
      } catch { continue }
    }
  } catch { /* log not found */ }
  return false
}

export async function GET() {
  const [ejpActive, quillActive, flintActive] = await Promise.all([
    getRecentActivity(['webchat', 'main', 'ejp'], 15000),
    getRecentActivity([':topic:20', 'topic:20', 'quill', 'tax filing'], 15000),
    getRecentActivity([':topic:21', 'topic:21', 'flint', 'investment'], 15000),
  ])

  // Determine positions
  const meeting = (ejpActive && quillActive) || (ejpActive && flintActive) || (quillActive && flintActive)

  return NextResponse.json({
    agents: {
      ejp:   { active: ejpActive,   position: ejpActive   ? (meeting ? 'meeting' : 'working') : 'desk' },
      quill: { active: quillActive, position: quillActive ? (meeting ? 'meeting' : 'working') : 'desk' },
      flint: { active: flintActive, position: flintActive ? (meeting ? 'meeting' : 'working') : 'desk' },
    },
    meeting,
    timestamp: Date.now(),
  })
}
