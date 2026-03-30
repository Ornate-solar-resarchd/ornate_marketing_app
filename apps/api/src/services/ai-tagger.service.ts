interface AutoTagResult {
  tags: string[];
  description: string;
  suggestedName: string;
}

// Solar industry keyword mapping for smarter filename-based tagging
const KEYWORD_TAGS: Record<string, string[]> = {
  bess: ["bess", "battery", "energy storage"],
  unity: ["unityess", "energy storage"],
  inroof: ["inroof", "rooftop"],
  kusum: ["kusum", "pm kusum", "government scheme"],
  carport: ["solar carport", "parking"],
  agripv: ["agripv", "agriculture"],
  ojas: ["ojas", "mounting structure"],
  assured: ["ornate assured", "warranty"],
  solar: ["solar"],
  panel: ["solar panel", "module"],
  inverter: ["inverter"],
  datasheet: ["datasheet", "technical"],
  brochure: ["brochure", "marketing"],
  compliance: ["compliance", "certification"],
  installation: ["installation", "guide"],
  warranty: ["warranty"],
  pricing: ["pricing"],
  ppt: ["presentation"],
  carousel: ["social media", "carousel"],
  hopewind: ["hopewind", "inverter"],
  solaredge: ["solaredge", "inverter"],
  enphase: ["enphase", "microinverter"],
  fronius: ["fronius", "inverter"],
  havells: ["havells"],
  firstsolar: ["first solar", "thin film"],
  renewsys: ["renewsys", "panel"],
  canadian: ["canadian solar", "panel"],
};

export async function autoTagFile(
  _buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<AutoTagResult | null> {
  return tagFromFilename(originalName, mimeType);
}

function tagFromFilename(filename: string, mimeType?: string): AutoTagResult {
  const name = filename.replace(/\.[^/.]+$/, "");
  const nameLower = name.toLowerCase();

  // Extract words from filename
  const words = name
    .replace(/[-_]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.toLowerCase());

  const tags = new Set<string>();

  // Add keyword-matched tags
  for (const [keyword, keywordTags] of Object.entries(KEYWORD_TAGS)) {
    if (nameLower.includes(keyword)) {
      keywordTags.forEach((t) => tags.add(t));
    }
  }

  // Add file type tag
  if (mimeType) {
    if (mimeType.startsWith("image/")) tags.add("image");
    else if (mimeType.startsWith("video/")) tags.add("video");
    else if (mimeType === "application/pdf") tags.add("pdf");
    else if (mimeType.includes("presentation") || mimeType.includes("ppt")) tags.add("presentation");
    else if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) tags.add("spreadsheet");
  }

  // Add remaining words as tags
  words.forEach((w) => tags.add(w));

  return {
    tags: [...tags].slice(0, 8),
    description: "",
    suggestedName: name,
  };
}
