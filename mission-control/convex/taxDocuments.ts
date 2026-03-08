import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

export const storeChunk = mutation({
  args: {
    fileId: v.string(),
    fileName: v.string(),
    year: v.string(),
    person: v.string(),
    chunkIndex: v.number(),
    text: v.string(),
    embedding: v.array(v.float64()),
    pageNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("taxDocumentChunks", args);
  },
});

export const searchChunks = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set in Convex environment");

    // Generate embedding for the query
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: args.query,
      }),
    });

    if (!embeddingRes.ok) {
      const err = await embeddingRes.text();
      throw new Error(`OpenAI embedding failed: ${err}`);
    }

    const embeddingData = await embeddingRes.json();
    const queryEmbedding = embeddingData.data[0].embedding as number[];

    // Vector search
    const results = await ctx.vectorSearch("taxDocumentChunks", "by_embedding", {
      vector: queryEmbedding,
      limit: 5,
    });

    // Fetch the full documents
    const chunks = await Promise.all(
      results.map(async (r) => {
        const doc = await ctx.runQuery(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "taxDocuments:getChunkById" as any,
          { id: r._id }
        );
        return { ...doc, _score: r._score };
      })
    );

    return chunks;
  },
});

export const getChunkById = query({
  args: { id: v.id("taxDocumentChunks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listDocuments = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("taxDocumentChunks").collect();
    const seen = new Map<string, { fileId: string; fileName: string; year: string; person: string; chunkCount: number }>();
    for (const chunk of all) {
      const key = chunk.fileId;
      if (!seen.has(key)) {
        seen.set(key, {
          fileId: chunk.fileId,
          fileName: chunk.fileName,
          year: chunk.year,
          person: chunk.person,
          chunkCount: 1,
        });
      } else {
        seen.get(key)!.chunkCount++;
      }
    }
    return Array.from(seen.values());
  },
});
