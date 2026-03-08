/**
 * Ingestion script for tax document RAG.
 *
 * Reads PDFs from storage/2023-taxes/ and storage/2024-taxes/,
 * extracts text, chunks it, generates embeddings via OpenAI,
 * and stores chunks in Convex via HTTP API.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/ingest-tax-docs.ts
 */

import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

const CONVEX_URL = "http://127.0.0.1:3210";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 500; // approx tokens (chars / 4)
const CHUNK_OVERLAP = 50;

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

const STORAGE_DIR = path.resolve(__dirname, "../storage");
const TAX_DIRS = [
  { dir: path.join(STORAGE_DIR, "2023-taxes"), year: "2023" },
  { dir: path.join(STORAGE_DIR, "2024-taxes"), year: "2024" },
];

// ── Helpers ──────────────────────────────────────────────

function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  // Approximate tokens as chars / 4
  const charSize = chunkSize * 4;
  const charOverlap = overlap * 4;
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + charSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    if (end >= text.length) break;
    start = end - charOverlap;
  }
  return chunks;
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((d: { embedding: number[] }) => d.embedding);
}

async function convexMutation(
  functionName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: functionName, args }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Convex mutation failed: ${res.status} ${err}`);
  }

  return res.json();
}

function inferPerson(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("dean") && lower.includes("virginia")) return "joint";
  if (lower.includes("dean")) return "dean";
  if (lower.includes("virginia")) return "virginia";
  if (lower.includes("ella")) return "ella";
  if (lower.includes("jack")) return "jack";
  if (lower.includes("phoebe")) return "phoebe";
  return "joint";
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log("🔍 Tax Document RAG Ingestion");
  console.log("═".repeat(50));

  let totalChunks = 0;

  for (const { dir, year } of TAX_DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found: ${dir}`);
      continue;
    }

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".pdf"));

    console.log(`\n📂 ${year} — ${files.length} PDF(s) in ${dir}`);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileId = `${year}/${file}`;
      const person = inferPerson(file);

      console.log(`\n  📄 ${file}`);
      console.log(`     Person: ${person} | Year: ${year}`);

      // Extract text from PDF
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      const fullText: string = pdfData.text;

      console.log(
        `     Extracted ${fullText.length} chars from ${pdfData.numpages} pages`
      );

      // Chunk the text
      const chunks = chunkText(fullText, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log(`     Split into ${chunks.length} chunks`);

      // Process in batches of 20 (OpenAI embedding batch limit is higher, but be safe)
      const BATCH_SIZE = 20;
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchStart = i;

        // Get embeddings for the batch
        const embeddings = await getEmbeddings(batch);

        // Store each chunk
        for (let j = 0; j < batch.length; j++) {
          const chunkIndex = batchStart + j;
          await convexMutation("taxDocuments:storeChunk", {
            fileId,
            fileName: file,
            year,
            person,
            chunkIndex,
            text: batch[j],
            embedding: embeddings[j],
          });
        }

        const stored = Math.min(i + BATCH_SIZE, chunks.length);
        console.log(`     ✅ Stored ${stored}/${chunks.length} chunks`);
      }

      totalChunks += chunks.length;
    }
  }

  console.log("\n" + "═".repeat(50));
  console.log(`✅ Done! Ingested ${totalChunks} total chunks.`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
