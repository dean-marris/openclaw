import { NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { execSync } from 'child_process'
import path from 'path'

const STATUS_FILE = '/tmp/openclaw/agent-status.json'

function getTodayLogPath(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `/tmp/openclaw/openclaw-${yyyy}-${mm}-${dd}.log`
}

function isClaudeRunning(): boolean {
  try {
    const out = execSync('pgrep -f "claude --dangerously-skip-permissions" 2>/dev/null || true', { encoding: 'utf8' })
    return out.trim().length > 0
  } catch { return false }
}

/** Check status file written by agents when they process a message */
async function getStatusFileActivity(): Promise<Record<string, number>> {
  try {
    const raw = await readFile(STATUS_FILE, 'utf8')
    return JSON.parse(raw)
  } catch { return {} }
}

/**
 * Check if webchat is currently connected by looking at the last
 * webchat connected/disconnected event in the log.
 */
async function isWebchatConnected(): Promise<boolean> {
  try {
    const log = await readFile(getTodayLogPath(), 'utf8')
    const lines = log.split('\n').filter(l => l.trim())
    // Walk backwards to find the last webchat connect/disconnect event
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i])
        const msg: string = entry['1'] || ''
        if (msg.includes('webchat connected')) return true
        if (msg.includes('webchat disconnected')) return false
      } catch { continue }
    }
  } catch { /* log not found */ }
  return false
}

/** Look for recent activity in log matching keywords, wider 5-minute window */
async function getRecentActivity(agentKeywords: string[], windowMs = 300000): Promise<boolean> {
  try {
    const log = await readFile(getTodayLogPath(), 'utf8')
    const lines = log.split('\n').slice(-500)
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
  const [claudeRunning, webchatConnected, statusFile, quillActive, flintActive, jackLogActive] = await Promise.all([
    Promise.resolve(isClaudeRunning()),
    isWebchatConnected(),
    getStatusFileActivity(),
    getRecentActivity([':topic:20', 'topic:20', 'quill', 'tax filing'], 300000),
    getRecentActivity([':topic:21', 'topic:21', 'flint', 'investment'], 300000),
    getRecentActivity(['jack', 'coding', 'codex'], 300000),
  ])

  const now = Date.now()
  const ACTIVE_WINDOW = 5 * 60 * 1000 // 5 minutes

  // EJP is active if webchat is connected (Dean is chatting with me)
  // OR if the status file was updated recently
  const ejpActive = webchatConnected || (!!statusFile.ejp && now - statusFile.ejp < ACTIVE_WINDOW)
  const jackActive = jackLogActive || claudeRunning || (!!statusFile.jack && now - statusFile.jack < ACTIVE_WINDOW)

  const quillFinal = quillActive || (!!statusFile.quill && now - statusFile.quill < ACTIVE_WINDOW)
  const flintFinal = flintActive || (!!statusFile.flint && now - statusFile.flint < ACTIVE_WINDOW)

  const meeting = (ejpActive && quillFinal) || (ejpActive && flintFinal) || (quillFinal && flintFinal)

  return NextResponse.json({
    agents: {
      ejp:   { active: ejpActive,   position: ejpActive   ? (meeting ? 'meeting' : 'working') : 'desk' },
      quill: { active: quillFinal,  position: quillFinal  ? (meeting ? 'meeting' : 'working') : 'desk' },
      flint: { active: flintFinal,  position: flintFinal  ? (meeting ? 'meeting' : 'working') : 'desk' },
      jack:  { active: jackActive,  position: jackActive  ? 'working' : 'desk' },
    },
    meeting,
    webchatConnected,
    timestamp: Date.now(),
  })
}

/** POST /api/agent-status — agents call this to mark themselves active */
export async function POST(req: Request) {
  try {
    const { agent } = await req.json()
    const current = await getStatusFileActivity()
    current[agent] = Date.now()
    await writeFile(STATUS_FILE, JSON.stringify(current))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
