import { createFileRoute } from "@tanstack/react-router";
import { getProductBySlug } from "@/domain/catalog/repository";
import { buildProductMarkdown } from "@/lib/machine-readable/product-markdown";

const MARKDOWN_SUFFIX = ".md";

/**
 * /raw/products/{slug}.md — a splat route, because the `.md` extension is not a
 * valid dynamic-segment param name.
 */
export const Route = createFileRoute("/raw/products/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const requested = params._splat ?? "";
        const product = requested.endsWith(MARKDOWN_SUFFIX)
          ? getProductBySlug(requested.slice(0, -MARKDOWN_SUFFIX.length))
          : undefined;

        if (!product) {
          return new Response("Not found\n", {
            status: 404,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }

        return new Response(buildProductMarkdown(product), {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});