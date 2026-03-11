import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";
import { AppError } from "../utils/AppError.js";

const mockGetCertificateByShareToken = vi.hoisted(() => vi.fn());

vi.mock("../services/certificateService.js", () => ({
  getCertificateByShareToken: mockGetCertificateByShareToken,
}));

const { certificatesRouter } = await import("./certificates.js");

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/certificates", certificatesRouter);
  app.use(errorHandler);
  return app;
}

describe("Certificates Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/certificates/:shareToken", () => {
    it("returns 200 with public certificate data", async () => {
      mockGetCertificateByShareToken.mockResolvedValue({
        displayName: "Alice",
        completionDate: "2026-03-01T00:00:00.000Z",
        curriculumTitle: "Blockchain Fundamentals",
        shareToken: "abc-def-123",
        totalMissions: 69,
        totalCategories: 6,
      });

      const app = createTestApp();
      const res = await request(app).get("/api/v1/certificates/abc-def-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        displayName: "Alice",
        curriculumTitle: "Blockchain Fundamentals",
        totalMissions: 69,
        totalCategories: 6,
      });
      expect(res.body.data).not.toHaveProperty("id");
      expect(mockGetCertificateByShareToken).toHaveBeenCalledWith("abc-def-123");
    });

    it("returns 404 for invalid share token", async () => {
      mockGetCertificateByShareToken.mockRejectedValue(
        new AppError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found"),
      );

      const app = createTestApp();
      const res = await request(app).get("/api/v1/certificates/invalid-token");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("CERTIFICATE_NOT_FOUND");
    });

    it("does not require authentication", async () => {
      mockGetCertificateByShareToken.mockResolvedValue({
        displayName: null,
        completionDate: "2026-03-01T00:00:00.000Z",
        curriculumTitle: "Blockchain Fundamentals",
        shareToken: "some-token",
        totalMissions: 69,
        totalCategories: 6,
      });

      const app = createTestApp();
      const res = await request(app).get("/api/v1/certificates/some-token");

      expect(res.status).toBe(200);
    });
  });
});
