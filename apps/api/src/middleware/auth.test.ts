import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "./auth.js";

function createMockReq(authenticated: boolean): Request {
  return {
    isAuthenticated: vi.fn().mockReturnValue(authenticated),
  } as unknown as Request;
}

const mockRes = {} as Response;

describe("requireAuth middleware", () => {
  it("calls next() when user is authenticated", () => {
    const req = createMockReq(true);
    const next = vi.fn() as NextFunction;

    requireAuth(req, mockRes, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("calls next with 401 AppError when user is not authenticated", () => {
    const req = createMockReq(false);
    const next = vi.fn() as NextFunction;

    requireAuth(req, mockRes, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: "UNAUTHORIZED",
      }),
    );
  });
});
