import { describe, it, expect } from "vitest";
import {
  siExerciseContentSchema,
  cmExerciseContentSchema,
  ipExerciseContentSchema,
  stExerciseContentSchema,
  siSubmissionSchema,
  cmSubmissionSchema,
  ipSubmissionSchema,
  stSubmissionSchema,
  exerciseSubmissionSchema,
  exerciseResultSchema,
  missionExerciseStatusSchema,
} from "./exercise.js";

describe("siExerciseContentSchema", () => {
  const valid = {
    scenario: "You receive an email claiming to be from your bank.",
    question: "What should you do?",
    options: [
      { id: "a", text: "Click the link", isCorrect: false, explanation: "This could be phishing." },
      { id: "b", text: "Ignore it", isCorrect: true, explanation: "Correct approach." },
    ],
  };

  it("accepts valid SI content", () => {
    const result = siExerciseContentSchema.parse(valid);
    expect(result.options).toHaveLength(2);
  });

  it("accepts content with placeholder flag", () => {
    const result = siExerciseContentSchema.parse({ ...valid, placeholder: true });
    expect(result.placeholder).toBe(true);
  });

  it("rejects missing scenario", () => {
    const { scenario, ...noScenario } = valid;
    expect(() => siExerciseContentSchema.parse(noScenario)).toThrow();
  });

  it("rejects missing question", () => {
    const { question, ...noQuestion } = valid;
    expect(() => siExerciseContentSchema.parse(noQuestion)).toThrow();
  });

  it("rejects fewer than 2 options", () => {
    expect(() =>
      siExerciseContentSchema.parse({
        ...valid,
        options: [valid.options[0]],
      }),
    ).toThrow();
  });

  it("rejects options missing required fields", () => {
    expect(() =>
      siExerciseContentSchema.parse({
        ...valid,
        options: [{ id: "a", text: "test" }],
      }),
    ).toThrow();
  });
});

describe("cmExerciseContentSchema", () => {
  const valid = {
    instruction: "Match each term with its definition",
    pairs: [
      { id: "1", term: "Blockchain", definition: "A shared digital ledger", analogy: "Like a Google Doc" },
      { id: "2", term: "Consensus", definition: "Network agreement" },
    ],
  };

  it("accepts valid CM content", () => {
    const result = cmExerciseContentSchema.parse(valid);
    expect(result.pairs).toHaveLength(2);
  });

  it("allows optional analogy", () => {
    const result = cmExerciseContentSchema.parse(valid);
    expect(result.pairs[0].analogy).toBe("Like a Google Doc");
    expect(result.pairs[1].analogy).toBeUndefined();
  });

  it("rejects fewer than 2 pairs", () => {
    expect(() =>
      cmExerciseContentSchema.parse({
        ...valid,
        pairs: [valid.pairs[0]],
      }),
    ).toThrow();
  });

  it("rejects missing instruction", () => {
    const { instruction, ...noInstruction } = valid;
    expect(() => cmExerciseContentSchema.parse(noInstruction)).toThrow();
  });
});

describe("ipExerciseContentSchema", () => {
  const valid = {
    instruction: "Arrange the blocks in order",
    items: [
      { id: "1", label: "Block #1", correctPosition: 0 },
      { id: "2", label: "Block #2", correctPosition: 1 },
    ],
    zones: [
      { id: "z1", label: "Position 1" },
      { id: "z2", label: "Position 2" },
    ],
  };

  it("accepts valid IP content", () => {
    const result = ipExerciseContentSchema.parse(valid);
    expect(result.items).toHaveLength(2);
    expect(result.zones).toHaveLength(2);
  });

  it("allows optional zones", () => {
    const { zones, ...noZones } = valid;
    const result = ipExerciseContentSchema.parse(noZones);
    expect(result.zones).toBeUndefined();
  });

  it("rejects fewer than 2 items", () => {
    expect(() =>
      ipExerciseContentSchema.parse({
        ...valid,
        items: [valid.items[0]],
      }),
    ).toThrow();
  });

  it("rejects negative correctPosition", () => {
    expect(() =>
      ipExerciseContentSchema.parse({
        ...valid,
        items: [
          { id: "1", label: "Block", correctPosition: -1 },
          { id: "2", label: "Block 2", correctPosition: 0 },
        ],
      }),
    ).toThrow();
  });
});

describe("stExerciseContentSchema", () => {
  const valid = {
    instruction: "Set up your wallet",
    steps: [
      {
        id: "1",
        prompt: "Choose a wallet type:",
        options: [
          { id: "a", text: "Hot wallet", isCorrect: true, explanation: "Good for beginners" },
          { id: "b", text: "Cold wallet", isCorrect: false, explanation: "More advanced" },
        ],
        microExplanation: "A hot wallet is an app on your device.",
      },
    ],
  };

  it("accepts valid ST content", () => {
    const result = stExerciseContentSchema.parse(valid);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].options).toHaveLength(2);
  });

  it("rejects empty steps array", () => {
    expect(() =>
      stExerciseContentSchema.parse({ ...valid, steps: [] }),
    ).toThrow();
  });

  it("rejects steps with fewer than 2 options", () => {
    expect(() =>
      stExerciseContentSchema.parse({
        ...valid,
        steps: [{ ...valid.steps[0], options: [valid.steps[0].options[0]] }],
      }),
    ).toThrow();
  });

  it("rejects missing microExplanation", () => {
    const { microExplanation, ...noMicro } = valid.steps[0];
    expect(() =>
      stExerciseContentSchema.parse({ ...valid, steps: [noMicro] }),
    ).toThrow();
  });
});

