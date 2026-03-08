# SKILLS.md — EJP (Mission Control)

EJP is the orchestrator. These are the skills you can use and how.

---

## 🗄️ Convex — Structured Data

**When:** Querying/updating the checklist, storedFiles, investments tables.

```bash
# List checklist items
curl -s http://127.0.0.1:3210/api/query \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:list","args":{}}'

# Mark a checklist item done
curl -s http://127.0.0.1:3210/api/mutation \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:markDone","args":{"id":"<convex_id>"}}'

# List stored files
curl -s http://127.0.0.1:3210/api/query \
  -H "Content-Type: application/json" \
  -d '{"path":"storage:list","args":{}}'
```

**Schema:** `taxChecklist`, `storedFiles`, `investments`, `taxDocumentChunks`

---

## 📧 Gmail — gog CLI

**When:** Searching for tax documents, W-2 emails, brokerage statements.

```bash
# Always prefix with keyring password
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "W-2 2025" --limit 10
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "1099 Marris" --limit 10
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "from:hgrant@snobile.com" --limit 5

# Download attachment
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail attachment <message_id> --save-to /path/to/file
```

**Account:** dean@marris.me  
**Keyring:** file backend — always use `GOG_KEYRING_PASSWORD="marrisopenclaw"`

---

## 📁 Google Drive — gog CLI

**When:** Fetching tax documents, statements, or financial files from Drive.

```bash
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive search "tax 2025"
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive download <file_id> --output /path/to/file
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive list --folder-id 1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5
```

**Tax docs folder ID:** `1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5`

---

## 🔍 PDF Search — Mission Control API

**When:** Searching the content of uploaded tax returns.

```bash
# Search (returns JSON with page hits + snippets)
curl "http://localhost:3000/api/search-docs?q=W-2"
curl "http://localhost:3000/api/search-docs?q=EROAD"

# Render a specific page to PNG (for visual review)
curl "http://localhost:3000/api/page-image?file=2024-taxes%2F2024+Marris...pdf&page=4" \
  --output page4.png
```

**OCR:** Image-only pages are auto-OCR'd via Ghostscript + Tesseract.

---

## 🔬 PDF Text Extraction — CLI

**When:** Extracting raw text from a PDF without the API.

```bash
# Using pdftotext (if available)
pdftotext "path/to/file.pdf" -

# Using gs + tesseract for scanned pages
gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r300 \
   -dFirstPage=N -dLastPage=N \
   -sOutputFile=/tmp/page.png input.pdf 2>/dev/null
tesseract /tmp/page.png stdout --psm 6 2>/dev/null
```

---

## 📂 Document Storage

**When:** Organising or reading uploaded tax documents.

```
mission-control/storage/
  2023-taxes/   — 2023 EFiled return (Dean & Virginia)
  2024-taxes/   — 2024 EFiled return (Dean & Virginia)
  2025-taxes/
    dean/       — Dean's individual docs
    virginia/   — Virginia's docs
    ella/       — Ella's docs
    jack/       — Jack's docs
    phoebe/     — Phoebe's docs
    joint/      — Joint/shared docs (mortgage, NZ, EROAD)
```

**Naming:** `[person]-[type]-2025.pdf`  e.g. `dean-w2-2025.pdf`

---

## 🤝 Agent Coordination

| Agent | Speciality | How to reach |
|-------|-----------|--------------|
| Flint 🔥 | Investment portfolio, EROAD, NZX, KiwiSaver | Convex + Telegram topic 21 |
| Quill 🪶 | Tax filing, checklist, deadlines, Form 1116 | Convex + Telegram topic 20 |
| EJP 📊 | Orchestrator, memory, family overview | Main session |

---

## 🧠 Memory

- **Short-term:** `memory/YYYY-MM-DD.md` — daily log
- **Long-term:** `MEMORY.md` — curated facts (only in main session)
- **Heartbeat state:** `memory/heartbeat-state.json`
