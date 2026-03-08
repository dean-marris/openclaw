import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsertAccount = mutation({
  args: {
    accountNumber: v.string(),
    accountName: v.string(),
    bank: v.string(),
    currency: v.string(),
    highestBalance: v.number(),
    highestBalanceDate: v.string(),
    lastImportedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bankAccounts")
      .withIndex("by_accountNumber", (q) => q.eq("accountNumber", args.accountNumber))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("bankAccounts", args);
    }
  },
});

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bankAccounts").collect();
  },
});

export const insertTransactions = mutation({
  args: {
    accountNumber: v.string(),
    year: v.string(),
    transactions: v.array(
      v.object({
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
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bankTransactions")
      .withIndex("by_account_year", (q) =>
        q.eq("accountNumber", args.accountNumber).eq("year", args.year)
      )
      .collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    for (const txn of args.transactions) {
      await ctx.db.insert("bankTransactions", txn);
    }
  },
});

export const listTransactions = query({
  args: {
    accountNumber: v.string(),
    year: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.year) {
      return await ctx.db
        .query("bankTransactions")
        .withIndex("by_account_year", (q) =>
          q.eq("accountNumber", args.accountNumber).eq("year", args.year!)
        )
        .collect();
    }
    return await ctx.db
      .query("bankTransactions")
      .withIndex("by_account", (q) => q.eq("accountNumber", args.accountNumber))
      .collect();
  },
});

