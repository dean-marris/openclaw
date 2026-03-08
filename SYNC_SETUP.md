# Sync setup: Google Drive, Convex, repo, and OpenClaw workspace

How documents, Convex, the GitHub repo, and the OpenClaw agent workspace stay in sync.

## 1. Documents (native): Google Drive

**Canonical location for documents (PDFs, statements, tax files):**

- **Google Drive folder:** [Marris docs](https://drive.google.com/drive/folders/1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5)  
  Folder ID: `1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5`

- **Local path (after Google Drive for Desktop sync):**  
  Depends on your Drive mount. Common patterns:
  - `~/Library/CloudStorage/Google Drive-My Drive/<folder name>`
  - Or a path under `My Drive/` if that’s your sync root (e.g. `/Users/deanmarris/My Drive/...`)

Keep originals here. Use this path for RAG ingestion and for any “open document” workflows.

## 2. Convex: structured data + RAG

- **Mission-control Convex app** (in this repo under `mission-control/`) stores:
  - **Structured data:** investments, tax checklist, `storedFiles` metadata (path, name, category, year).
  - **Future RAG:** document chunks and embeddings can be stored in Convex (or a separate vector DB); ingestion reads from the Google Drive folder (or from `mission-control/storage/` if you mirror files there).

- **`mission-control/storage/`** can be:
  - **Option A:** A mirror/copy of the Drive folder (e.g. script or sync tool copies new files from Drive → `storage/`, then Convex indexes them).
  - **Option B:** Only for files created by the app; canonical docs stay only in Drive, and Convex `storedFiles` entries point at Drive paths (or at URLs) where your app can read them.

Recommendation: keep **documents native in Drive**; use Convex for metadata and, when you add RAG, for chunk/embedding storage. Ingestion job: scan Drive folder (local path) → update Convex `storedFiles` and RAG chunks.

## 3. OpenClaw workspace (EJP memory, SOUL, TOOLS)

- **Current workspace path:** `/Users/deanmarris/.openclaw/workspace`  
  This is where SOUL.md, TOOLS.md, and other persistent agent memory live.

Two ways to connect this to the repo:

### Option A: Symlink workspace → repo (EJP reads/writes Git-tracked files)

- Make the workspace directory the repo (or the repo’s mission-control area):
  ```bash
  # Backup existing workspace, then replace with repo
  mv ~/.openclaw/workspace ~/.openclaw/workspace.bak
  ln -s "/Users/deanmarris/My Drive/marris_openclaw" ~/.openclaw/workspace
  ```
- Then EJP reads/writes files under `marris_openclaw` (e.g. mission-control, README, this doc). Commit and push from `marris_openclaw` to keep GitHub in sync.
- **Caveat:** Your SOUL.md, TOOLS.md, etc. would need to live inside `marris_openclaw` (e.g. at repo root or in a subfolder). Move them from `workspace.bak` into the repo and commit.

### Option B: Keep workspace and repo separate (recommended if you want a clean split)

- **Workspace** stays `~/.openclaw/workspace` — SOUL.md, TOOLS.md, memory only; not necessarily Git-tracked.
- **Repo** stays `My Drive/marris_openclaw` — mission-control code, this SYNC_SETUP.md, README; sync to GitHub via git.
- EJP uses workspace for memory/personality; for “financial docs” or “mission-control” it can be told (in SOUL or TOOLS) to look at:
  - **Docs:** Google Drive folder (local path once you know it) or `mission-control/storage/` if you mirror there.
  - **Structured data:** Convex (via mission-control app or API).

No symlink; two clear places: agent memory in workspace, code + doc metadata in repo.

## 4. Repo and GitHub

- **Repo path:** `/Users/deanmarris/My Drive/marris_openclaw`  
  (Same as “My Drive/marris_openclaw” in Cursor when the drive is mounted.)

- **GitHub:** https://github.com/dean-marris/openclaw  
  - **Branch:** `main`
  - **Contains:** mission-control (Convex, storage, scripts), README, SYNC_SETUP.md, .gitignore.

- **Sync:** From the repo directory:
  ```bash
  git pull origin main   # get latest
  git add . && git commit -m "..." && git push origin main   # push changes
  ```

## 5. One-line summary for EJP

- **Documents (native):** Google Drive folder [1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5](https://drive.google.com/drive/folders/1i--U5wOjhl25I6hu8-4H7i5zZzHiPjO5); use the **local sync path** for reading files and RAG.
- **Convex:** Stores investments, tax checklist, and `storedFiles` (and later RAG chunks); lives in this repo under `mission-control/`.
- **OpenClaw workspace:** `/Users/deanmarris/.openclaw/workspace` (SOUL.md, TOOLS.md). Either symlink this to the repo (Option A) or keep separate and point EJP at the repo + Drive path (Option B).
- **Repo for code/sync:** `My Drive/marris_openclaw` → https://github.com/dean-marris/openclaw (branch `main`).
