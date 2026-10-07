import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listProducts } from "@/domain/catalog/repository";
import { SITE_ORIGIN } from "@/lib/site";


const BASE_URL = SITE_ORIGIN;

type SitemapEntry = {
  readonly path: string;
  readonly changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  readonly priority?: string;
};

const STATIC_ENTRIES: readonly SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "weekly", priority: "0.9" },
  { path: "/problems", changefreq: "weekly", priority: "0.8" },
  { path: "/knowledge", changefreq: "weekly", priority: "0.8" },
  { path: "/agents", changefreq: "monthly", priority: "0.7" },
];

const MACHINE_ENTRIES: readonly SitemapEntry[] = [
  { path: "/catalog.json", changefreq: "weekly", priority: "0.5" },
  { path: "/llms.txt", changefreq: "weekly", priority: "0.5" },
];

function buildEntries(): readonly SitemapEntry[] {
  const products = listProducts();
  const detailPages = products.map<SitemapEntry>((product) => ({
    path: `/products/${product.slug}`,
    changefreq: "monthly",
    priority: "0.8",
  }));
  const rawPages = products.map<SitemapEntry>((product) => ({
    path: `/raw/products/${product.slug}.md`,
    changefreq: "monthly",
    priority: "0.4",
  }));

  return [...STATIC_ENTRIES, ...detailPages, ...MACHINE_ENTRIES, ...rawPages];
}

function renderEntry(entry: SitemapEntry): string {
  return [
    `  <url>`,
    `    <loc>${BASE_URL}${entry.path}</loc>`,
    entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
    entry.priority ? `    <priority>${entry.priority}</priority>` : null,
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...buildEntries().map(renderEntry),
          `</urlset>`,
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