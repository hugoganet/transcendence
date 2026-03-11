import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  certificate: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  userProgress: {
    count: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

vi.mock("../utils/contentLoader.js", () => ({
  getContent: () => ({
    curriculum: [
      {
        id: "1",
        chapters: [
          { id: "1.1", missions: [{ id: "1.1.1" }, { id: "1.1.2" }] },
        ],
      },
      {
        id: "2",
        chapters: [
          { id: "2.1", missions: [{ id: "2.1.1" }] },
        ],
      },
    ],
  }),
}));

const {
  generateCertificateWithClient,
  getCertificate,
  getCertificateByShareToken,
  getShareableUrl,
} = await import("./certificateService.js");

beforeEach(() => {
  vi.clearAllMocks();
});

const mockCertRecord = {
  id: "cert-123",
  userId: "user-1",
  displayName: "Alice",
  completionDate: new Date("2026-03-01T00:00:00.000Z"),
  curriculumTitle: "Blockchain Fundamentals",
  shareToken: "abc-def-123",
  totalMissions: 3,
  totalCategories: 2,
  createdAt: new Date(),
};

describe("generateCertificateWithClient", () => {
  it("creates certificate with correct fields", async () => {
    const client = {
      certificate: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
      userProgress: { count: vi.fn().mockResolvedValue(3) },
    };

    client.certificate.create.mockResolvedValue(mockCertRecord);

    const result = await generateCertificateWithClient(client, "user-1", "Alice");

    expect(client.certificate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        displayName: "Alice",
        curriculumTitle: "Blockchain Fundamentals",
        totalMissions: 3,
        totalCategories: 2,
      }),
    });
    expect(result.id).toBe("cert-123");
    expect(result.displayName).toBe("Alice");
    expect(result.completionDate).toBe("2026-03-01T00:00:00.000Z");
    expect(result.shareToken).toBe("abc-def-123");
  });

  it("is idempotent — returns existing cert if already exists", async () => {
    const client = {
      certificate: { findUnique: vi.fn().mockResolvedValue(mockCertRecord), create: vi.fn() },
      userProgress: { count: vi.fn() },
    };

    const result = await generateCertificateWithClient(client, "user-1", "Alice");

    expect(client.certificate.create).not.toHaveBeenCalled();
    expect(result.id).toBe("cert-123");
    expect(result.shareToken).toBe("abc-def-123");
  });

  it("throws if user hasn't completed all missions", async () => {
    const client = {
      certificate: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
      userProgress: { count: vi.fn().mockResolvedValue(2) }, // 2 of 3
    };

    await expect(
      generateCertificateWithClient(client, "user-1", "Alice"),
    ).rejects.toMatchObject({
      statusCode: 500,
      code: "CERTIFICATE_GENERATION_FAILED",
    });
  });

  it("includes correct displayName, totalMissions, totalCategories", async () => {
    const client = {
      certificate: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
      userProgress: { count: vi.fn().mockResolvedValue(3) },
    };

    client.certificate.create.mockResolvedValue({
      ...mockCertRecord,
      displayName: null,
    });

    const result = await generateCertificateWithClient(client, "user-1", null);

    expect(result.displayName).toBeNull();
    expect(result.totalMissions).toBe(3);
    expect(result.totalCategories).toBe(2);
  });

  it("generates a valid UUID share token", async () => {
    const client = {
      certificate: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
      userProgress: { count: vi.fn().mockResolvedValue(3) },
    };

    client.certificate.create.mockImplementation(({ data }: { data: { shareToken: string } }) =>
      Promise.resolve({ ...mockCertRecord, shareToken: data.shareToken }),
    );

    const result = await generateCertificateWithClient(client, "user-1", "Alice");

    // UUID v4 format
    expect(result.shareToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

describe("getCertificate", () => {
  it("returns certificate for valid user", async () => {
    mockPrisma.certificate.findUnique.mockResolvedValue(mockCertRecord);

    const result = await getCertificate("user-1");

    expect(result.id).toBe("cert-123");
    expect(result.completionDate).toBe("2026-03-01T00:00:00.000Z");
  });

  it("throws CERTIFICATE_NOT_AVAILABLE for user without cert", async () => {
    mockPrisma.certificate.findUnique.mockResolvedValue(null);

    await expect(getCertificate("user-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "CERTIFICATE_NOT_AVAILABLE",
    });
  });
});

describe("getCertificateByShareToken", () => {
  it("returns public cert (no internal id)", async () => {
    mockPrisma.certificate.findUnique.mockResolvedValue(mockCertRecord);

    const result = await getCertificateByShareToken("abc-def-123");

    expect(result).not.toHaveProperty("id");
    expect(result.displayName).toBe("Alice");
    expect(result.shareToken).toBe("abc-def-123");
  });

  it("throws CERTIFICATE_NOT_FOUND for invalid token", async () => {
    mockPrisma.certificate.findUnique.mockResolvedValue(null);

    await expect(
      getCertificateByShareToken("invalid-token"),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "CERTIFICATE_NOT_FOUND",
    });
  });
});

describe("getShareableUrl", () => {
  it("returns correct URL format with shareToken", async () => {
    const originalBaseUrl = process.env.BASE_URL;
    delete process.env.BASE_URL;
    mockPrisma.certificate.findUnique.mockResolvedValue(mockCertRecord);

    const result = await getShareableUrl("user-1");

    expect(result.shareUrl).toBe("https://localhost/certificates/abc-def-123");
    if (originalBaseUrl === undefined) {
      delete process.env.BASE_URL;
    } else {
      process.env.BASE_URL = originalBaseUrl;
    }
  });

  it("throws CERTIFICATE_NOT_AVAILABLE if no cert exists", async () => {
    mockPrisma.certificate.findUnique.mockResolvedValue(null);

    await expect(getShareableUrl("user-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "CERTIFICATE_NOT_AVAILABLE",
    });
  });
});
