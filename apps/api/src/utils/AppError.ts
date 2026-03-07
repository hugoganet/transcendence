export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(
    message = "Bad request",
    details?: Record<string, string>,
  ): AppError {
    return new AppError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Not found"): AppError {
    return new AppError(404, "NOT_FOUND", message);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError(500, "INTERNAL_ERROR", message);
  }
}
