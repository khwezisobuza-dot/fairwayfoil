import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActive = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("rounds"),
      _creationTime: v.number(),
      currentHole: v.number(),
      startTime: v.number(),
      status: v.union(v.literal("active"), v.literal("completed")),
      currentBall: v.optional(v.string()),
      ballCondition: v.optional(v.union(v.literal("new"), v.literal("second-hand"))),
      courseName: v.optional(v.string()),
      courseId: v.optional(v.id("courses")),
      tees: v.optional(v.string()),
      handicap: v.optional(v.number()),
      startingHole: v.optional(v.number()),
      lastLat: v.optional(v.number()),
      lastLng: v.optional(v.number()),
      walkDistance: v.optional(v.number()),
      weather: v.optional(v.object({
        temp: v.number(),
        windSpeed: v.number(),
        windDir: v.number(),
        isRaining: v.boolean(),
      })),
      totalScore: v.optional(v.number()),
      userId: v.optional(v.id("users")),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("rounds")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .unique();
  },
});

export const start = mutation({
  args: { 
    ball: v.optional(v.string()),
    ballCondition: v.optional(v.union(v.literal("new"), v.literal("second-hand"))),
    courseName: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    tees: v.optional(v.string()),
    handicap: v.optional(v.number()),
    startingHole: v.optional(v.number()),
  },
  returns: v.id("rounds"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const active = await ctx.db
      .query("rounds")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .unique();
    if (active) return active._id;

    const startHole = args.startingHole ?? 1;

    return await ctx.db.insert("rounds", {
      currentHole: startHole,
      startingHole: startHole,
      startTime: Date.now(),
      status: "active",
      currentBall: args.ball ?? "Srixon Soft Feel",
      ballCondition: args.ballCondition ?? "new",
      courseName: args.courseName ?? "Unknown Course",
      courseId: args.courseId,
      tees: args.tees ?? "White",
      handicap: args.handicap ?? 0,
      walkDistance: 0,
      userId,
    });
  },
});

export const updateBall = mutation({
  args: { id: v.id("rounds"), ball: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { currentBall: args.ball });
    return null;
  },
});

export const updateBallCondition = mutation({
  args: { id: v.id("rounds"), condition: v.union(v.literal("new"), v.literal("second-hand")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { ballCondition: args.condition });
    return null;
  },
});

export const updateLocation = mutation({
  args: { 
    id: v.id("rounds"), 
    lat: v.number(), 
    lng: v.number(),
    distanceWalked: v.number() 
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      lastLat: args.lat, 
      lastLng: args.lng,
      walkDistance: args.distanceWalked 
    });
    return null;
  },
});

export const updateHole = mutation({
  args: { id: v.id("rounds"), hole: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { currentHole: args.hole });
    return null;
  },
});

export const saveWeather = mutation({
  args: {
    id: v.id("rounds"),
    weather: v.object({
      temp: v.number(),
      windSpeed: v.number(),
      windDir: v.number(),
      isRaining: v.boolean(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { weather: args.weather });
    return null;
  },
});

export const getPreviousRound = query({
  args: { courseName: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("rounds")
      .withIndex("by_user_status_course", (q) => q.eq("userId", userId).eq("status", "completed").eq("courseName", args.courseName))
      .order("desc")
      .first();
  },
});

export const end = mutation({
  args: { id: v.id("rounds") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "completed" });
    return null;
  },
});
