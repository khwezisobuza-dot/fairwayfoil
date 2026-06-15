import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  clubs: defineTable({
    name: v.string(),
    distance: v.number(), // in meters
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  }).index("by_user", ["userId"]),
  rounds: defineTable({
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
    walkDistance: v.optional(v.number()), // cumulative distance in meters
    weather: v.optional(v.object({
      temp: v.number(),
      windSpeed: v.number(),
      windDir: v.number(), // degrees
      isRaining: v.boolean(),
    })),
    totalScore: v.optional(v.number()), // relative to par
    userId: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_course", ["courseName"])
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_status_course", ["userId", "status", "courseName"]),

  scores: defineTable({
    roundId: v.id("rounds"),
    hole: v.number(),
    strokes: v.number(),
    putts: v.optional(v.number()),
    penalty: v.optional(v.number()),
    fairway: v.optional(v.union(v.literal("hit"), v.literal("left"), v.literal("right"), v.literal("miss"))),
    bunker: v.optional(v.boolean()),
    greenInRegulation: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  }).index("by_round_and_hole", ["roundId", "hole"]),
  messages: defineTable({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    roundId: v.optional(v.id("rounds")),
    userId: v.optional(v.id("users")),
  })
    .index("by_round", ["roundId"])
    .index("by_user", ["userId"]),

  courses: defineTable({
    name: v.string(),
    lastEnriched: v.optional(v.number()),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    holes: v.array(v.object({
      number: v.number(),
      par: v.number(),
      length: v.number(), // in meters
      line: v.optional(v.string()),
      comment: v.optional(v.string()),
      elevation: v.optional(v.string()),
      layout: v.optional(v.string()),
      // Geospatial targets
      greenCenter: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      greenFront: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      greenBack: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      hazards: v.optional(v.array(v.object({
        name: v.string(),
        type: v.union(v.literal("bunker"), v.literal("water"), v.literal("waste"), v.literal("tree")),
        location: v.object({ lat: v.number(), lng: v.number() }),
      }))),
    })),
  }),
});
