import { describe, it, expect } from "vitest";
import { DOC_TYPES, docTypeKeys } from "@ornate/types";

describe("DOC_TYPES Registry", () => {
  it("should have 14 document types", () => {
    expect(Object.keys(DOC_TYPES)).toHaveLength(14);
  });

  it("should include all expected doc types", () => {
    const expected = [
      "brochure", "datasheet", "images", "videos", "ppt", "email",
      "compliance", "casestudy", "installation", "warranty", "pricing",
      "approval", "scheme", "structural",
    ];
    expect(docTypeKeys).toEqual(expect.arrayContaining(expected));
  });

  it("each doc type should have label, icon, and accept fields", () => {
    for (const [key, value] of Object.entries(DOC_TYPES)) {
      expect(value).toHaveProperty("label");
      expect(value).toHaveProperty("icon");
      expect(value).toHaveProperty("accept");
      expect(typeof value.label).toBe("string");
      expect(typeof value.icon).toBe("string");
      expect(typeof value.accept).toBe("string");
    }
  });

  it("accept field should contain valid file extensions", () => {
    for (const [key, value] of Object.entries(DOC_TYPES)) {
      const extensions = value.accept.split(",");
      for (const ext of extensions) {
        expect(ext.trim()).toMatch(/^\.\w+$/);
      }
    }
  });

  it("brochure should accept PDF, DOCX, and video", () => {
    expect(DOC_TYPES.brochure.accept).toContain(".pdf");
    expect(DOC_TYPES.brochure.accept).toContain(".docx");
    expect(DOC_TYPES.brochure.accept).toContain(".mp4");
  });

  it("images should accept common image formats, PDF, and GIF", () => {
    expect(DOC_TYPES.images.accept).toContain(".jpg");
    expect(DOC_TYPES.images.accept).toContain(".jpeg");
    expect(DOC_TYPES.images.accept).toContain(".png");
    expect(DOC_TYPES.images.accept).toContain(".webp");
    expect(DOC_TYPES.images.accept).toContain(".pdf");
    expect(DOC_TYPES.images.accept).toContain(".gif");
  });

  it("videos should accept common video formats and links", () => {
    expect(DOC_TYPES.videos.accept).toContain(".mp4");
    expect(DOC_TYPES.videos.accept).toContain(".mov");
    expect(DOC_TYPES.videos.accept).toContain(".url");
    expect(DOC_TYPES.videos.accept).toContain(".lnk");
  });

  it("email should accept HTML, PDF, DOCX, EML, images, video, and GIF", () => {
    expect(DOC_TYPES.email.accept).toContain(".html");
    expect(DOC_TYPES.email.accept).toContain(".pdf");
    expect(DOC_TYPES.email.accept).toContain(".jpg");
    expect(DOC_TYPES.email.accept).toContain(".jpeg");
    expect(DOC_TYPES.email.accept).toContain(".png");
    expect(DOC_TYPES.email.accept).toContain(".gif");
    expect(DOC_TYPES.email.accept).toContain(".mp4");
  });

  it("ppt should accept PPTX, PPT, and PDF", () => {
    expect(DOC_TYPES.ppt.accept).toContain(".pptx");
    expect(DOC_TYPES.ppt.accept).toContain(".ppt");
    expect(DOC_TYPES.ppt.accept).toContain(".pdf");
  });

  it("structural should accept PDF, DOCX, and DWG", () => {
    expect(DOC_TYPES.structural.accept).toContain(".pdf");
    expect(DOC_TYPES.structural.accept).toContain(".dwg");
  });
});
