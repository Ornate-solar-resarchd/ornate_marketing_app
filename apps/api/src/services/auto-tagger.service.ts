/**
 * Auto-tagging via the local Qwen3-14B-MLX-4bit model running on the Mac
 * Mini at host port 8080. mlx_lm.server exposes an OpenAI-compatible
 * /v1/chat/completions endpoint.
 *
 * Free, runs on-device, never calls out to a paid API.
 *
 * Strategy: each Document is tagged using its filename + company label +
 * category + docType. No PDF text extraction needed — the filename + context
 * is usually enough for an LLM to produce useful tags. We can layer PDF text
 * extraction on later if tags get thin.
 */
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

// From the host, the model lives at localhost:8080.
// From inside this container, Docker Desktop's host alias is host.docker.internal.
const MODEL_URL =
  process.env.AUTO_TAGGER_URL ||
  "http://host.docker.internal:8080/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert taxonomy bot for an Indian solar / battery / inverter / panel marketing-collateral library.

Given a single document's metadata (filename, doc-type, company, category), output 3–6 short tags that describe what the document is about.

Rules:
- Each tag is 1-3 lowercase words.
- No sentences, no punctuation other than spaces, no quotes inside tags.
- Tag concepts useful for search: product family, manufacturer, document kind,
  technology (mono perc, topcon, hybrid inverter, lifepo4, etc.), region, language
  when mentioned. Skip generic words like "document" or "file".
- Output ONLY a JSON array of strings. No commentary, no preamble, no markdown fences.`;

interface ChatChoice {
  message: { content?: string; reasoning?: string };
  finish_reason: string;
}
interface ChatResponse {
  choices: ChatChoice[];
}

/**
 * Call the model and return the parsed tag list, or [] on any failure.
 * Never throws — logged and swallowed so it can't break the upload path.
 */
async function callModel(userPrompt: string): Promise<string[]> {
  const body = {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      // /no_think disables Qwen3's chain-of-thought so the answer fits in
      // a small max_tokens budget.
      { role: "user", content: "/no_think\n" + userPrompt },
    ],
    max_tokens: 160,
    temperature: 0,
  };

  let raw: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      logger.warn(`auto-tagger HTTP ${res.status}: ${await res.text()}`);
      return [];
    }
    const data = (await res.json()) as ChatResponse;
    raw = data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    logger.warn("auto-tagger network/timeout:", err);
    return [];
  }
  if (!raw) return [];

  // Find the first JSON array in the response (model usually returns clean JSON,
  // but Qwen sometimes wraps in ```json ... ``` or adds a stray newline).
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];

  const tags = arr
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.toLowerCase().replace(/\s+/g, " ").trim())
    .filter((t) => t.length >= 2 && t.length <= 40)
    .slice(0, 8);
  // Dedupe, preserve order.
  return Array.from(new Set(tags));
}

/**
 * Tag a single document and write the result to the DB. Won't throw.
 */
export async function autoTagDocument(documentId: string): Promise<void> {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { company: { include: { category: true } } },
    });
    if (!doc) {
      logger.warn(`auto-tagger: doc ${documentId} not found`);
      return;
    }

    const prompt =
      `FILENAME: ${doc.name}\n` +
      `ORIGINAL FILENAME: ${doc.originalName}\n` +
      `MIME: ${doc.mimeType}\n` +
      `DOC TYPE: ${doc.docType}\n` +
      `COMPANY: ${doc.company.label}\n` +
      `CATEGORY: ${doc.company.category?.label ?? "-"}\n`;

    const tags = await callModel(prompt);
    if (tags.length === 0) {
      logger.info(`auto-tagger: no tags produced for doc ${documentId}`);
      return;
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { tags },
    });
    logger.info(`auto-tagger: ${documentId} tagged → ${JSON.stringify(tags)}`);
  } catch (err) {
    logger.warn(`auto-tagger: unexpected failure for ${documentId}:`, err);
  }
}

/**
 * Fire-and-forget wrapper for use in request handlers. Returns immediately.
 */
export function autoTagInBackground(documentId: string): void {
  // setImmediate keeps it off the event loop tick so the upload response is
  // returned first. Errors are caught inside autoTagDocument.
  setImmediate(() => {
    autoTagDocument(documentId).catch((err) =>
      logger.warn("auto-tagger fire-and-forget caught:", err),
    );
  });
}

/**
 * Backfill helper — tags every document whose `tags` array is empty.
 * Used by the admin /tags/backfill route.
 */
export async function backfillUntagged(limit = 50): Promise<{
  processed: number;
  tagged: number;
}> {
  const docs = await prisma.document.findMany({
    where: { tags: { isEmpty: true } },
    select: { id: true },
    take: limit,
  });
  let tagged = 0;
  for (const d of docs) {
    const before = Date.now();
    await autoTagDocument(d.id);
    const after = await prisma.document.findUnique({
      where: { id: d.id },
      select: { tags: true },
    });
    if (after && after.tags.length > 0) tagged++;
    // small jitter so we don't slam the model
    const elapsed = Date.now() - before;
    if (elapsed < 200) await new Promise((r) => setTimeout(r, 200 - elapsed));
  }
  return { processed: docs.length, tagged };
}
