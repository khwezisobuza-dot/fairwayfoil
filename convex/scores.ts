import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getForRound = query({
  args: { roundId: v.optional(v.id("rounds")) },
  returns: v.array(v.object({
    _id: v.id("scores"),
    _creationTime: v.number(),
    roundId: v.id("rounds"),
    hole: v.number(),
    strokes: v.number(),
    putts: v.optional(v.number()),
    penalty: v.optional(v.number()),
    fairway: v.optional(v.union(v.literal("hit"), v.literal("left"), v.literal("right"), v.literal("miss"))),
    bunker: v.optional(v.boolean()),
    greenInRegulation: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    if (!args.roundId) return [];
    return await ctx.db
      .query("scores")
      .withIndex("by_round_and_hole", (q) => q.eq("roundId", args.roundId!))
      .collect();
  },
});

export const saveHoleScore = mutation({
  args: {
    roundId: v.id("rounds"),
    hole: v.number(),
    strokes: v.number(),
    putts: v.optional(v.number()),
    penalty: v.optional(v.number()),
    fairway: v.optional(v.union(v.literal("hit"), v.literal("left"), v.literal("right"), v.literal("miss"))),
    bunker: v.optional(v.boolean()),
    greenInRegulation: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  returns: v.id("scores"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scores")
      .withIndex("by_round_and_hole", (q) => q.eq("roundId", args.roundId).eq("hole", args.hole))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("scores", args);
    }
  },
});
