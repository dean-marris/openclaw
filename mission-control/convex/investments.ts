import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("investments").order("desc").collect();
  },
});

export const listByDate = query({
  args: { start: v.optional(v.string()), end: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("investments").order("desc").collect();
    return all.filter((r) => {
      if (args.start && r.date < args.start) return false;
      if (args.end && r.date > args.end) return false;
      return true;
    });
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(),
    notes: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("investments", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("investments"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("investments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
