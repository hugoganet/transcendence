import { describe, it, expect } from "vitest";
import {
  friendUserIdParamSchema,
  friendListEntrySchema,
  friendRequestEntrySchema,
  friendshipResponseSchema,
} from "./friend.js";

describe("friendUserIdParamSchema", () => {
  it("accepts valid UUID", () => {
    const data = { userId: "550e8400-e29b-41d4-a716-446655440000" };
    expect(friendUserIdParamSchema.parse(data)).toEqual(data);
  });

  it("rejects non-UUID string", () => {
    expect(() => friendUserIdParamSchema.parse({ userId: "not-a-uuid" })).toThrow();
  });

  it("rejects missing userId", () => {
    expect(() => friendUserIdParamSchema.parse({})).toThrow();
  });
});

describe("friendListEntrySchema", () => {
  it("accepts valid friend list entry", () => {
    const data = {
      id: "user-1",
      displayName: "Alice",
      avatarUrl: "https://example.com/avatar.png",
      online: true,
    };
    expect(friendListEntrySchema.parse(data)).toEqual(data);
  });

  it("accepts null displayName and avatarUrl", () => {
    const data = { id: "user-1", displayName: null, avatarUrl: null, online: false };
    expect(friendListEntrySchema.parse(data)).toEqual(data);
  });

  it("rejects missing online field", () => {
    expect(() =>
      friendListEntrySchema.parse({ id: "user-1", displayName: "A", avatarUrl: null }),
    ).toThrow();
  });
});

describe("friendRequestEntrySchema", () => {
  it("accepts valid friend request entry", () => {
    const data = {
      id: "user-1",
      displayName: "Bob",
      avatarUrl: null,
      createdAt: "2026-03-10T14:30:00.000Z",
    };
    expect(friendRequestEntrySchema.parse(data)).toEqual(data);
  });

  it("rejects missing createdAt", () => {
    expect(() =>
      friendRequestEntrySchema.parse({ id: "user-1", displayName: "B", avatarUrl: null }),
    ).toThrow();
  });
});

describe("friendshipResponseSchema", () => {
  it("accepts valid PENDING friendship", () => {
    const data = {
      id: "fr-1",
      requesterId: "user-a",
      addresseeId: "user-b",
      status: "PENDING",
      createdAt: "2026-03-10T14:30:00.000Z",
      updatedAt: "2026-03-10T14:30:00.000Z",
    };
    expect(friendshipResponseSchema.parse(data)).toEqual(data);
  });

  it("accepts valid ACCEPTED friendship", () => {
    const data = {
      id: "fr-1",
      requesterId: "user-a",
      addresseeId: "user-b",
      status: "ACCEPTED",
      createdAt: "2026-03-10T14:30:00.000Z",
      updatedAt: "2026-03-10T14:31:00.000Z",
    };
    expect(friendshipResponseSchema.parse(data)).toEqual(data);
  });

  it("rejects invalid status", () => {
    expect(() =>
      friendshipResponseSchema.parse({
        id: "fr-1",
        requesterId: "user-a",
        addresseeId: "user-b",
        status: "REJECTED",
        createdAt: "2026-03-10T14:30:00.000Z",
        updatedAt: "2026-03-10T14:30:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => friendshipResponseSchema.parse({ id: "fr-1" })).toThrow();
  });
});
