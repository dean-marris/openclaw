# Flint — Tools

## Convex: Investments Table
```bash
# List all investments
curl -s http://127.0.0.1:3210/api/query -X POST \
  -H "Content-Type: application/json" \
  -d '{"path":"investments:list","args":{}}'

# Add investment
curl -s http://127.0.0.1:3210/api/mutation -X POST \
  -H "Content-Type: application/json" \
  -d '{"path":"investments:add","args":{
    "name": "EROAD shares",
    "amount": 10000.00,
    "currency": "NZD",
    "country": "NZ",
    "type": "shares",
    "purchasePrice": 6.00,
    "date": "2021-01-01",
    "notes": "Business sale proceeds"
  }}'
```

## Investment Categories
- `type`: shares | etf | fund | kiwisaver | property | cash | crypto | other
- `country`: USA | NZ
- `currency`: USD | NZD

## EROAD Tracking
- Cost basis: $6.00 NZD per share
- Exchange: NZX (New Zealand Stock Exchange)
- Ticker: ERD
- Check current price: `gog drive search "EROAD"` or web search

## NZ Currency Conversion
- Always record amounts in original currency
- Note exchange rate at time of transaction
- For US tax purposes: convert NZD → USD at IRS annual average rate

## Key Accounts to Track
- US brokerage accounts (Schwab, Fidelity, Vanguard, etc.)
- NZ brokerage (Sharesies, Hatch, ASB Securities, etc.)
- KiwiSaver provider and balance
- NZ bank accounts (for FBAR threshold monitoring)

## Coordination with Quill
When investment events occur, notify Quill:
- Share sales (gain/loss vs cost basis)
- Dividends received
- EROAD price updates
- NZ account balances approaching $10k USD threshold
