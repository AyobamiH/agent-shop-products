/**
 * Editorial curation config.
 *
 * The catalogue supplies no featured flag, ranking metric, sales figure or
 * rating, so featuring is an explicit, documented, source-backed id list kept
 * in exactly one place (docs/FRONTEND_BRIEF.md — Featured products).
 *
 * Rule: the ids below are real catalogue ids chosen to span distinct
 * categories. Unknown ids are ignored rather than rendered as placeholders.
 */

import { getProductById } from "./repository";
import type { Product } from "./types";

export const FEATURED_PRODUCT_IDS: readonly string[] = [
  "evidence-first-live-diagnostic-repair",
  "autonomous-coding-workflow",
  "read-only-production-reconnaissance",
  "signed-agent-action-receipts",
];

export function getFeaturedProducts(): readonly Product[] {
  return FEATURED_PRODUCT_IDS.map((id) => getProductById(id)).filter(
    (product): product is Product => product !== undefined,
  );
}