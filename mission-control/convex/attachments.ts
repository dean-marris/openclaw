import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addAttachment = mutation({
  args: {
    checklistItemId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    storagePath: v.string(),
    year: v.string(),
    person: v.string(),
    uploadedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("attachments", args);
  },
});

export const getAttachments = query({
  args: { checklistItemId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attachments")
      .withIndex("by_checklistItemId", (p) =>
        p.eq("checklistItemId", args.checklistItemId)
      )
      .collect();
  },
});

export const listByPerson = query({
  args: { person: v.string(), year: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("attachments").collect();
    return all.filter(
      (a) => a.person === args.person && a.year === args.year
    );
  },
});

export const removeAttachment = mutation({
  args: { id: v.id("attachments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
