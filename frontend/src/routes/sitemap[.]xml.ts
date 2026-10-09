import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listProducts } from "@/domain/catalog/repository";
import { absoluteUrl } from "@/lib/site";
import { listCapabilities } from "@/domain/capabilities/repository";

type SitemapEntry = { readonly path: string };

const STATIC_ENTRIES: readonly SitemapEntry[] = [
  { path: "/" },
  { path: "/agents" },
  { path: "/shop" },
  { path: "/problems" },
  { path: "/knowledge" },
  { path: "/capabilities" },
  { path: "/coding-bugs" },
];

const MACHINE_ENTRIES: readonly SitemapEntry[] = [
  { path: "/catalog.json" },
  { path: "/agents.txt" },
  { path: "/llms.txt" },
  { path: "/capabilities.json" },
  { path: "/coding-bugs.json" },
];

function buildEntries(): readonly SitemapEntry[] {
  const products = listProducts();
  return [
    ...STATIC_ENTRIES,
    ...products.map((product) => ({ path: `/products/${product.slug}` })),
    ...listCapabilities().map((capability) => ({ path: `/capabilities/${capability.id}` })),
    ...MACHINE_ENTRIES,
    ...products.map((product) => ({ path: `/raw/products/${product.slug}.md` })),
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
          ...buildEntries().map(renderEntry),
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
