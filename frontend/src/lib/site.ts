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
const configuredOrigin = import.meta.env["VITE_SITE_ORIGIN"];
if (import.meta.env.PROD && (!configuredOrigin ||
    !/^https:\/\/[a-z0-9.-]+(?::443)?$/i.test(configuredOrigin))) {
  throw new Error("Production SITE_ORIGIN must be an explicitly configured HTTPS origin");
}
export const SITE_ORIGIN = normalizeOrigin(configuredOrigin ?? "http://localhost:8080");

export const PRODUCT_HEADLINE =
  "Source-backed prompts and skills for autonomous agents, indexed by the problem they solve.";

export const PRODUCT_SUPPORTING =
  "Agents can discover capabilities by problem, inspect requirements and boundaries, and consume the same records as JSON or Markdown without scraping presentation markup.";

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}
