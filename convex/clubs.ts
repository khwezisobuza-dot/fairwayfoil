import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("clubs"),
      _creationTime: v.number(),
      name: v.string(),
      distance: v.number(),
      brand: v.optional(v.string()),
      model: v.optional(v.string()),
      notes: v.optional(v.string()),
      userId: v.optional(v.id("users")),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("clubs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("clubs"),
    distance: v.number(),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      distance: args.distance,
      brand: args.brand,
      model: args.model,
      notes: args.notes,
    });
    return null;
  },
});

export const seed = mutation({
  args: { force: v.optional(v.boolean()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const existing = await ctx.db
      .query("clubs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    if (existing.length > 0 && !args.force) return null;

    if (args.force) {
      for (const club of existing) {
        await ctx.db.delete(club._id);
      }
    }

    const defaultClubs = [
      { name: "Driver", distance: 220, brand: "Srixon", model: "ZX7", notes: "misses left/right" },
      { name: "3-Wood", distance: 200, brand: "Srixon", model: "ZX" },
      { name: "7-Wood", distance: 185, brand: "Srixon", model: "ZX" },
      { name: "3-Iron", distance: 195, brand: "Srixon", model: "ZX7" },
      { name: "4-Iron", distance: 185, brand: "Srixon", model: "ZX7" },
      { name: "5-Iron", distance: 175, brand: "Srixon", model: "ZX7" },
      { name: "6-Iron", distance: 165, brand: "Srixon", model: "ZX7" },
      { name: "7-Iron", distance: 155, brand: "Srixon", model: "ZX7" },
      { name: "8-Iron", distance: 145, brand: "Srixon", model: "ZX7" },
      { name: "9-Iron", distance: 135, brand: "Srixon", model: "ZX7" },
      { name: "Pitching Wedge", distance: 125, brand: "Srixon", model: "ZX7" },
      { name: "Sand Wedge (56°)", distance: 85, brand: "Cleveland", model: "RTX" },
      { name: "Lob Wedge (60°)", distance: 70, brand: "Cleveland", model: "RTX" },
      { name: "Putter", distance: 0, brand: "Odyssey", model: "White Hot" },
    ];

    for (const club of defaultClubs) {
      await ctx.db.insert("clubs", { ...club, userId });
    }
    return null;
  },
});
