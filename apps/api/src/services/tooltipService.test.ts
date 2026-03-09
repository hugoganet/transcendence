import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetContent = vi.hoisted(() => vi.fn());

vi.mock("../utils/contentLoader.js", () => ({
  getContent: mockGetContent,
}));

import { getTooltip, getGlossary } from "./tooltipService.js";

const enTooltips = {
  blockchain: {
    term: "Blockchain",
    definition: "A shared digital record that stores information in linked blocks",
    analogy: "Like a shared Google Doc that nobody can secretly edit",
    relatedTerms: ["block", "hash"],
  },
  hash: {
    term: "Hash",
    definition: "A unique digital fingerprint of data",
    analogy: "Like a fingerprint that uniquely identifies a person",
    relatedTerms: ["block", "blockchain"],
  },
};

const frTooltips = {
  blockchain: {
    term: "Blockchain",
    definition: "Un registre numerique partage qui stocke des informations",
    analogy: "Comme un Google Doc partage que personne ne peut modifier secretement",
    relatedTerms: ["block", "hash"],
  },
};

function setupMockContent(tooltipsEntries: [string, Record<string, unknown>][]) {
  mockGetContent.mockReturnValue({
    tooltips: new Map(tooltipsEntries),
    curriculum: [],
    missions: new Map(),
    uiStrings: new Map(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupMockContent([
    ["en", enTooltips],
    ["fr", frTooltips],
  ]);
});

describe("getTooltip", () => {
  it("returns correct tooltip for existing term in English", () => {
    const result = getTooltip("blockchain", "en");
    expect(result.term).toBe("Blockchain");
    expect(result.definition).toContain("shared digital record");
    expect(result.analogy).toContain("Google Doc");
    expect(result.relatedTerms).toEqual(["block", "hash"]);
  });

  it("returns French content for fr locale", () => {
    const result = getTooltip("blockchain", "fr");
    expect(result.definition).toContain("registre numerique");
  });

  it("throws 404 TERM_NOT_FOUND for nonexistent term", () => {
    expect(() => getTooltip("nonexistent", "en")).toThrow(
      expect.objectContaining({ statusCode: 404, code: "TERM_NOT_FOUND" }),
    );
  });

  it("falls back to English for unknown locale", () => {
    const result = getTooltip("blockchain", "xx");
    expect(result.term).toBe("Blockchain");
    expect(result.definition).toContain("shared digital record");
  });

  it("throws 500 CONTENT_UNAVAILABLE if no content at all", () => {
    setupMockContent([]);
    expect(() => getTooltip("blockchain", "en")).toThrow(
      expect.objectContaining({ statusCode: 500, code: "CONTENT_UNAVAILABLE" }),
    );
  });
});

describe("getGlossary", () => {
  it("returns all terms sorted alphabetically for English", () => {
    const result = getGlossary("en");
    expect(result.terms).toHaveLength(2);
    expect(result.terms[0].term).toBe("Blockchain");
    expect(result.terms[1].term).toBe("Hash");
  });

  it("returns French glossary", () => {
    const result = getGlossary("fr");
    expect(result.terms).toHaveLength(1);
    expect(result.terms[0].definition).toContain("registre numerique");
  });

  it("falls back to English for unknown locale", () => {
    const result = getGlossary("xx");
    expect(result.terms).toHaveLength(2);
  });

  it("throws 500 CONTENT_UNAVAILABLE if no content at all", () => {
    setupMockContent([]);
    expect(() => getGlossary("en")).toThrow(
      expect.objectContaining({ statusCode: 500, code: "CONTENT_UNAVAILABLE" }),
    );
  });
});
