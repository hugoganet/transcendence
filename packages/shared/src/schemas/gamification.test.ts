import { describe, it, expect } from "vitest";
import { streakSchema } from "./gamification.js";

describe("streakSchema", () => {
  it("accepts valid streak data", () => {
    const data = {
      currentStreak: 5,
      longestStreak: 12,
      lastMissionCompletedAt: "2026-03-10T14:30:00.000Z",
      totalMissionsCompleted: 23,
      totalModulesMastered: 2,
    };
    expect(streakSchema.parse(data)).toEqual(data);
  });

  it("accepts new user with all zeros and null", () => {
    const data = {
      currentStreak: 0,
      longestStreak: 0,
      lastMissionCompletedAt: null,
      totalMissionsCompleted: 0,
      totalModulesMastered: 0,
    };
    expect(streakSchema.parse(data)).toEqual(data);
  });

  it("rejects negative currentStreak", () => {
    const data = {
      currentStreak: -1,
      longestStreak: 0,
      lastMissionCompletedAt: null,
      totalMissionsCompleted: 0,
      totalModulesMastered: 0,
    };
    expect(() => streakSchema.parse(data)).toThrow();
  });

  it("rejects non-integer values", () => {
    const data = {
      currentStreak: 1.5,
      longestStreak: 0,
      lastMissionCompletedAt: null,
      totalMissionsCompleted: 0,
      totalModulesMastered: 0,
    };
    expect(() => streakSchema.parse(data)).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => streakSchema.parse({})).toThrow();
    expect(() => streakSchema.parse({ currentStreak: 0 })).toThrow();
  });
});
