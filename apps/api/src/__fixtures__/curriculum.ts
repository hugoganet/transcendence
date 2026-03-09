import { vi } from "vitest";

/**
 * Shared test fixture: 2 categories, each with 1 chapter.
 * Category 1: Chapter 1.1 with missions 1.1.1 and 1.1.2
 * Category 2: Chapter 2.1 with mission 2.1.1
 * Total: 3 missions — enough to test within-chapter, cross-chapter, and cross-category unlock logic.
 */
export const minimalCurriculum = [
  {
    id: "1",
    order: 1,
    name: "cat1",
    description: "Category 1",
    platformMechanic: "xpOnly",
    chapters: [
      {
        id: "1.1",
        order: 1,
        name: "ch1.1",
        description: "Chapter 1.1",
        disclaimerRequired: false,
        missions: [
          {
            id: "1.1.1",
            order: 1,
            name: "m1.1.1",
            description: "Mission 1.1.1",
            exerciseType: "SI",
            estimatedMinutes: 3,
            lastReviewedDate: "2026-03-09",
            progressiveReveal: null,
          },
          {
            id: "1.1.2",
            order: 2,
            name: "m1.1.2",
            description: "Mission 1.1.2",
            exerciseType: "CM",
            estimatedMinutes: 3,
            lastReviewedDate: "2026-03-09",
            progressiveReveal: {
              mechanic: "tokensRevealed",
              description: "You've unlocked Knowledge Tokens!",
            },
          },
        ],
      },
    ],
  },
  {
    id: "2",
    order: 2,
    name: "cat2",
    description: "Category 2",
    platformMechanic: "tokens",
    chapters: [
      {
        id: "2.1",
        order: 1,
        name: "ch2.1",
        description: "Chapter 2.1",
        disclaimerRequired: false,
        missions: [
          {
            id: "2.1.1",
            order: 1,
            name: "m2.1.1",
            description: "Mission 2.1.1",
            exerciseType: "IP",
            estimatedMinutes: 4,
            lastReviewedDate: "2026-03-09",
            progressiveReveal: null,
          },
        ],
      },
    ],
  },
];

export const missionContentMap: Record<string, unknown> = {
  "1.1.1": {
    title: "Who Do You Trust?",
    description: "Explore trust in transactions",
    learningObjective: "Understand middlemen",
    exerciseContent: { scenario: "test", question: "test?", options: [] },
  },
  "1.1.2": {
    title: "What Could Go Wrong?",
    description: "Explore failures",
    learningObjective: "Understand single points of failure",
    exerciseContent: { scenario: "test2", question: "test2?", options: [] },
  },
  "2.1.1": {
    title: "Your First Token",
    description: "Learn about digital tokens",
    learningObjective: "Understand token basics",
    exerciseContent: { items: [], zones: [] },
  },
};

export function createMockContent(mockGetContent: ReturnType<typeof vi.fn>) {
  return function setupContent() {
    const missionsMap = new Map();
    missionsMap.set("en", missionContentMap);
    const tooltipsMap = new Map();
    tooltipsMap.set("en", {
      blockchain: { term: "blockchain", definition: "A chain of blocks" },
    });
    const uiStringsMap = new Map();
    uiStringsMap.set("en", {});

    mockGetContent.mockReturnValue({
      curriculum: minimalCurriculum,
      missions: missionsMap,
      tooltips: tooltipsMap,
      uiStrings: uiStringsMap,
    });
  };
}
