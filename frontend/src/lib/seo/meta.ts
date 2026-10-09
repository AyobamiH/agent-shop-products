import { absoluteUrl } from "@/lib/site";

export type MetaTag = { title?: string; name?: string; property?: string; content?: string };
export type LinkTag = { rel: string; href: string; type?: string; title?: string };

export const INDEXABLE_ROBOTS = "index, follow, max-snippet:-1, max-image-preview:large";
export const REFERENCE_ONLY_ROBOTS = "noindex, follow";

export function buildMeta({
  title,
  description,
  path,
  indexable = true,
}: {
  title: string;
  description: string;
  path?: string;
  indexable?: boolean;
}): MetaTag[] {
  const meta: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: indexable ? INDEXABLE_ROBOTS : REFERENCE_ONLY_ROBOTS },
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
  links = [],
  indexable = true,
}: {
  title: string;
  description: string;
  path: string;
  jsonLd?: readonly Record<string, unknown>[];
  links?: readonly LinkTag[];
  indexable?: boolean;
}) {
  return {
    meta: buildMeta({ title, description, path, indexable }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...links] as LinkTag[],
    scripts: jsonLd.map((node) => ({
      type: "application/ld+json",
      children: JSON.stringify(node),
    })),
  };
}

export function toMetaDescription(value: string, maxLength = 155): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;

  const slice = compact.slice(0, maxLength + 1);
  const boundary = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("; "),
    slice.lastIndexOf(", "),
    slice.lastIndexOf(" "),
  );
  const trimmed = (
    boundary >= Math.floor(maxLength * 0.65)
      ? slice.slice(0, boundary)
      : compact.slice(0, maxLength)
  ).trim();
  return trimmed.replace(/[\s,;:.!?-]+$/g, "") + "…";
}
