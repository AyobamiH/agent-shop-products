/**
 * Route head helper. Every indexable route supplies its own title, description
 * and path; canonical + og:url derive from the single SITE_ORIGIN contract.
 */

import { absoluteUrl } from "@/lib/site";

export type MetaTag = { title?: string; name?: string; property?: string; content?: string };
export type LinkTag = { rel: string; href: string; type?: string; title?: string };

/** Robots directive for every public route: full indexability. */
export const INDEXABLE_ROBOTS = "index, follow, max-snippet:-1, max-image-preview:large";

export function buildMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path?: string;
}): MetaTag[] {
  const meta: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: INDEXABLE_ROBOTS },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (path) meta.push({ property: "og:url", content: absoluteUrl(path) });
  return meta;
}

export function buildPageHead({
  title,
  description,
  path,
  jsonLd = [],
}: {
  title: string;
  description: string;
  path: string;
  jsonLd?: readonly Record<string, unknown>[];
}) {
  return {
    meta: buildMeta({ title, description, path }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }] as LinkTag[],
    scripts: jsonLd.map((node) => ({
      type: "application/ld+json",
      children: JSON.stringify(node),
    })),
  };
}