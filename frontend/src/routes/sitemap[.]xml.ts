import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listProducts } from "@/domain/catalog/repository";
import { absoluteUrl } from "@/lib/site";

type SitemapEntry = { readonly path: string };

const STATIC_ENTRIES: readonly SitemapEntry[] = [
  { path: "/" },
  { path: "/agents" },
  { path: "/shop" },
  { path: "/solutions" },
  { path: "/problems" },
  { path: "/knowledge" },
  { path: "/capabilities" },
  { path: "/coding-bugs" },
  { path: "/integration-services" },
];

/**
 * Search sitemap: indexable, owned HTML only. Machine consumers use /agents.txt,
 * /catalog.json and /capabilities.json; names-only third-party details remain
 * browsable but are not independently indexable products.
 */
export function indexableSitemapPaths(): readonly string[] {
  return [
    ...STATIC_ENTRIES.map((entry) => entry.path),
    ...listProducts().map((product) => "/products/" + product.slug),
  ];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEntry(entry: SitemapEntry): string {
  return ["  <url>", `    <loc>${escapeXml(absoluteUrl(entry.path))}</loc>`, "  </url>"].join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...indexableSitemapPaths().map((path) => renderEntry({ path })),
          "</urlset>",
        ].join("\n");
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
