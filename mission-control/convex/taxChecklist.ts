import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("taxChecklist").collect();
  },
});

export const listByYear = query({
  args: { year: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taxChecklist")
      .withIndex("by_year", (p) => p.eq("year", args.year))
      .collect();
  },
});

export const listByYearAndStatus = query({
  args: { year: v.string(), status: v.union(v.literal("pending"), v.literal("done")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taxChecklist")
      .withIndex("by_year_status", (p) =>
        p.eq("year", args.year).eq("status", args.status)
      )
      .collect();
  },
});

export const add = mutation({
  args: {
    year: v.string(),
    item: v.string(),
    status: v.union(v.literal("pending"), v.literal("done")),
    dueDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    documentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("taxChecklist", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("taxChecklist"),
    item: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("done"))),
    dueDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    documentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("taxChecklist") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
