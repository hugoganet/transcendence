import { describe, it, expect } from "vitest";
import { missionIdParamSchema, missionStatusSchema, chapterStatusSchema, categoryStatusSchema, completeMissionBodySchema } from "./progress.js";

describe("missionIdParamSchema", () => {
  it("validates '1.1.1'", () => {
    expect(missionIdParamSchema.parse({ missionId: "1.1.1" })).toEqual({
      missionId: "1.1.1",
    });
  });

  it("validates '6.3.4'", () => {
    expect(missionIdParamSchema.parse({ missionId: "6.3.4" })).toEqual({
      missionId: "6.3.4",
    });
  });

  it("rejects 'abc'", () => {
    expect(() =>
      missionIdParamSchema.parse({ missionId: "abc" }),
    ).toThrow();
  });

  it("rejects '1.1' (too few segments)", () => {
    expect(() =>
      missionIdParamSchema.parse({ missionId: "1.1" }),
    ).toThrow();
  });

  it("rejects '1.1.1.1' (too many segments)", () => {
    expect(() =>
      missionIdParamSchema.parse({ missionId: "1.1.1.1" }),
    ).toThrow();
  });

  it("rejects empty string", () => {
    expect(() =>
      missionIdParamSchema.parse({ missionId: "" }),
    ).toThrow();
  });
});

describe("missionStatusSchema", () => {
  it("accepts valid statuses", () => {
    expect(missionStatusSchema.parse("locked")).toBe("locked");
    expect(missionStatusSchema.parse("available")).toBe("available");
    expect(missionStatusSchema.parse("inProgress")).toBe("inProgress");
    expect(missionStatusSchema.parse("completed")).toBe("completed");
  });

  it("rejects invalid status", () => {
    expect(() => missionStatusSchema.parse("invalid")).toThrow();
  });
});

describe("chapterStatusSchema", () => {
  it("accepts valid statuses", () => {
    expect(chapterStatusSchema.parse("locked")).toBe("locked");
    expect(chapterStatusSchema.parse("available")).toBe("available");
    expect(chapterStatusSchema.parse("inProgress")).toBe("inProgress");
    expect(chapterStatusSchema.parse("completed")).toBe("completed");
  });

  it("rejects invalid status", () => {
    expect(() => chapterStatusSchema.parse("LOCKED")).toThrow();
  });
});

describe("categoryStatusSchema", () => {
  it("accepts valid statuses", () => {
    expect(categoryStatusSchema.parse("locked")).toBe("locked");
    expect(categoryStatusSchema.parse("completed")).toBe("completed");
  });

  it("rejects invalid status", () => {
    expect(() => categoryStatusSchema.parse("unknown")).toThrow();
  });
});

describe("completeMissionBodySchema", () => {
  it("validates { confidenceRating: 4 }", () => {
    expect(
      completeMissionBodySchema.parse({ confidenceRating: 4 }),
    ).toEqual({ confidenceRating: 4 });
  });

  it("accepts empty object (confidenceRating is optional)", () => {
    expect(completeMissionBodySchema.parse({})).toEqual({});
  });

  it("rejects confidenceRating: 0 (min is 1)", () => {
    expect(() =>
      completeMissionBodySchema.parse({ confidenceRating: 0 }),
    ).toThrow();
  });

  it("rejects confidenceRating: 6 (max is 5)", () => {
    expect(() =>
      completeMissionBodySchema.parse({ confidenceRating: 6 }),
    ).toThrow();
  });

  it("rejects confidenceRating: 2.5 (must be integer)", () => {
    expect(() =>
      completeMissionBodySchema.parse({ confidenceRating: 2.5 }),
    ).toThrow();
  });
});
