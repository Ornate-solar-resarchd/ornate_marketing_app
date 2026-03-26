import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../lib/logger";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface AutoTagResult {
  tags: string[];
  description: string;
  suggestedName: string;
}

const SYSTEM_PROMPT = `You are a document classifier for Ornate Solar, a solar energy company in India.
Analyze the uploaded file and return a JSON object with:
- "tags": array of 3-8 relevant lowercase tags (e.g. "solar panel", "datasheet", "400w", "monocrystalline", "rooftop", "commercial", "residential", "inverter", "bess", "carport")
- "description": one sentence describing the document content
- "suggestedName": a clean, descriptive name for this file (no file extension)

Focus on: product names, specifications, document type, target audience, technology type, capacity/wattage, brand names.
Return ONLY valid JSON, no markdown or explanation.`;

export async function autoTagFile(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<AutoTagResult | null> {
  // Skip if no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.warn("ANTHROPIC_API_KEY not set, skipping auto-tagging");
    return null;
  }

  // Only process images and PDFs
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  if (!isImage && !isPdf) {
    // For non-visual files, generate tags from filename
    return tagFromFilename(originalName);
  }

  try {
    const base64 = buffer.toString("base64");

    let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
    if (mimeType === "image/png") mediaType = "image/png";
    else if (mimeType === "image/gif") mediaType = "image/gif";
    else if (mimeType === "image/webp") mediaType = "image/webp";

    // For PDFs, we send as document
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = isPdf
      ? [
          {
            type: "document" as const,
            source: { type: "base64" as const, media_type: "application/pdf", data: base64 },
          },
          { type: "text" as const, text: `Filename: ${originalName}\nAnalyze this document and return tags, description, and suggested name as JSON.` },
        ]
      : [
          {
            type: "image" as const,
            source: { type: "base64" as const, media_type: mediaType, data: base64 },
          },
          { type: "text" as const, text: `Filename: ${originalName}\nAnalyze this image and return tags, description, and suggested name as JSON.` },
        ];

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn("AI tagger returned non-JSON response");
      return tagFromFilename(originalName);
    }

    const parsed = JSON.parse(jsonMatch[0]) as AutoTagResult;

    // Validate and sanitize
    return {
      tags: (parsed.tags || [])
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.toLowerCase().trim())
        .slice(0, 8),
      description: typeof parsed.description === "string" ? parsed.description.slice(0, 200) : "",
      suggestedName: typeof parsed.suggestedName === "string" ? parsed.suggestedName.slice(0, 100) : originalName.replace(/\.[^/.]+$/, ""),
    };
  } catch (error) {
    logger.error("AI tagger error:", error);
    return tagFromFilename(originalName);
  }
}

// Fallback: generate basic tags from filename
function tagFromFilename(filename: string): AutoTagResult {
  const name = filename.replace(/\.[^/.]+$/, "");
  const words = name
    .replace(/[-_]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.toLowerCase());

  return {
    tags: [...new Set(words)].slice(0, 5),
    description: "",
    suggestedName: name,
  };
}
