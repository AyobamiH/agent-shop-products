/**
 * Site identity and canonical origin.
 *
 * SITE_DESCRIPTOR is a neutral descriptive working label, NOT a brand. The
 * owner has not chosen a final brand; do not introduce one here (DEC-010).
 *
 * SITE_ORIGIN is the single canonical-origin contract: canonical links,
 * og:url, JSON-LD ids, sitemap.xml, robots.txt Sitemap line and the machine
 * surfaces all derive absolute URLs from it. Change the domain here only.
 */

export const SITE_DESCRIPTOR = "Agent Capability Catalogue";

export const IDENTITY_STATUS = "descriptor — brand not chosen";

export const SITE_ORIGIN = "https://evidence-shop-for-agents.lovable.app";

export const PRODUCT_HEADLINE =
  "Source-backed prompts and skills for autonomous agents, indexed by the problem they solve.";

export const PRODUCT_SUPPORTING =
  "Each record states its problem, outcomes, requirements and boundaries. Discover capabilities by problem or category, or read the same records as JSON and Markdown without scraping this UI.";

/** Absolute canonical URL for a site path ("/" or "/products/x"). */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}