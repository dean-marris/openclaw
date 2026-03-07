# Mission-control scripts (uv)

Python scripts for CSV import/export, reports, and data handling. Uses the Convex HTTP API or files in `../storage/`.

## Setup

```bash
uv sync
```

## Run a script

```bash
uv run python script_name.py
```

## Ideas

- Export investments to CSV from Convex (or read from `../storage/`).
- Generate a simple tax checklist report for a given year.
- Import CSV rows into Convex via HTTP actions (when you add an HTTP endpoint to Convex).
