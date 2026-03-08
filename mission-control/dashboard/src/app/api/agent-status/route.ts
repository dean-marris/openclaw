import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { execSync } from 'child_process'
import path from 'path'

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

async function getRecentActivity(agentKeywords: string[], windowMs = 30000): Promise<boolean> {
  try {
    const log = await readFile(getTodayLogPath(), 'utf8')
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
  const claudeRunning = isClaudeRunning()

  const [ejpActive, quillActive, flintActive, jackLogActive] = await Promise.all([
    getRecentActivity(['webchat', 'main', 'ejp'], 30000),
    getRecentActivity([':topic:20', 'topic:20', 'quill', 'tax filing'], 30000),
    getRecentActivity([':topic:21', 'topic:21', 'flint', 'investment'], 30000),
    getRecentActivity(['jack', 'coding', 'codex'], 30000),
  ])

  const jackActive = jackLogActive || claudeRunning

  const meeting = (ejpActive && quillActive) || (ejpActive && flintActive) || (quillActive && flintActive)

  return NextResponse.json({
    agents: {
      ejp:   { active: ejpActive,   position: ejpActive   ? (meeting ? 'meeting' : 'working') : 'desk' },
      quill: { active: quillActive, position: quillActive ? (meeting ? 'meeting' : 'working') : 'desk' },
      flint: { active: flintActive, position: flintActive ? (meeting ? 'meeting' : 'working') : 'desk' },
      jack:  { active: jackActive,  position: jackActive  ? 'working' : 'desk' },
    },
    meeting,
    timestamp: Date.now(),
  })
}
