export interface DocTypeMeta {
  label: string;
  icon: string;
}

/**
 * Display metadata for every docType key. Backend stores the key,
 * frontend resolves label + icon here. Keep in sync with CLAUDE.md §5.
 */
export const DOC_TYPES: Record<string, DocTypeMeta> = {
  brochure:     { label: "Brochure",            icon: "📖" },
  datasheet:    { label: "Datasheet",           icon: "📊" },
  images:       { label: "Images",              icon: "🖼️" },
  videos:       { label: "Videos",              icon: "🎬" },
  ppt:          { label: "PPT / Deck",          icon: "📽️" },
  email:        { label: "Email Template",      icon: "✉️" },
  compliance:   { label: "Compliance Docs",     icon: "🛡️" },
  casestudy:    { label: "Case Studies",        icon: "📋" },
  installation: { label: "Installation Guide", icon: "🔧" },
  warranty:     { label: "Warranty Docs",       icon: "📜" },
  pricing:      { label: "Pricing Sheets",      icon: "💰" },
  approval:     { label: "Type Approvals",      icon: "✅" },
  scheme:       { label: "Scheme Docs",         icon: "📜" },
  structural:   { label: "Structural Docs",     icon: "🔩" },
};

export function docTypeLabel(key: string): string {
  return DOC_TYPES[key]?.label ?? key;
}
