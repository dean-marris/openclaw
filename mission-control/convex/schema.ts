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
    person: v.optional(v.string()),
    uploadedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_year", ["year"]),

  attachments: defineTable({
    checklistItemId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    storagePath: v.string(),
    year: v.string(),
    person: v.string(),
    uploadedAt: v.number(),
  }).index("by_checklistItemId", ["checklistItemId"]),

  taxDocumentChunks: defineTable({
    fileId: v.string(),
    fileName: v.string(),
    year: v.string(),
    person: v.string(),
    chunkIndex: v.number(),
    text: v.string(),
    embedding: v.array(v.float64()),
    pageNumber: v.optional(v.number()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
  }),

  bankAccounts: defineTable({
    accountNumber: v.string(),
    accountName: v.string(),
    bank: v.string(),
    currency: v.string(),
    highestBalance: v.number(),
    highestBalanceDate: v.string(),
    lastImportedAt: v.number(),
  })
    .index("by_bank", ["bank"])
    .index("by_accountNumber", ["accountNumber"]),

  bankTransactions: defineTable({
    accountNumber: v.string(),
    date: v.string(),
    description: v.string(),
    amount: v.number(),
    balance: v.optional(v.number()),
    type: v.union(v.literal("credit"), v.literal("debit")),
    uniqueId: v.optional(v.string()),
    tranType: v.optional(v.string()),
    year: v.string(),
  })
    .index("by_account", ["accountNumber"])
    .index("by_year", ["year"])
    .index("by_account_year", ["accountNumber", "year"]),

  keyContacts: defineTable({
    name: v.string(),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    relationship: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    createdAt: v.number(),
  }),
});
