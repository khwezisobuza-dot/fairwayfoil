import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const seed = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const courses = [
      {
        name: "Soweto Country Club",
        location: { lat: -26.2625, lng: 27.8931 },
        holes: [
          { 
            number: 1, par: 4, length: 380, line: "Aim for center", comment: "Starting strong", 
            greenCenter: { lat: -26.2601, lng: 27.8950 },
            hazards: [
              { name: "Fairway Bunker Left", type: "bunker", location: { lat: -26.2615, lng: 27.8940 } },
              { name: "Greenside Bunker Right", type: "bunker", location: { lat: -26.2605, lng: 27.8955 } }
            ]
          },
          { 
            number: 2, par: 3, length: 165, line: "Center of green", comment: "New Par 3", 
            greenCenter: { lat: -26.2590, lng: 27.8945 },
            hazards: [
              { name: "Water Hazard Front", type: "water", location: { lat: -26.2600, lng: 27.8940 } }
            ]
          },
          { 
            number: 3, par: 4, length: 410, line: "Left center", comment: "Long par 4", 
            greenCenter: { lat: -26.2580, lng: 27.8960 },
            hazards: [
              { name: "Tree Line Right", type: "tree", location: { lat: -26.2590, lng: 27.8970 } }
            ]
          },
          { number: 4, par: 4, length: 340, line: "Iron for safety", comment: "Short dogleg", greenCenter: { lat: -26.2570, lng: 27.8970 } },
          { number: 5, par: 3, length: 180, line: "Right side", comment: "Tough green", greenCenter: { lat: -26.2565, lng: 27.8985 } },
          { number: 6, par: 4, length: 395, line: "Aim for the bunker", comment: "Straight away", greenCenter: { lat: -26.2585, lng: 27.8995 } },
          { number: 7, par: 4, length: 360, line: "Center", comment: "Avoid left", greenCenter: { lat: -26.2605, lng: 27.8985 } },
          { number: 8, par: 4, length: 375, line: "Left center", comment: "Narrow", greenCenter: { lat: -26.2625, lng: 27.8975 } },
          { number: 9, par: 4, length: 405, line: "Center", comment: "Heading home", greenCenter: { lat: -26.2635, lng: 27.8955 } },
          { number: 10, par: 5, length: 490, line: "Left center", comment: "New Par 5", greenCenter: { lat: -26.2655, lng: 27.8945 } },
          { number: 11, par: 4, length: 320, line: "Right side", comment: "Driveable?", greenCenter: { lat: -26.2675, lng: 27.8935 } },
          { number: 12, par: 4, length: 425, line: "Center", comment: "Longest par 4", greenCenter: { lat: -26.2695, lng: 27.8945 } },
          { number: 13, par: 3, length: 145, line: "Avoid front bunker", comment: "Short par 3", greenCenter: { lat: -26.2715, lng: 27.8965 } },
          { number: 14, par: 4, length: 385, line: "Left center", comment: "Uphill", greenCenter: { lat: -26.2705, lng: 27.8985 } },
          { number: 15, par: 4, length: 330, line: "Aim for 150m marker", comment: "Strategic", greenCenter: { lat: -26.2685, lng: 27.9005 } },
          { number: 16, par: 3, length: 140, line: "Center of green", comment: "Nearly home", greenCenter: { lat: -26.2665, lng: 27.8995 } },
          { number: 17, par: 4, length: 390, line: "Left center", comment: "Tough drive", greenCenter: { lat: -26.2645, lng: 27.8975 } },
          { number: 18, par: 5, length: 490, line: "Center stripe", comment: "Finish big", greenCenter: { lat: -26.2625, lng: 27.8955 } },
        ]
      },
      {
        name: "Royal Johannesburg & Kensington (East)",
        location: { lat: -26.1550, lng: 28.1064 },
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: [4, 4, 3, 5, 4, 3, 4, 4, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5][i],
          length: [400, 380, 160, 500, 420, 180, 390, 410, 430, 400, 380, 150, 520, 390, 410, 170, 420, 510][i]
        }))
      },
      {
        name: "Glendower Golf Club",
        location: { lat: -26.1436, lng: 28.1364 },
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: [4, 4, 3, 5, 4, 4, 4, 5, 3, 4, 5, 4, 4, 3, 5, 4, 3, 4][i],
          length: [410, 390, 170, 520, 430, 400, 415, 530, 160, 405, 510, 420, 395, 180, 540, 410, 175, 435][i]
        }))
      },
      {
        name: "Houghton Golf Club",
        location: { lat: -26.1600, lng: 28.0600 },
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: [4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 3, 4, 4, 5][i],
          length: [380, 150, 400, 510, 420, 390, 160, 405, 520, 395, 410, 170, 530, 400, 155, 415, 385, 505][i]
        }))
      },
      {
        name: "Bryanston Country Club",
        location: { lat: -26.0650, lng: 28.0150 },
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: [4, 4, 5, 3, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5][i],
          length: [370, 390, 500, 160, 410, 380, 155, 400, 520, 375, 165, 415, 510, 395, 385, 170, 405, 515][i]
        }))
      },
      {
        name: "Modderfontein Golf Club",
        location: { lat: -26.1150, lng: 28.1650 },
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 3, 4, 4, 5][i],
          length: [390, 380, 170, 530, 420, 410, 160, 405, 540, 400, 395, 155, 520, 415, 165, 425, 385, 535][i]
        }))
      }
    ];

    for (const course of courses) {
      const existing = await ctx.db
        .query("courses")
        .filter((q) => q.eq(q.field("name"), course.name))
        .first();
      if (existing) {
//@ts-expect-error
await ctx.db.replace(existing._id, course);
      } else {
//@ts-expect-error
await ctx.db.insert("courses", course);
      }
    }
    return null;
  },
});

