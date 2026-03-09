import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  loadCurriculum,
  loadMissions,
  loadTooltips,
  loadUIStrings,
  initializeContent,
  getContent,
  getStaleContent,
} from "./contentLoader.js";

describe("contentLoader", () => {
  describe("loadCurriculum", () => {
    it("loads and validates structure.json", () => {
      const curriculum = loadCurriculum();
      expect(curriculum).toHaveLength(6);
      expect(curriculum[0].id).toBe("1");
      expect(curriculum[5].id).toBe("6");
    });

    it("contains 69 total missions", () => {
      const curriculum = loadCurriculum();
      let count = 0;
      for (const cat of curriculum) {
        for (const ch of cat.chapters) {
          count += ch.missions.length;
        }
      }
      expect(count).toBe(69);
    });
  });

  describe("loadMissions", () => {
    it("loads English missions", () => {
      const missions = loadMissions("en");
      expect(Object.keys(missions)).toHaveLength(69);
      expect(missions["1.1.1"].title).toBeTruthy();
    });

    it("loads French missions", () => {
      const missions = loadMissions("fr");
      expect(Object.keys(missions)).toHaveLength(69);
      expect(missions["1.1.1"].title).toBeTruthy();
    });
  });

  describe("loadTooltips", () => {
    it("loads English tooltips", () => {
      const tooltips = loadTooltips("en");
      expect(Object.keys(tooltips).length).toBeGreaterThanOrEqual(20);
      expect(tooltips["blockchain"].term).toBeTruthy();
    });

    it("loads French tooltips", () => {
      const tooltips = loadTooltips("fr");
      expect(Object.keys(tooltips).length).toBeGreaterThanOrEqual(20);
      expect(tooltips["blockchain"].term).toBeTruthy();
    });
  });

  describe("loadUIStrings", () => {
    it("loads English UI strings", () => {
      const ui = loadUIStrings("en");
      expect(ui.categories).toBeTruthy();
      expect(ui.chapters).toBeTruthy();
      expect(ui.exerciseTypes).toBeTruthy();
      expect(ui.labels).toBeTruthy();
    });

    it("loads French UI strings", () => {
      const ui = loadUIStrings("fr");
      expect(ui.categories).toBeTruthy();
      expect(ui.chapters).toBeTruthy();
    });
  });

  describe("initializeContent and getContent", () => {
    it("throws before initialization", async () => {
      vi.resetModules();
      const mod = await import("./contentLoader.js");
      expect(() => mod.getContent()).toThrow("Content not initialized");
    });

    it("initializes and caches content for multiple locales", () => {
      initializeContent(["en", "fr"]);
      const content = getContent();
      expect(content.curriculum).toHaveLength(6);
      expect(content.missions.get("en")).toBeTruthy();
      expect(content.missions.get("fr")).toBeTruthy();
      expect(content.tooltips.get("en")).toBeTruthy();
      expect(content.tooltips.get("fr")).toBeTruthy();
      expect(content.uiStrings.get("en")).toBeTruthy();
      expect(content.uiStrings.get("fr")).toBeTruthy();
    });
  });

  describe("getStaleContent", () => {
    beforeAll(() => {
      initializeContent(["en"]);
    });

    it("returns empty for recently reviewed content", () => {
      // All content has lastReviewedDate = 2026-03-09 (today)
      const stale = getStaleContent(6);
      expect(stale).toHaveLength(0);
    });

    it("identifies stale content when date is in the past", () => {
      // Mock Date to be 7 months in the future so all content (dated 2026-03-09) is stale
      const realDate = globalThis.Date;
      const futureDate = new Date("2026-10-15");
      vi.useFakeTimers({ now: futureDate });

      const stale = getStaleContent(6);
      expect(stale.length).toBeGreaterThan(0);
      expect(stale).toHaveLength(69);
      expect(stale[0]).toHaveProperty("id");
      expect(stale[0]).toHaveProperty("name");
      expect(stale[0]).toHaveProperty("lastReviewedDate");

      vi.useRealTimers();
    });
  });
});
