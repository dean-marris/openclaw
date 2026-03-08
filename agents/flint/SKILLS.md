# SKILLS.md — Flint 🔥 (Investment Portfolio Agent)

---

## 🗄️ Convex — Investments Table

**When:** Reading or updating the portfolio.

```bash
# List all investments
curl -s http://127.0.0.1:3210/api/query \
  -H "Content-Type: application/json" \
  -d '{"path":"investments:list","args":{}}'

# Add a position
curl -s http://127.0.0.1:3210/api/mutation \
  -H "Content-Type: application/json" \
  -d '{
    "path": "investments:add",
    "args": {
      "name": "EROAD",
      "type": "stock",
      "amount": 1000,
      "currency": "NZD",
      "date": "2025-01-15",
      "notes": "NZX: ERD — cost basis $6.00 NZD/share",
      "source": "NZX"
    }
  }'
```

---

## 📈 EROAD — Cost Basis Tracking

**Key facts:**
- Ticker: ERD (NZX)
- Cost basis: **$6.00 NZD/share** (2021 business sale)
- Any shares sold **below $6 NZD** = capital loss → alert Quill
- Track: shares held, shares sold, avg sale price, gain/loss

**Calculate gain/loss:**
```
gain_nzd = (sale_price - 6.00) × shares_sold
gain_usd = gain_nzd × nzd_usd_rate
```

**Check current price:**
```bash
# Using web search or financial API
curl "https://query1.finance.yahoo.com/v8/finance/chart/ERD.NZ?interval=1d&range=1d"
```

---

## 💱 Currency Conversion

**NZD/USD rate** affects all US tax reporting of NZ positions.

```bash
# Quick rate check
curl "https://api.exchangerate-api.com/v4/latest/NZD" | python3 -c \
  "import json,sys; d=json.load(sys.stdin); print('NZD/USD:', d['rates']['USD'])"
```

Always label: **USD** vs **NZD** — never use bare numbers without currency.

---

## 📧 Gmail — Finding Brokerage Statements

```bash
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "brokerage statement EROAD" --limit 5
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "1099-B 2025" --limit 5
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "KiwiSaver annual statement" --limit 5
GOG_KEYRING_PASSWORD="marrisopenclaw" gog gmail search "NZX trade confirmation" --limit 10
```

---

## 📁 Google Drive — Portfolio Documents

```bash
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive search "EROAD statement"
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive search "KiwiSaver"
GOG_KEYRING_PASSWORD="marrisopenclaw" gog drive list --folder-id 1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5
```

---

## 🏦 FBAR Threshold Check

NZ bank accounts aggregate > **$10,000 USD** at any point in the year = FBAR required.

```
threshold_usd = 10000
nzd_total = sum of all NZ account balances in NZD
usd_equiv = nzd_total × nzd_usd_rate
if usd_equiv > threshold_usd: 🚨 alert EJP + Quill
```

FBAR deadline: **April 15, 2026** (same as tax return)

---

## 🤝 Taxable Events → Quill

When you detect a taxable event, notify Quill:
- **EROAD sale** — price, shares, date, gain/loss in both currencies
- **NZ dividend received** — amount NZD/USD, imputation credit if any
- **KiwiSaver withdrawal** — rare, but flag it
- **NZ interest income** — from NZ bank accounts

```bash
# Store taxable event in Convex for Quill to pick up
curl -s http://127.0.0.1:3210/api/mutation \
  -H "Content-Type: application/json" \
  -d '{
    "path": "investments:add",
    "args": {
      "name": "EROAD sale",
      "type": "sale",
      "amount": -500,
      "currency": "NZD",
      "date": "2025-03-01",
      "notes": "Capital loss: sold 100 shares @ $5.00 vs $6.00 basis = -$100 NZD",
      "source": "NZX"
    }
  }'
```

---

## 📂 Document Storage

Store downloaded brokerage statements at:
```
mission-control/storage/2025-taxes/joint/
  → joint-eroad-brokerage-2025.pdf
  → joint-nz-bank-statement-2025.pdf
  → joint-kiwisaver-annual-2025.pdf
```

---

## 📊 Portfolio Summary Format

When reporting to Dean, always use this structure:

```
🔥 FLINT PORTFOLIO UPDATE — [date]

🇺🇸 USA HOLDINGS
  [Name] — $X,XXX USD ([account])
  Total USA: $XX,XXX USD

🇳🇿 NZ HOLDINGS
  EROAD (ERD) — X,XXX shares @ $X.XX NZD = $X,XXX NZD ($X,XXX USD)
  KiwiSaver — $X,XXX NZD
  NZ Bank — $X,XXX NZD
  Total NZ: $XX,XXX NZD ($XX,XXX USD)

⚠️ ALERTS
  [any FBAR threshold / loss flags]

📉 UNREALISED EROAD P&L
  Cost basis: $6.00 NZD/share
  Current: $X.XX NZD/share
  Per-share: [gain/loss]
  Total on X,XXX shares: $X,XXX NZD
```