// --- Submission Schema Tests ---

describe("siSubmissionSchema", () => {
  it("accepts valid SI submission", () => {
    const result = siSubmissionSchema.parse({ type: "SI", submission: { selectedOptionId: "b" } });
    expect(result.type).toBe("SI");
    expect(result.submission.selectedOptionId).toBe("b");
  });

  it("rejects empty selectedOptionId", () => {
    expect(() => siSubmissionSchema.parse({ type: "SI", submission: { selectedOptionId: "" } })).toThrow();
  });

  it("rejects missing submission", () => {
    expect(() => siSubmissionSchema.parse({ type: "SI" })).toThrow();
  });
});

describe("cmSubmissionSchema", () => {
  it("accepts valid CM submission", () => {
    const result = cmSubmissionSchema.parse({
      type: "CM",
      submission: { matches: [{ termId: "1", definitionId: "2" }, { termId: "2", definitionId: "1" }] },
    });
    expect(result.submission.matches).toHaveLength(2);
  });

  it("rejects empty matches array", () => {
    expect(() => cmSubmissionSchema.parse({ type: "CM", submission: { matches: [] } })).toThrow();
  });

  it("rejects match with empty termId", () => {
    expect(() =>
      cmSubmissionSchema.parse({ type: "CM", submission: { matches: [{ termId: "", definitionId: "1" }] } }),
    ).toThrow();
  });
});

describe("ipSubmissionSchema", () => {
  it("accepts valid IP submission", () => {
    const result = ipSubmissionSchema.parse({
      type: "IP",
      submission: { positions: [{ itemId: "1", position: 0 }, { itemId: "2", position: 1 }] },
    });
    expect(result.submission.positions).toHaveLength(2);
  });

  it("rejects negative position", () => {
    expect(() =>
      ipSubmissionSchema.parse({ type: "IP", submission: { positions: [{ itemId: "1", position: -1 }] } }),
    ).toThrow();
  });

  it("rejects empty positions array", () => {
    expect(() => ipSubmissionSchema.parse({ type: "IP", submission: { positions: [] } })).toThrow();
  });
});

describe("stSubmissionSchema", () => {
  it("accepts valid ST submission", () => {
    const result = stSubmissionSchema.parse({
      type: "ST",
      submission: { stepAnswers: [{ stepId: "1", selectedOptionId: "a" }] },
    });
    expect(result.submission.stepAnswers).toHaveLength(1);
  });

  it("rejects empty stepAnswers array", () => {
    expect(() => stSubmissionSchema.parse({ type: "ST", submission: { stepAnswers: [] } })).toThrow();
  });

  it("rejects empty stepId", () => {
    expect(() =>
      stSubmissionSchema.parse({ type: "ST", submission: { stepAnswers: [{ stepId: "", selectedOptionId: "a" }] } }),
    ).toThrow();
  });
});

describe("exerciseSubmissionSchema (discriminated union)", () => {
  it("parses SI submission correctly", () => {
    const result = exerciseSubmissionSchema.parse({ type: "SI", submission: { selectedOptionId: "a" } });
    expect(result.type).toBe("SI");
  });

  it("parses CM submission correctly", () => {
    const result = exerciseSubmissionSchema.parse({
      type: "CM",
      submission: { matches: [{ termId: "1", definitionId: "1" }] },
    });
    expect(result.type).toBe("CM");
  });

  it("parses IP submission correctly", () => {
    const result = exerciseSubmissionSchema.parse({
      type: "IP",
      submission: { positions: [{ itemId: "1", position: 0 }] },
    });
    expect(result.type).toBe("IP");
  });

  it("parses ST submission correctly", () => {
    const result = exerciseSubmissionSchema.parse({
      type: "ST",
      submission: { stepAnswers: [{ stepId: "1", selectedOptionId: "a" }] },
    });
    expect(result.type).toBe("ST");
  });

  it("rejects invalid type", () => {
    expect(() =>
      exerciseSubmissionSchema.parse({ type: "INVALID", submission: {} }),
    ).toThrow();
  });
});

describe("exerciseResultSchema", () => {
  it("accepts valid result", () => {
    const result = exerciseResultSchema.parse({
      correct: true,
      score: 2,
      totalPoints: 2,
      feedback: [
        { itemId: "a", correct: true, explanation: "Correct!", correctAnswer: null },
        { itemId: "b", correct: true, explanation: "Good!", correctAnswer: null },
      ],
    });
    expect(result.score).toBe(2);
  });

  it("accepts result with incorrect items", () => {
    const result = exerciseResultSchema.parse({
      correct: false,
      score: 1,
      totalPoints: 2,
      feedback: [
        { itemId: "a", correct: true, explanation: "Correct!", correctAnswer: null },
        { itemId: "b", correct: false, explanation: "Wrong.", correctAnswer: "Option C" },
      ],
    });
    expect(result.correct).toBe(false);
    expect(result.feedback[1].correctAnswer).toBe("Option C");
  });
});

describe("missionExerciseStatusSchema", () => {
  it("accepts valid status", () => {
    const result = missionExerciseStatusSchema.parse({
      missionId: "1.1.1",
      completable: true,
      attempts: 3,
      lastAttemptCorrect: true,
    });
    expect(result.completable).toBe(true);
  });

  it("accepts null lastAttemptCorrect", () => {
    const result = missionExerciseStatusSchema.parse({
      missionId: "1.1.1",
      completable: false,
      attempts: 0,
      lastAttemptCorrect: null,
    });
    expect(result.lastAttemptCorrect).toBeNull();
  });
});
