# SKILLS.md — Quill 🪶 (Tax Filing Specialist)

---

## 🗄️ Convex — Tax Checklist

**When:** Reading status, marking items done, adding notes.

```bash
# Get full checklist for 2025
curl -s http://127.0.0.1:3210/api/query \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:listByYear","args":{"year":"2025"}}'

# Mark an item done (requires the Convex document ID)
curl -s http://127.0.0.1:3210/api/mutation \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:markDone","args":{"id":"<convex_id>","notes":"Received via email 2026-03-07"}}'

# Get pending items only
curl -s http://127.0.0.1:3210/api/query \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:listByYearStatus","args":{"year":"2025","status":"pending"}}'
```

---

## 🔍 Search Tax Returns — Mission Control API

**When:** Looking up specific values, forms, or figures in prior returns.

```bash
# Search 2023 and 2024 returns for anything
curl "http://localhost:3000/api/search-docs?q=capital+gains"
curl "http://localhost:3000/api/search-docs?q=foreign+tax+credit"
curl "http://localhost:3000/api/search-docs?q=FBAR"
curl "http://localhost:3000/api/search-docs?q=1116"   # Form 1116 prior year data

# View a specific page as image
curl "http://localhost:3000/api/page-image?file=2024-taxes%2F2024+Marris...pdf&page=N" \
  --output review.png
```

---

## 📧 Gmail — Hunting for Tax Documents

```bash
# Tax documents likely in email
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "W-2 2025 Marris" --limit 10
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "1099 2025" --limit 20
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "1099-B brokerage 2025" --limit 10
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "1098 mortgage 2025" --limit 5
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "1098-T tuition 2025" --limit 10
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "from:hgrant@snobile.com" --limit 10
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "K-1 partnership 2025" --limit 5
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "HSA 1099-SA 2025" --limit 5

# Download attachment from a specific message
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail attachment <message_id> \
  --save-to "mission-control/storage/2025-taxes/<person>/<filename>.pdf"
```

---

## 📁 Google Drive

```bash
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive search "W-2 2025"
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive search "tax document 2025"
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive list --folder-id 1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive download <file_id> \
  --output "mission-control/storage/2025-taxes/joint/filename.pdf"
```

---

## 📂 Document Storage

When a document is received, save it here and mark the checklist:

```
mission-control/storage/2025-taxes/
  dean/       → dean-w2-2025.pdf, dean-1099b-2025.pdf
  virginia/   → virginia-w2-2025.pdf
  ella/       → ella-1098t-2025.pdf
  jack/       → jack-1098t-2025.pdf
  phoebe/     → phoebe-w2-2025.pdf (if she worked)
  joint/      → joint-1098-mortgage-2025.pdf
              → joint-eroad-brokerage-2025.pdf
              → joint-nz-bank-2025.pdf
              → joint-fbar-prep-2025.pdf
```

---

## 🌍 Cross-Border Tax Reference

### FBAR (FinCEN 114)
- Required if NZ bank account(s) **ever exceeded $10k USD** during 2025
- Deadline: April 15, 2026 (automatic extension to Oct 15 available)
- Filed separately at BSA E-Filing — NOT with the 1040
- Check prior returns: 2023 + 2024 both included FBAR (stored in mission-control)

### Form 1116 — Foreign Tax Credit
- Use when NZ taxes were withheld on NZ dividends/income
- Prevents double taxation on NZ-source income
- Prior year amounts in 2023/2024 returns — searchable via `search-docs` API

### EROAD Capital Loss
- Cost basis: $6.00 NZD/share (2021 business sale)
- Loss = (sale price < $6.00) × shares × NZD/USD rate
- Can offset capital gains; up to $3,000/year against ordinary income
- Excess carries forward to future years

### NZ Distributions
- Already taxed in NZ — confirm Foreign Tax Credit applicability
- Import NZ bank statements to verify amounts received

---

## 📊 Filing Status Report Format

When Dean asks for a status update:

```
🪶 QUILL TAX STATUS — [date] — [X] days to April 15

✅ DONE ([n] items)
  [list]

⏳ PENDING ([n] items)
  [list by person]

🚨 RISKS / FLAGS
  [anything that could cost money or miss a deadline]

📁 DOCUMENTS IN STORAGE
  [what's been uploaded so far]

📬 NEXT STEPS
  [top 3 things Dean should do]
```

---

## 🤝 Coordination

- **Flint** → sends EROAD sale details, NZ account balances, taxable events
- **EJP** → escalate anything requiring Dean's input or signature
- **Henry Grant** (CPA) → hgrant@snobile.com — external preparer at S.Nobile & Company, NY
