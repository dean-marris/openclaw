import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  investments: defineTable({
    name: v.string(),
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(),
    notes: v.optional(v.string()),
    source: v.optional(v.string()),
  }).index("by_date", ["date"]),

  taxChecklist: defineTable({
    year: v.string(),
    item: v.string(),
    status: v.union(v.literal("pending"), v.literal("done")),
    dueDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    documentId: v.optional(v.string()),
  })
    .index("by_year", ["year"])
    .index("by_year_status", ["year", "status"]),

  storedFiles: defineTable({
    path: v.string(),
    name: v.string(),
    category: v.union(
      v.literal("investments"),
      v.literal("tax"),
      v.literal("other")
    ),
    year: v.optional(v.string()),
    uploadedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_year", ["year"]),
});
