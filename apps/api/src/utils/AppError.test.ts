import { describe, it, expect } from "vitest";
import { AppError } from "./AppError.js";

describe("AppError", () => {
  it("creates an error with all properties", () => {
    const error = new AppError(422, "VALIDATION_ERROR", "Invalid data", {
      email: "required",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid data");
    expect(error.details).toEqual({ email: "required" });
    expect(error.name).toBe("AppError");
  });

  it("creates an error without details", () => {
    const error = new AppError(500, "INTERNAL_ERROR", "Something broke");
    expect(error.details).toBeUndefined();
  });

  describe("factory methods", () => {
    it("badRequest() returns 400 with BAD_REQUEST code", () => {
      const error = AppError.badRequest("Invalid input", { field: "name" });
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.message).toBe("Invalid input");
      expect(error.details).toEqual({ field: "name" });
    });

    it("badRequest() uses default message", () => {
      const error = AppError.badRequest();
      expect(error.message).toBe("Bad request");
    });

    it("unauthorized() returns 401 with UNAUTHORIZED code", () => {
      const error = AppError.unauthorized();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Unauthorized");
    });

    it("unauthorized() accepts custom message", () => {
      const error = AppError.unauthorized("Token expired");
      expect(error.message).toBe("Token expired");
    });

    it("forbidden() returns 403 with FORBIDDEN code", () => {
      const error = AppError.forbidden();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Forbidden");
    });

    it("notFound() returns 404 with NOT_FOUND code", () => {
      const error = AppError.notFound("User not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("User not found");
    });

    it("internal() returns 500 with INTERNAL_ERROR code", () => {
      const error = AppError.internal();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.message).toBe("Internal server error");
    });
  });
});
