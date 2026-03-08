# SKILLS.md — Tax Agent 🧾

General-purpose tax document agent. Use these skills to handle document ingestion,
checklist updates, and storage management.

---

## 🗄️ Convex — Checklist Operations

```bash
# Full checklist (all items)
curl -s http://127.0.0.1:3210/api/query \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:list","args":{}}'

# Items by person
curl -s http://127.0.0.1:3210/api/query \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:listByPerson","args":{"person":"dean"}}'

# Mark done
curl -s http://127.0.0.1:3210/api/mutation \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:markDone","args":{"id":"<id>","notes":"<notes>"}}'
```

**Convex URL:** `http://127.0.0.1:3210`

---

## 📂 Storage Layout

```
mission-control/storage/2025-taxes/
  dean/      virginia/      ella/      jack/      phoebe/      joint/
```

Naming convention: `[person]-[doctype]-2025.pdf`

Examples:
- `dean-w2-2025.pdf`
- `virginia-1099div-2025.pdf`
- `joint-mortgage-1098-2025.pdf`
- `ella-1098t-tuition-2025.pdf`
- `joint-eroad-brokerage-2025.pdf`

---

## 🔍 Search Stored PDFs

```bash
# Search text inside all uploaded tax docs
curl "http://localhost:3000/api/search-docs?q=<term>"

# Examples
curl "http://localhost:3000/api/search-docs?q=taxable+income"
curl "http://localhost:3000/api/search-docs?q=charitable"
curl "http://localhost:3000/api/search-docs?q=refund"
```

---

## 📧 Gmail — Document Hunt

```bash
# Key search patterns for tax docs
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "tax document 2025" --limit 20
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "W-2 OR 1099 2025" --limit 20
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "1098-T OR 1098-E 2025" --limit 10
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "from:hgrant@snobile.com" --limit 10

# Download attachment
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail attachment <message_id> \
  --save-to "mission-control/storage/2025-taxes/<person>/<file>.pdf"
```

---

## 🏃 Document Ingestion Workflow

When a new document arrives (email, upload, or Drive):

1. **Identify** — what type? W-2, 1099-B, 1098, K-1?
2. **Route** — which person? dean / virginia / ella / jack / phoebe / joint?
3. **Save** — `mission-control/storage/2025-taxes/<person>/<name>.pdf`
4. **Match** — find the corresponding checklist item in Convex
5. **Mark done** — update status in Convex with notes
6. **Confirm** — notify EJP / Dean via Telegram

---

## 📅 Key Deadlines

| Deadline | Item |
|----------|------|
| April 15, 2026 | Federal 1040 |
| April 15, 2026 | Colorado DR 0104 |
| April 15, 2026 | FBAR FinCEN 114 (if NZ accounts > $10k USD) |
| October 15, 2026 | Extension deadline (if extension filed) |

---

## 🔗 Key Contacts

- **CPA:** Henry Grant — hgrant@snobile.com — S.Nobile & Company, NY
- **Prior returns on file:** 2023 + 2024 (both in `mission-control/storage/`)
