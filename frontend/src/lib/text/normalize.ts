/**
 * Deterministic text normalization shared by search and label rendering.
 * Kept dependency-free so the future CLI can reuse identical semantics.
 */

const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(NON_ALPHANUMERIC, " ").trim();
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized.length === 0 ? [] : normalized.split(" ");
}

/** Turns a kebab-case catalogue key into a readable label. No copy is invented. */
export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}