export const getNearest = query({
  args: { lat: v.number(), lng: v.number() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("courses").collect();
    if (courses.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    for (const course of courses) {
      // Basic euclidean for quick sorting (fine for ~km scale)
      const dist = Math.sqrt(
        Math.pow(course.location.lat - args.lat, 2) +
        Math.pow(course.location.lng - args.lng, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = { ...course, distance: dist };
      }
    }

    return nearest;
  },
});

export const getById = query({
  args: { id: v.id("courses") },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("courses"),
    _creationTime: v.number(),
    name: v.string(),
  })),
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    return courses.map(c => ({
      _id: c._id,
      _creationTime: c._creationTime,
      name: c.name,
    }));
  },
});

export const calibrateHole = mutation({
  args: {
    courseId: v.id("courses"),
    holeNumber: v.number(),
    type: v.union(v.literal("front"), v.literal("center"), v.literal("back")),
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const holes = [...course.holes];
    const holeIndex = holes.findIndex(h => h.number === args.holeNumber);
    if (holeIndex === -1) throw new Error("Hole not found");

    const hole = { ...holes[holeIndex] };
    if (args.type === "front") hole.greenFront = { lat: args.lat, lng: args.lng };
    if (args.type === "center") hole.greenCenter = { lat: args.lat, lng: args.lng };
    if (args.type === "back") hole.greenBack = { lat: args.lat, lng: args.lng };

    holes[holeIndex] = hole;
    await ctx.db.patch(args.courseId, { holes });
    return null;
  },
});

export const addHazard = mutation({
  args: {
    courseId: v.id("courses"),
    holeNumber: v.number(),
    name: v.string(),
    type: v.union(v.literal("bunker"), v.literal("water"), v.literal("waste"), v.literal("tree")),
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const holes = [...course.holes];
    const holeIndex = holes.findIndex(h => h.number === args.holeNumber);
    if (holeIndex === -1) throw new Error("Hole not found");

    const hole = { ...holes[holeIndex] };
    const hazards = [...(hole.hazards || [])];
    hazards.push({
      name: args.name,
      type: args.type,
      location: { lat: args.lat, lng: args.lng },
    });

    hole.hazards = hazards;
    holes[holeIndex] = hole;
    await ctx.db.patch(args.courseId, { holes });
    return null;
  },
});

export const removeHazard = mutation({
  args: {
    courseId: v.id("courses"),
    holeNumber: v.number(),
    hazardName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const holes = [...course.holes];
    const holeIndex = holes.findIndex(h => h.number === args.holeNumber);
    if (holeIndex === -1) throw new Error("Hole not found");

    const hole = { ...holes[holeIndex] };
    hole.hazards = (hole.hazards || []).filter(h => h.name !== args.hazardName);
    
    holes[holeIndex] = hole;
    await ctx.db.patch(args.courseId, { holes });
    return null;
  },
});


