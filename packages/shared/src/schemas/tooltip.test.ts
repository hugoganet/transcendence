import { describe, it, expect } from "vitest";
import { tooltipSchema, tooltipCollectionSchema, termParamSchema } from "./tooltip.js";

describe("tooltipSchema", () => {
  const valid = {
    term: "Blockchain",
    definition: "A shared digital record that stores information in linked blocks",
    analogy: "Like a shared Google Doc that nobody can secretly edit",
    relatedTerms: ["block", "hash", "consensus"],
  };

  it("accepts a valid tooltip", () => {
    const result = tooltipSchema.parse(valid);
    expect(result.term).toBe("Blockchain");
    expect(result.relatedTerms).toHaveLength(3);
  });

  it("accepts empty relatedTerms array", () => {
    const result = tooltipSchema.parse({ ...valid, relatedTerms: [] });
    expect(result.relatedTerms).toHaveLength(0);
  });

  it("rejects missing term", () => {
    const { term: _term, ...noTerm } = valid;
    expect(() => tooltipSchema.parse(noTerm)).toThrow();
  });

  it("rejects missing definition", () => {
    const { definition: _definition, ...noDef } = valid;
    expect(() => tooltipSchema.parse(noDef)).toThrow();
  });

  it("rejects missing analogy", () => {
    const { analogy: _analogy, ...noAnalogy } = valid;
    expect(() => tooltipSchema.parse(noAnalogy)).toThrow();
  });

  it("rejects empty string fields", () => {
    expect(() => tooltipSchema.parse({ ...valid, term: "" })).toThrow();
    expect(() => tooltipSchema.parse({ ...valid, definition: "" })).toThrow();
    expect(() => tooltipSchema.parse({ ...valid, analogy: "" })).toThrow();
  });
});

describe("tooltipCollectionSchema", () => {
  it("accepts a valid collection", () => {
    const collection = {
      blockchain: {
        term: "Blockchain",
        definition: "A shared digital record",
        analogy: "Like a shared Google Doc",
        relatedTerms: ["block"],
      },
      block: {
        term: "Block",
        definition: "A container of data",
        analogy: "Like a page in a notebook",
        relatedTerms: ["blockchain"],
      },
    };
    const result = tooltipCollectionSchema.parse(collection);
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("accepts empty collection", () => {
    const result = tooltipCollectionSchema.parse({});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("rejects invalid tooltip in collection", () => {
    expect(() =>
      tooltipCollectionSchema.parse({
        bad: { term: "Bad" },
      }),
    ).toThrow();
  });
});

describe("termParamSchema", () => {
  it("validates lowercase term", () => {
    const result = termParamSchema.parse({ term: "blockchain" });
    expect(result.term).toBe("blockchain");
  });

  it("validates kebab-case term with hyphen", () => {
    const result = termParamSchema.parse({ term: "private-key" });
    expect(result.term).toBe("private-key");
  });

  it("rejects empty string", () => {
    expect(() => termParamSchema.parse({ term: "" })).toThrow();
  });

  it("rejects uppercase", () => {
    expect(() => termParamSchema.parse({ term: "UPPERCASE" })).toThrow();
  });

  it("rejects spaces", () => {
    expect(() => termParamSchema.parse({ term: "has spaces" })).toThrow();
  });

  it("rejects special characters", () => {
    expect(() => termParamSchema.parse({ term: "special!@#" })).toThrow();
  });

  it("rejects leading hyphen", () => {
    expect(() => termParamSchema.parse({ term: "-blockchain" })).toThrow();
  });

  it("rejects trailing hyphen", () => {
    expect(() => termParamSchema.parse({ term: "blockchain-" })).toThrow();
  });

  it("rejects term exceeding max length", () => {
    const longTerm = "a".repeat(101);
    expect(() => termParamSchema.parse({ term: longTerm })).toThrow();
  });
});
