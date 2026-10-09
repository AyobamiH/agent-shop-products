import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleCommerceRequest } from "./server/commerce/handler";
import type { CommerceEnv } from "./server/commerce/config";

// Nitro's Cloudflare adapter supplies the environment to the outer Worker and
// sets __env__ before dispatching its inner TanStack SSR service. That service
// does not receive env as fetch's second argument. Read the binding per request;
// never cache secrets, DB bindings or per-request state in module globals.
function resolveCommerceEnv(explicitEnv: unknown): CommerceEnv {
  if (explicitEnv && typeof explicitEnv === "object") return explicitEnv as CommerceEnv;
  const adapterEnv = (globalThis as typeof globalThis & { __env__?: unknown }).__env__;
  if (adapterEnv && typeof adapterEnv === "object") return adapterEnv as CommerceEnv;
  // Missing deployment bindings must mean no purchasable offers; checkout still
  // fails closed, not 503 for harmless GET-only catalogue inspection.
  return {};
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const commerce = await handleCommerceRequest(request, resolveCommerceEnv(env));
      if (commerce) return commerce;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
