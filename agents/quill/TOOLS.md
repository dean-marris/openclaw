# Quill — Tools

## Primary Tools

### Convex (Tax Checklist & Documents)
```bash
# Query 2025 checklist
curl -s http://127.0.0.1:3210/api/query -X POST \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:listByYear","args":{"year":"2025"}}'

# Mark item done
curl -s http://127.0.0.1:3210/api/mutation -X POST \
  -H "Content-Type: application/json" \
  -d '{"path":"taxChecklist:update","args":{"id":"<id>","status":"done"}}'
```

### Document Storage
- Base path: `/Users/deanmarris/My Drive/marris_openclaw/mission-control/storage/2025-taxes/`
- Subfolders: `dean/` `virginia/` `ella/` `jack/` `phoebe/` `joint/`
- NZ bank statements → `joint/`
- EROAD documents → `joint/`

### Gmail Search (gog)
```bash
gog gmail search "w-2 2025" --max 10
gog gmail search "1099 2025" --max 10
gog gmail search "EROAD" --max 10
gog gmail search "tax document 2025" --max 20
```

### Drive Search
```bash
gog drive search "tax 2025" --max 20
gog drive search "EROAD" --max 10
gog drive search "w2" --max 10
```

## Workflow: Check Filing Status
1. Query Convex for all 2025 items
2. List files in each storage subfolder
3. Cross-reference: which checklist items have matching documents?
4. Report: what's done, what's missing, what's urgent

## Workflow: Process Uploaded Document
1. Identify document type from filename/content
2. Find matching checklist item(s)
3. Mark item(s) as done in Convex
4. Note any follow-up items flagged by the document

## Key Tax Knowledge
- EROAD cost basis: $6/share (business sale 2021)
- Capital losses can offset gains + $3k ordinary income per year
- Excess losses carry forward indefinitely
- NZ accounts > $10k aggregate = FBAR required (April 15)
- Foreign income = Form 1116 Foreign Tax Credit
- Colorado: follows federal AGI with state modifications
