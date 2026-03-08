import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addContact = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("keyContacts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateContact = mutation({
  args: {
    id: v.id("keyContacts"),
    name: v.optional(v.string()),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    relationship: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteContact = mutation({
  args: { id: v.id("keyContacts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listContacts = query({
  args: {},
  handler: async (ctx) => {
    const contacts = await ctx.db.query("keyContacts").collect();
    return contacts.sort((a, b) => {
      const orderA = a.sortOrder ?? 999;
      const orderB = b.sortOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.createdAt - b.createdAt;
    });
  },
});

export const seedContacts = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("keyContacts").collect();
    if (existing.length > 0) return;

    await ctx.db.insert("keyContacts", {
      name: "John Carr",
      title: "Owner & Governing Director",
      company: "BBS Tax",
      email: "john@ggocc.com",
      phone: "+1 863-602-1274",
      address: "P.O Box 780637, San Antonio TX 78278",
      url: "http://upload.bbstax.com",
      relationship: "CPA / Tax Professional",
      sortOrder: 1,
      createdAt: Date.now(),
    });

    await ctx.db.insert("keyContacts", {
      name: "James Francesco",
      title: "Assistant to John Carr",
      company: "BBS Tax",
      email: "james@bbsstax.com",
      phone: "+1 210-861-2492",
      relationship: "CPA Assistant",
      sortOrder: 2,
      createdAt: Date.now(),
    });
  },
});
