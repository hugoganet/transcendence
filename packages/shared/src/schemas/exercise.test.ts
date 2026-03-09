import { describe, it, expect } from "vitest";
import {
  siExerciseContentSchema,
  cmExerciseContentSchema,
  ipExerciseContentSchema,
  stExerciseContentSchema,
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
