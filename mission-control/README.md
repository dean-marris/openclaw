# Mission Control — Marris investments & tax checklist

Mission Control tracks **Marris investments**, **annual tax filing checklist**, and **folder storage** metadata. Data lives in a local Convex database; files (PDFs, statements) go in `storage/`.

## Layout

- **convex/** — Convex schema and functions (investments, taxChecklist, storedFiles)
- **storage/** — On-disk folder for documents (PDFs, exports)
- **scripts/** — Python (uv) scripts for import/export and reports

## One-time Convex setup

Convex needs an interactive run once to create the local deployment and generate types:

```bash
cd mission-control
npx convex dev --local
```

When prompted, you can choose **local** (no account) or log in. This creates `convex/_generated/` and `.env.local` with `CONVEX_DEPLOYMENT`. Stop with Ctrl+C. After that, use:

```bash
npm run dev          # Convex dev (local) — keep running while developing
npm run dev:once     # Push schema/functions once
```

## OpenClaw

Point the OpenClaw agent workspace at this drive so it can read/write `storage/` and use mission-control data:

- In `~/.openclaw/openclaw.json`: set `agents.defaults.workspace` to the full path of this directory (or its parent).
- Run `openclaw onboard` if you haven’t, and set the workspace in the wizard.

## Python (uv) scripts

From `scripts/`:

```bash
cd scripts
uv sync
uv run python your_script.py
```

See `scripts/README.md` for script ideas (CSV import/export, reports).

## Docker (optional)

- **OpenClaw**: Use the official [docker-compose](https://github.com/openclaw/openclaw/blob/main/docker-compose.yml) with `OPENCLAW_CONFIG_DIR` and `OPENCLAW_WORKSPACE_DIR` pointing at this drive.
- **Mission-control API**: Add a `Dockerfile` and optional top-level `docker-compose.yml` to run the mission-control API (and Convex client) in a container; run `npx convex dev --local` on the host or use Convex in Docker.
