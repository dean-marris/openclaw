import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("storedFiles").order("desc").collect();
  },
});

export const listByCategory = query({
  args: {
    category: v.union(
      v.literal("investments"),
      v.literal("tax"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storedFiles")
      .withIndex("by_category", (p) => p.eq("category", args.category))
      .collect();
  },
});

export const add = mutation({
  args: {
    path: v.string(),
    name: v.string(),
    category: v.union(
      v.literal("investments"),
      v.literal("tax"),
      v.literal("other")
    ),
    year: v.optional(v.string()),
    person: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storedFiles", {
      ...args,
      uploadedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("storedFiles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
