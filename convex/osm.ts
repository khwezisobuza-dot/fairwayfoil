import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

const ENRICH_EXPIRY = 1000 * 60 * 60 * 24; // 1 day

export const enrichCourse = action({
  args: { courseId: v.id("courses"), lat: v.number(), lng: v.number() },
  handler: async (ctx, args) => {
    // Check if recently enriched to avoid redundant API calls
    const course: any = await ctx.runQuery(api.courses.getById, { id: args.courseId });
    if (course?.lastEnriched && (Date.now() - course.lastEnriched < ENRICH_EXPIRY)) {
      return;
    }

    const query = `
      [out:json][timeout:15];
      (
        node["golf"](around:1500, ${args.lat}, ${args.lng});
        way["golf"](around:1500, ${args.lat}, ${args.lng});
        relation["golf"](around:1500, ${args.lat}, ${args.lng});
      );
      out center;
    `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error("OSM API returned status:", response.status);
        return;
      }
      
      const data = await response.json();
      const elements = data.elements || [];
      const holeUpdates: Record<number, any> = {};
      
      for (const el of elements) {
        const holeNum = parseInt(el.tags?.hole);
        const center = el.center || { lat: el.lat, lng: el.lon };
        
        if (!center?.lat || !center?.lng) continue;

        if (holeNum && !isNaN(holeNum)) {
          if (!holeUpdates[holeNum]) {
            holeUpdates[holeNum] = { hazards: [], greenCenter: null };
          }

          if (el.tags.golf === "green") {
            holeUpdates[holeNum].greenCenter = { lat: center.lat, lng: center.lng };
          } else if (["bunker", "water_hazard", "lateral_water_hazard"].includes(el.tags.golf)) {
            holeUpdates[holeNum].hazards.push({
              name: el.tags.name || `${el.tags.golf.replace(/_/g, " ")}`,
              type: el.tags.golf.includes("water") ? "water" : "bunker",
              location: { lat: center.lat, lng: center.lng }
            });
          }
        }
      }

      if (Object.keys(holeUpdates).length > 0) {
        await ctx.runMutation(internal.osm.updateCourseData, {
          courseId: args.courseId,
          holeUpdates
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Auto-recon timed out.");
      } else {
        console.error("Auto-recon failed:", error.message);
      }
    } finally {
      clearTimeout(timeout);
    }
  },
});

export const updateCourseData = internalMutation({
  args: {
    courseId: v.id("courses"),
    holeUpdates: v.any(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return;

    const newHoles = course.holes.map((hole) => {
      const update = args.holeUpdates[hole.number];
      if (update) {
        // Precise deduplication: name + rounded coords
        const existingHazards = hole.hazards || [];
        const newHazards = update.hazards || [];
        
        const combined = [...existingHazards, ...newHazards];
        const unique = combined.filter((v, i, a) => {
           const lat1 = v.location.lat.toFixed(5);
           const lng1 = v.location.lng.toFixed(5);
           return a.findIndex(t => (
             t.name.toLowerCase() === v.name.toLowerCase() && 
             t.location.lat.toFixed(5) === lat1 && 
             t.location.lng.toFixed(5) === lng1
           )) === i;
        });

        return {
          ...hole,
          greenCenter: update.greenCenter || hole.greenCenter,
          hazards: unique,
        };
      }
      return hole;
    });

    await ctx.db.patch(args.courseId, { 
      holes: newHoles,
      lastEnriched: Date.now()
    });
  },
});
