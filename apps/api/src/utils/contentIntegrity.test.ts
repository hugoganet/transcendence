import { describe, it, expect, beforeAll } from "vitest";
import { loadCurriculum, loadMissions, loadTooltips } from "./contentLoader.js";
import {
  siExerciseContentSchema,
  cmExerciseContentSchema,
  ipExerciseContentSchema,
  stExerciseContentSchema,
  type CurriculumStructure,
  type MissionContentCollection,
  type TooltipCollection,
} from "@transcendence/shared";

describe("content integrity", () => {
  let curriculum: CurriculumStructure;
  let enMissions: MissionContentCollection;
  let frMissions: MissionContentCollection;
  let enTooltips: TooltipCollection;
  let frTooltips: TooltipCollection;

  beforeAll(() => {
    curriculum = loadCurriculum();
    enMissions = loadMissions("en");
    frMissions = loadMissions("fr");
    enTooltips = loadTooltips("en");
    frTooltips = loadTooltips("fr");
  });

  it("all 69 missions in structure.json have corresponding entries in en/missions.json", () => {
    const structureIds: string[] = [];
    for (const cat of curriculum) {
      for (const ch of cat.chapters) {
        for (const m of ch.missions) {
          structureIds.push(m.id);
        }
      }
    }
    expect(structureIds).toHaveLength(69);

    const missing = structureIds.filter((id) => !(id in enMissions));
    expect(missing).toEqual([]);
  });

  it("all mission IDs follow the {cat}.{chap}.{mission} format", () => {
    const pattern = /^\d+\.\d+\.\d+$/;
    for (const cat of curriculum) {
      for (const ch of cat.chapters) {
        for (const m of ch.missions) {
          expect(m.id).toMatch(pattern);
        }
      }
    }
  });

  it("all exercise types match between structure.json and missions.json content shape", () => {
    for (const cat of curriculum) {
      for (const ch of cat.chapters) {
        for (const m of ch.missions) {
          const content = enMissions[m.id];
          expect(content, `Mission ${m.id} missing from en/missions.json`).toBeTruthy();

          const ec = content.exerciseContent;
          let result;
          switch (m.exerciseType) {
            case "SI":
              result = siExerciseContentSchema.safeParse(ec);
              expect(result.success, `Mission ${m.id} (SI): ${!result.success ? result.error.message : ""}`).toBe(true);
              break;
            case "CM":
              result = cmExerciseContentSchema.safeParse(ec);
              expect(result.success, `Mission ${m.id} (CM): ${!result.success ? result.error.message : ""}`).toBe(true);
              break;
            case "IP":
              result = ipExerciseContentSchema.safeParse(ec);
              expect(result.success, `Mission ${m.id} (IP): ${!result.success ? result.error.message : ""}`).toBe(true);
              break;
            case "ST":
              result = stExerciseContentSchema.safeParse(ec);
              expect(result.success, `Mission ${m.id} (ST): ${!result.success ? result.error.message : ""}`).toBe(true);
              break;
          }
        }
      }
    }
  });

  it("all progressive reveal missions exist (2.2.4, 3.1.4, 3.3.3, 6.3.4)", () => {
    const revealIds = ["2.2.4", "3.1.4", "3.3.3", "6.3.4"];
    const found: string[] = [];

    for (const cat of curriculum) {
      for (const ch of cat.chapters) {
        for (const m of ch.missions) {
          if (m.progressiveReveal) {
            found.push(m.id);
          }
        }
      }
    }

    expect(found.sort()).toEqual(revealIds.sort());
  });

  it("all tooltip relatedTerms reference existing tooltip keys", () => {
    const keys = Object.keys(enTooltips);
    for (const [slug, tooltip] of Object.entries(enTooltips)) {
      for (const related of tooltip.relatedTerms) {
        expect(keys).toContain(related);
      }
    }
  });

  it("French content has all keys that English content has", () => {
    const enMissionKeys = Object.keys(enMissions).sort();
    const frMissionKeys = Object.keys(frMissions).sort();
    expect(frMissionKeys).toEqual(enMissionKeys);

    const enTooltipKeys = Object.keys(enTooltips).sort();
    const frTooltipKeys = Object.keys(frTooltips).sort();
    expect(frTooltipKeys).toEqual(enTooltipKeys);
  });

  it("disclaimer chapters are correctly flagged (2.3, 6.1, 6.2)", () => {
    const disclaimerChapters: string[] = [];
    for (const cat of curriculum) {
      for (const ch of cat.chapters) {
        if (ch.disclaimerRequired) {
          disclaimerChapters.push(ch.id);
        }
      }
    }
    expect(disclaimerChapters.sort()).toEqual(["2.3", "6.1", "6.2"]);
  });
});
