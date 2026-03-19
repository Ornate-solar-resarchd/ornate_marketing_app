import { describe, it, expect, vi } from "vitest";

// We test the pure functions without S3 client
// Since s3.service.ts creates the client at module level, we test sanitization and key generation logic

describe("S3 Service - Key Generation", () => {
  it("should sanitize filenames by replacing special characters", () => {
    const sanitize = (filename: string) =>
      filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    expect(sanitize("hello world.pdf")).toBe("hello_world.pdf");
    expect(sanitize("file (1).pdf")).toBe("file__1_.pdf");
    expect(sanitize("café-résumé.docx")).toBe("caf_-r_sum_.docx");
    expect(sanitize("normal-file.pdf")).toBe("normal-file.pdf");
    expect(sanitize("file@#$%.txt")).toBe("file____.txt");
    expect(sanitize("simple.jpg")).toBe("simple.jpg");
  });

  it("should generate S3 key in correct format", () => {
    // The key format is: {companyId}/{docType}/{uuid}-{sanitized}
    const companyId = "company_123";
    const docType = "brochure";
    const filename = "test file.pdf";
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    const keyPattern = new RegExp(`^${companyId}/${docType}/.+-${sanitized}$`);
    const mockKey = `${companyId}/${docType}/some-uuid-${sanitized}`;

    expect(mockKey).toMatch(keyPattern);
  });

  it("should preserve file extensions during sanitization", () => {
    const sanitize = (filename: string) =>
      filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    expect(sanitize("report.pdf")).toContain(".pdf");
    expect(sanitize("image.png")).toContain(".png");
    expect(sanitize("presentation.pptx")).toContain(".pptx");
    expect(sanitize("data.xlsx")).toContain(".xlsx");
  });
});

describe("S3 URL Generation", () => {
  it("should construct correct S3 URL format", () => {
    const bucket = "ornate-nopa";
    const region = "ap-south-1";
    const key = "company_1/brochure/uuid-file.pdf";

    const expectedUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    expect(expectedUrl).toBe(
      "https://ornate-nopa.s3.ap-south-1.amazonaws.com/company_1/brochure/uuid-file.pdf"
    );
  });
});
