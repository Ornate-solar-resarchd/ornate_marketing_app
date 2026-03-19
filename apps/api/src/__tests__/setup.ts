import { vi } from "vitest";

// Mock Prisma
vi.mock("../lib/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    company: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock S3 service
vi.mock("../services/s3.service", () => ({
  generateS3Key: vi.fn(
    (companyId: string, docType: string, filename: string) =>
      `${companyId}/${docType}/mock-uuid-${filename}`
  ),
  uploadToS3: vi.fn().mockResolvedValue("https://s3.amazonaws.com/mock-url"),
  getSignedViewUrl: vi.fn().mockResolvedValue("https://s3.amazonaws.com/signed-mock-url"),
  deleteFromS3: vi.fn().mockResolvedValue(undefined),
}));

// Mock logger
vi.mock("../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid-1234"),
}));

// Mock Clerk
vi.mock("@clerk/backend", () => ({
  createClerkClient: vi.fn(() => ({
    authenticateRequest: vi.fn(),
    users: {
      getUser: vi.fn(),
      getUserList: vi.fn(),
      updateUser: vi.fn(),
    },
  })),
}));

// Set env vars for tests
process.env.NODE_ENV = "test";
process.env.CLERK_SECRET_KEY = "sk_test_mock";
process.env.CLERK_PUBLISHABLE_KEY = "pk_test_mock";
process.env.AWS_ACCESS_KEY_ID = "mock-key";
process.env.AWS_SECRET_ACCESS_KEY = "mock-secret";
process.env.AWS_REGION = "ap-south-1";
process.env.S3_BUCKET_NAME = "test-bucket";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
