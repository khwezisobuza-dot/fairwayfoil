import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const updateWeather = action({
  args: {
    roundId: v.id("rounds"),
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Use Open-Meteo for free weather data (no key required)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${args.lat}&longitude=${args.lng}&current=temperature_2m,rain,wind_speed_10m,wind_direction_10m`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.current) {
        await ctx.runMutation(api.rounds.saveWeather, {
          id: args.roundId,
          weather: {
            temp: data.current.temperature_2m,
            windSpeed: data.current.wind_speed_10m,
            windDir: data.current.wind_direction_10m,
            isRaining: data.current.rain > 0,
          }
        });
      }
    } catch (error) {
      console.error("Weather fetch failed:", error);
    }
    return null;
  },
});
