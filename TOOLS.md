# TOOLS.md - EJP Local Notes

## Identity & Hardware

- **Name:** EJP 📊
- **Lives on:** Dean Marris's Apple Mac (MacBook Pro, Lone Tree Colorado)
- **Default speaker:** Dean's Apple Mac (system audio)
- **Timezone:** America/Denver (MST/MDT)

---

## Core Strengths

### 💰 Finance & Tax
- Annual tax filing (US federal + Colorado state + NZ obligations)
- FBAR / FinCEN 114 — foreign bank account reporting (>$10k aggregate)
- Foreign Tax Credit (Form 1116) — NZ-source income on US returns
- Capital gains/losses — EROAD shares, cost basis tracking
- K-1 / trust distributions — tracking Dean & Virginia's NZ income into US returns
- Checklist management via Convex (http://127.0.0.1:3210)
- CPA coordination — BBS Tax (John Carr / James Francesco)

### 📄 Document Parsing
- **CSV import** — ASB bank statements (multi-account), NZ bank formats (ANZ, BNZ, Westpac, Kiwibank)
  - Auto-detects accounts, extracts transactions, tracks highest balance per account
  - Year filtering, credit/debit classification
- **PDF parsing** — annual tax returns (2023, 2024, 2025), W-2, 1099, K-1, 1098
  - Extract via `pdf` tool with vision fallback
  - Store in `mission-control/storage/<year>-taxes/<person>/`
- **Image uploads** — scanned documents, photos of tax forms
  - Vision model for OCR and data extraction
  - Naming: `[person]-[type]-[year].pdf`

### 📁 Document Storage
- Local path: `/Users/deanmarris/My Drive/marris_openclaw/mission-control/storage/`
- Structure: `<year>-taxes/<person>/` (dean, virginia, ella, jack, phoebe, joint)
- Convex file records: `storedFiles` table

### 🏦 Bank Import
- Dashboard: http://10.0.0.31:5174 → 🏦 ASB Accounts tab
- ASB CSV multi-account import — parses all accounts in one file
- Highest balance tracking per account (required for FBAR/CPA)
- CPA upload portal: http://upload.bbstax.com

---

## Key Paths

| Resource | Path |
|----------|------|
| Workspace / repo | `/Users/deanmarris/My Drive/marris_openclaw` |
| Mission Control app | `/Users/deanmarris/My Drive/marris_openclaw/mission-control` |
| Dashboard (local network) | http://10.0.0.31:5174 |
| Convex backend | http://127.0.0.1:3210 |
| Tax document storage | `mission-control/storage/` |
| Google Drive folder | ID: `1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5` |

---

## Google Workspace (gog)

- Account: dean@marris.me
- Keyring: **file backend** — always prefix with `GOG_KEYRING_PASSWORD="marrisopenclaw"`
- Services: gmail, calendar, drive, contacts, docs, sheets
- Example: `GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "henry grant"`

---

## TTS / Audio

- Default speaker: **Apple Mac** (Dean Marris's MacBook Pro)
- Use system audio output — no HomePod or external speaker configured

---

## Agents

| Agent | Role | Model | Channel |
|-------|------|-------|---------|
| EJP (me) | Finance & Tax orchestrator | claude-sonnet-4-6 | Main / Topic 1 |
| Quill 🪶 | Tax specialist | claude-sonnet-4-6 | Telegram Topic 20 |
| Flint 🔥 | Investment portfolio | claude-sonnet-4-6 | Telegram Topic 21 |
| Jack 🤖 | Coding agent | claude-sonnet-4-6 | jack-workspace |
