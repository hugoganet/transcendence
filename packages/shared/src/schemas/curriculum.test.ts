import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  exerciseTypeSchema,
  progressiveRevealSchema,
  missionSchema,
  chapterSchema,
  categorySchema,
  curriculumStructureSchema,
} from "./curriculum.js";

describe("exerciseTypeSchema", () => {
  it("accepts valid exercise types", () => {
    expect(exerciseTypeSchema.parse("SI")).toBe("SI");
    expect(exerciseTypeSchema.parse("CM")).toBe("CM");
    expect(exerciseTypeSchema.parse("IP")).toBe("IP");
    expect(exerciseTypeSchema.parse("ST")).toBe("ST");
  });

  it("rejects invalid exercise types", () => {
    expect(() => exerciseTypeSchema.parse("MCQ")).toThrow();
    expect(() => exerciseTypeSchema.parse("")).toThrow();
    expect(() => exerciseTypeSchema.parse(42)).toThrow();
  });
});

describe("progressiveRevealSchema", () => {
  it("accepts valid progressive reveal", () => {
    const result = progressiveRevealSchema.parse({
      mechanic: "tokensRevealed",
      description: "Knowledge Tokens become visible",
    });
    expect(result.mechanic).toBe("tokensRevealed");
  });

  it("accepts all mechanic types", () => {
    for (const mechanic of ["tokensRevealed", "walletRevealed", "gasRevealed", "dashboardRevealed"]) {
      expect(() =>
        progressiveRevealSchema.parse({ mechanic, description: "test" }),
      ).not.toThrow();
    }
  });

  it("rejects invalid mechanic", () => {
    expect(() =>
      progressiveRevealSchema.parse({ mechanic: "invalid", description: "test" }),
    ).toThrow();
  });

  it("rejects missing description", () => {
    expect(() =>
      progressiveRevealSchema.parse({ mechanic: "tokensRevealed" }),
    ).toThrow();
  });
});

describe("missionSchema", () => {
  const validMission = {
    id: "1.1.1",
    order: 1,
    name: "whoDoYouTrust",
    description: "whoDoYouTrustDesc",
    exerciseType: "SI",
    estimatedMinutes: 3,
    lastReviewedDate: "2026-03-09",
    progressiveReveal: null,
  };

  it("accepts a valid mission", () => {
    const result = missionSchema.parse(validMission);
    expect(result.id).toBe("1.1.1");
    expect(result.exerciseType).toBe("SI");
    expect(result.progressiveReveal).toBeNull();
  });

  it("accepts a mission with progressive reveal", () => {
    const result = missionSchema.parse({
      ...validMission,
      progressiveReveal: {
        mechanic: "tokensRevealed",
        description: "Tokens visible",
      },
    });
    expect(result.progressiveReveal?.mechanic).toBe("tokensRevealed");
  });

  it("rejects invalid mission ID format", () => {
    expect(() => missionSchema.parse({ ...validMission, id: "1-1-1" })).toThrow();
    expect(() => missionSchema.parse({ ...validMission, id: "abc" })).toThrow();
    expect(() => missionSchema.parse({ ...validMission, id: "1.1" })).toThrow();
  });

  it("rejects missing required fields", () => {
    const { name: _name, ...noName } = validMission;
    expect(() => missionSchema.parse(noName)).toThrow();
  });

  it("rejects invalid exercise type", () => {
    expect(() =>
      missionSchema.parse({ ...validMission, exerciseType: "MCQ" }),
    ).toThrow();
  });

  it("rejects estimatedMinutes outside 2-5 range", () => {
    expect(() =>
      missionSchema.parse({ ...validMission, estimatedMinutes: 1 }),
    ).toThrow();
    expect(() =>
      missionSchema.parse({ ...validMission, estimatedMinutes: 6 }),
    ).toThrow();
  });

  it("rejects invalid date format", () => {
    expect(() =>
      missionSchema.parse({ ...validMission, lastReviewedDate: "March 9 2026" }),
    ).toThrow();
  });
});

describe("chapterSchema", () => {
  const validChapter = {
    id: "1.1",
    order: 1,
    name: "theTrustProblem",
    description: "theTrustProblemDesc",
    disclaimerRequired: false,
    missions: [
      {
        id: "1.1.1",
        order: 1,
        name: "whoDoYouTrust",
        description: "whoDoYouTrustDesc",
        exerciseType: "SI",
        estimatedMinutes: 3,
        lastReviewedDate: "2026-03-09",
        progressiveReveal: null,
      },
    ],
  };

  it("accepts a valid chapter", () => {
    const result = chapterSchema.parse(validChapter);
    expect(result.id).toBe("1.1");
    expect(result.missions).toHaveLength(1);
  });

  it("rejects invalid chapter ID format", () => {
    expect(() => chapterSchema.parse({ ...validChapter, id: "1" })).toThrow();
    expect(() => chapterSchema.parse({ ...validChapter, id: "1.1.1" })).toThrow();
  });

  it("rejects empty missions array", () => {
    expect(() =>
      chapterSchema.parse({ ...validChapter, missions: [] }),
    ).toThrow();
  });
});

describe("categorySchema", () => {
  const validCategory = {
    id: "1",
    order: 1,
    name: "blockchainFoundations",
    description: "blockchainFoundationsDesc",
    platformMechanic: "xpOnly",
    chapters: [
      {
        id: "1.1",
        order: 1,
        name: "theTrustProblem",
        description: "theTrustProblemDesc",
        disclaimerRequired: false,
        missions: [
          {
            id: "1.1.1",
            order: 1,
            name: "whoDoYouTrust",
            description: "whoDoYouTrustDesc",
            exerciseType: "SI",
            estimatedMinutes: 3,
            lastReviewedDate: "2026-03-09",
            progressiveReveal: null,
          },
        ],
      },
    ],
  };

  it("accepts a valid category", () => {
    const result = categorySchema.parse(validCategory);
    expect(result.id).toBe("1");
  });

  it("rejects invalid category ID", () => {
    expect(() => categorySchema.parse({ ...validCategory, id: "1.1" })).toThrow();
  });
});

describe("curriculumStructureSchema", () => {
  it("rejects empty array", () => {
    expect(() => curriculumStructureSchema.parse([])).toThrow();
  });

  it("validates progressive reveal triggers exist", () => {
    const structurePath = resolve(process.cwd(), "../../content/structure.json");
    const structure = JSON.parse(readFileSync(structurePath, "utf-8"));
    const result = curriculumStructureSchema.parse(structure);
    expect(result).toHaveLength(6);

    // Verify progressive reveal missions
    const reveals: Array<{ id: string; mechanic: string }> = [];
    for (const cat of result) {
      for (const ch of cat.chapters) {
        for (const m of ch.missions) {
          if (m.progressiveReveal) {
            reveals.push({ id: m.id, mechanic: m.progressiveReveal.mechanic });
          }
        }
      }
    }
    expect(reveals).toEqual([
      { id: "2.2.4", mechanic: "tokensRevealed" },
      { id: "3.1.4", mechanic: "walletRevealed" },
      { id: "3.3.3", mechanic: "gasRevealed" },
      { id: "6.3.4", mechanic: "dashboardRevealed" },
    ]);
  });
});
