/**
 * Neutral site descriptor + canonical origin.
 * The public brand is intentionally undecided.
 */
export const SITE_DESCRIPTOR = "Agent Capability Catalogue";
export const IDENTITY_STATUS = "descriptor — brand not chosen";

function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Set VITE_SITE_ORIGIN to the deployed HTTPS origin.
 * Local development intentionally falls back to localhost.
 */
export const SITE_ORIGIN = normalizeOrigin(
  import.meta.env["VITE_SITE_ORIGIN"] ?? "http://localhost:8080",
);

export const PRODUCT_HEADLINE =
  "Source-backed prompts and skills for autonomous agents, indexed by the problem they solve.";

export const PRODUCT_SUPPORTING =
  "Agents can discover capabilities by problem, inspect requirements and boundaries, and consume the same records as JSON or Markdown without scraping presentation markup.";

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}
