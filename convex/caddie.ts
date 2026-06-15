import { action, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "./_generated/dataModel";

export const ask = action({
  args: {
    prompt: v.string(),
    roundId: v.id("rounds"),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 1. Get round and club data
    const round = await ctx.runQuery(api.rounds.getActive);
    if (!round) throw new Error("No active round");
    const clubs: Doc<"clubs">[] = await ctx.runQuery(api.clubs.list);
    
    // Fetch course data from DB if available
    const course = round.courseId ? await ctx.runQuery(api.courses.getById, { id: round.courseId }) : null;

    // 2. Format context
    const clubContext = clubs
      .map((c: Doc<"clubs">) => `${c.brand || ""} ${c.model || ""} ${c.name}: ${c.distance}m${c.notes ? ` (${c.notes})` : ""}`)
      .join("\n");

    const walkKm = ((round?.walkDistance || 0) / 1000).toFixed(1);
    const ballContext = `${round?.currentBall || "Unknown"} (${round?.ballCondition || "standard"} condition)`;
    const hole = round?.currentHole || 1;
    const courseName = round?.courseName || "Unknown Course";
    const handicap = round?.handicap || 0;
    const tees = round?.tees || "White";

    // Course Intelligence
    let courseKnowledge = `You are playing at ${courseName} from the ${tees} tees. User Handicap: ${handicap}.`;
    
    if (course) {
      courseKnowledge += `\nDetailed Course Intel for ${course.name}:\n`;
      course.holes.forEach((h: any) => {
        courseKnowledge += `- Hole ${h.number}: Par ${h.par}, ${h.length}m, ${h.layout || "Straight"}. ${h.elevation || "Level"}. ${h.comment || ""}\n`;
      });
    } else if (courseName.toLowerCase().includes("soweto")) {
      // Fallback if course record not linked but name matches
      courseKnowledge += `
Soweto Country Club Detailed Course Intel (Legacy Fallback):
- Hole 1: Par 4, 380m.
- Hole 2: Par 3, 165m.
- Hole 3: Par 4, 410m.
- Hole 4: Par 4, 340m.
- Hole 5: Par 3, 180m.
- Hole 6: Par 4, 395m.
- Hole 7: Par 4, 360m.
- Hole 8: Par 4, 375m.
- Hole 9: Par 4, 405m.
- Hole 10: Par 5, 490m.
- Hole 11: Par 4, 320m.
- Hole 12: Par 4, 425m.
- Hole 13: Par 3, 145m.
- Hole 14: Par 4, 385m.
- Hole 15: Par 4, 330m.
- Hole 16: Par 3, 140m.
- Hole 17: Par 4, 390m.
- Hole 18: Par 5, 490m.
      `;
    }

    // GPS context
    const locationContext = round?.lastLat ? `Current Lat: ${round.lastLat}, Lng: ${round.lastLng}` : "Location unknown";

    const weatherContext = round?.weather 
      ? `Weather: ${round.weather.temp}°C, Wind: ${round.weather.windSpeed}km/h at ${round.weather.windDir}°, Rain: ${round.weather.isRaining ? "Yes" : "No"}`
      : "Weather: Standard";

    const scores = await ctx.runQuery(api.scores.getForRound, { roundId: args.roundId });
    const performanceContext = scores.map(s => `Hole ${s.hole}: ${s.strokes} strokes, Fairway: ${s.fairway || "unknown"}`).join("\n");

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      // If "trees" mentioned and no API key, still give the default safe advice
      if (args.prompt.toLowerCase().includes("trees")) {
        return "Safe play: Select your 7-iron. Aim for the widest gap. Punch only. Do not go for the green.";
      }
      const mockAdvice = `Caddie logic is ready for ${courseName}, but AI Brain is offline.`;
      return mockAdvice;
    }

    const openrouter = createOpenRouter({
      apiKey: openrouterKey,
    });

    const { text }: { text: string } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      system: `You are Fairway Foil, an AI Strategic Caddie & Rules Official.
    Your goal is to provide tactical, psychological, and rules-based advice for a golfer with a ${handicap} handicap.
    Keep responses extremely short and high-impact (max 2 sentences).

    STRATEGIC PARTNER PROTOCOLS:
    1. ADAPTIVE STRATEGY: Analyze recent performance. If they are missing fairways left, suggest aiming right or using a more forgiving club.
    2. FATIGUE MANAGEMENT: As walk distance increases (>6km), suggest "easy-to-hit" clubs (hybrids over long irons, 7-iron over 5-iron) and recommend smoother 80% swings to maintain tempo.
    3. RISK ASSESSMENT: Discourage "hero shots" over water or through tight gaps for mid-to-high handicappers. Recommend the "safe miss".

    RULES OFFICIAL PROTOCOLS:
    1. WATER HAZARDS (Yellow/Red Stakes): If they hit into water, explain where to drop (e.g., Rule 17.1).
    2. OUT OF BOUNDS (White Stakes): Reference Rule 18.2 (Stroke and Distance).
    3. UNPLAYABLE LIE: Reference Rule 19.
    4. Always provide the specific rule number and clear placement instructions.

    Decision Logic for "In the Trees":
    If a user is in the trees:
    1. Assess if they should punch out or go over.
    2. If they are far from the green (>150m) or high handicap (>15), ALWAYS recommend the 7-iron punch out to the widest gap.
    3. If they are close (<100m) and have high-lofted clubs (60* LW), suggest the possibility of a "flop shot over" ONLY if the gap exists.
    4. Default to safety: "Punch out" is the primary caddie recommendation.

    Golfer Data:
    - Course: ${courseName}
    - Tees: ${tees}
    - Handicap: ${handicap}
    - Current Ball: ${ballContext}
    - Walked: ${walkKm}km
    - Current Hole: ${hole}
    - Location: ${locationContext}
    - Weather: ${weatherContext}
    - Recent Performance:
    ${performanceContext}
    - Clubs:
    ${clubContext}

    ${courseKnowledge}

    Special Note: When the user sinks the ball or finishes a hole, summarize their stats for that hole (strokes, fairway hits) if they ask or if you're helping them record the score.`,
      prompt: args.prompt,
    });

    // Save message to history
    await ctx.runMutation(internal.caddie.saveMessage, {
      roundId: args.roundId,
      role: "user",
      content: args.prompt,
      userId,
    });
    await ctx.runMutation(internal.caddie.saveMessage, {
      roundId: args.roundId,
      role: "assistant",
      content: text,
      userId,
    });

    return text;
  },
});

export const saveMessage = internalMutation({
  args: {
    roundId: v.id("rounds"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      roundId: args.roundId,
      role: args.role,
      content: args.content,
      userId: args.userId,
    });
    return null;
  },
});

export const getHistory = query({
  args: { roundId: v.id("rounds") },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      roundId: v.optional(v.id("rounds")),
      userId: v.optional(v.id("users")),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .order("desc")
      .take(5);
  },
});
