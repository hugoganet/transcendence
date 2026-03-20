import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import { errorHandler } from "./errorHandler.js";
import { AppError } from "../utils/AppError.js";

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const mockReq = {} as Request;
const mockNext = vi.fn() as NextFunction;

describe("errorHandler", () => {
  it("handles AppError with all fields", () => {
    const err = new AppError(422, "VALIDATION_ERROR", "Bad data", {
      field: "email",
    });
    const res = createMockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "VALIDATION_ERROR",
        message: "Bad data",
        details: { field: "email" },
      },
    });
  });

  it("handles AppError without details", () => {
    const err = AppError.notFound("User not found");
    const res = createMockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "NOT_FOUND",
        message: "User not found",
      },
    });
  });

  it("handles ZodError with field-level details", () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    let zodError: ZodError;
    try {
      schema.parse({ email: "not-email", age: 5 });
    } catch (e) {
      zodError = e as ZodError;
    }

    const res = createMockRes();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    errorHandler(zodError!, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(body.error.message).toBe("Validation failed");
    expect(body.error.details).toHaveProperty("email");
    expect(body.error.details).toHaveProperty("age");
  });

  it("handles unknown errors with 500 and hides internals", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const err = new Error("database connection failed");
    const res = createMockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("handles non-Error objects", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const res = createMockRes();

    errorHandler("string error", mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    });
    consoleError.mockRestore();
  });
});
