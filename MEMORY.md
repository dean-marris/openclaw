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

## TODO

- [ ] Confirm income sources for each family member (W-2, 1099, etc.)
- [ ] Confirm state of filing (Colorado?)
- [ ] Build mission-control dashboard/UI
- [ ] Set up Drive ingestion script (scan → storedFiles in Convex)
- [ ] Populate investments table
