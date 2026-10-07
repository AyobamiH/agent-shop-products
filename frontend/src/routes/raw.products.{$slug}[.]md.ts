import { createFileRoute } from "@tanstack/react-router";
import { getProductBySlug } from "@/domain/catalog/repository";
import { buildProductMarkdown } from "@/lib/machine-readable/product-markdown";

export const Route = createFileRoute("/raw/products/{$slug}.md")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const product = getProductBySlug(params.slug);

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
