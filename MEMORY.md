# EJP Memory — Marris Family

Last updated: 2026-03-07

## Setup Status

- ✅ Workspace symlinked to repo: `/Users/deanmarris/My Drive/marris_openclaw`
- ✅ GitHub: https://github.com/dean-marris/openclaw (branch: main)
- ✅ Convex running locally at http://127.0.0.1:3210
- ✅ Telegram group "Marris_openclaw" connected (chat ID: -1003823883658, @EJPUS_bot)
- ✅ Tools: full profile (exec, read, write enabled)

## Family

| Name | Relation | Age |
|------|----------|-----|
| Dean Marris | Head of household | — |
| Virginia Marris | Wife | — |
| Ella Marris | Daughter | 21 |
| Jack Marris | Son | 19 |
| Phoebe Marris | Daughter | 16 |

## Tax Filing — 2025 (due April 15, 2026)

- 22 checklist items seeded in Convex, all status: pending
- State: Colorado (assumed — update if wrong)
- No income sources confirmed yet — need Dean to provide W-2/1099 details

## Key Paths

- Repo/workspace: `/Users/deanmarris/My Drive/marris_openclaw`
- Google Drive folder ID: `1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5`
- Convex: `mission-control/` (local deployment)
- Documents: `mission-control/storage/`

## Address & Filing

- **Home:** 9401 S Star Hill Circle, Lone Tree, Colorado 80124
- **State filing:** Colorado
- **Investment portfolio:** Split between USA and New Zealand

## Document Storage

Scanned tax docs go in:
`mission-control/storage/2025-taxes/<person>/`
- dean/, virginia/, ella/, jack/, phoebe/, joint/

Naming convention: `[person]-[type]-2025.pdf`
e.g. `dean-w2-2025.pdf`, `joint-mortgage-1098-2025.pdf`

## gog (Google Workspace CLI)

- ✅ Authorized: dean@marris.me (gmail, calendar, drive, contacts, docs, sheets)
- Keyring: **file backend** (macOS Keychain locked/inaccessible)
- Passphrase: stored in `~/.zshrc` as `GOG_KEYRING_PASSWORD`
- Always prefix gog commands with `GOG_KEYRING_PASSWORD="marrisopenclaw"` or source `.zshrc` first

## gog Gmail CLI

- ✅ Authenticated as `dean@marris.me`
- Keyring backend: **file** (never switch to keychain)
- Password stored in `~/.zshrc` as `GOG_KEYRING_PASSWORD="marrisopenclaw"`
- Always prefix commands: `GOG_KEYRING_PASSWORD="marrisopenclaw" gog ...`
- Henry Grant's email (Jan 29, 2026) contained 2023 & 2024 EFiled tax returns — downloaded and logged

## Stored Tax Documents

| File | Location | Convex ID |
|------|----------|-----------|
| 2023 Marris Dean & Virginia EFiled tax returns | `mission-control/storage/2023-taxes/` | j9729xqey85ampg5thm80cpvh582hds2 |
| 2024 Marris Dean & Virginia EFiled tax returns | `mission-control/storage/2024-taxes/` | j97ckmekzqpx94bqq4p62ez0n582h5b1 |

Source: Henry Grant, hgrant@snobile.com, S.Nobile & Company, NY

## Mission Control — URLs (LAN, home network only)

| Service | URL |
|---------|-----|
| Mission Control dashboard | http://10.0.0.31:3001 |
| OpenClaw Control UI | https://10.0.0.31:18791/#token=4a18f3ba05056dcbf1337c8e6c1aa6e0f6e0a13978f886a890188a6ab5ab2b83 |
| Convex local | http://127.0.0.1:3210 |

All three auto-start on boot via LaunchAgents. Caddy config: `~/.openclaw/Caddyfile`

## Agents

| Agent | Model | Workspace | Role |
|-------|-------|-----------|------|
| EJP (main) | claude-sonnet-4-6 | ~/.openclaw/workspace | Finance, tax, daily ops |
| Jack | gpt-5.3-codex | ~/My Drive/marris_openclaw/jack-workspace | Coding, Mission Control |

Jack's OpenAI API key stored in auth-profiles.json + OPENAI_API_KEY in ~/.zshrc

## Mission Control Features Built (2026-03-07)

- ✅ Tax Checklist (Convex-backed, toggle status)
- ✅ Upload Docs
- ✅ NZ Bank Import
- ✅ The Office (EJP + Jack desks, agent file viewer with SOUL/AGENTS/TOOLS/IDENTITY/SKILLS tabs)
- ✅ Ask EJP (RAG search over tax docs — ingestion still needed)
- ✅ Mobile-friendly with hamburger sidebar
- ⏳ Tax doc attachments on checklist items (Jack building overnight)

## RAG — Tax Document Search

- Backend built: `mission-control/convex/taxDocuments.ts`
- Ingestion script: `mission-control/scripts/ingest-tax-docs.ts`
- OPENAI_API_KEY in ~/.zshrc — run ingestion to populate index

## CPA / Tax Professionals

### BBS Tax (firm handling Marris 2025 returns)
- **Upload portal:** http://upload.bbstax.com

**John Carr** — Owner & Governing Director
- Email: john@ggocc.com
- Cell: +1 863-602-1274
- Address: P.O Box 780637, San Antonio TX 78278

**James Francesco** — Assistant to John Carr
- Email: james@bbsstax.com
- Cell: +1 210-861-2492

## TODO

- [ ] Run PDF ingestion script on 2023 + 2024 tax returns
- [ ] Confirm income sources for each family member (W-2, 1099, etc.)
- [ ] Populate SKILLS.md for EJP and Jack (Dean to do 2026-03-08)
- [ ] Set up Drive ingestion script (scan → storedFiles in Convex)
- [ ] Populate investments table
- [ ] Change password exposed in Telegram chat (S!adow2014)
