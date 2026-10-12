import { CommerceFailure, publicOffers } from "./config";
import type { CommerceEnv } from "./config";
import { methodNotAllowed, reply } from "./shared";
import { checkout } from "./checkout";
import { orderStatus, download } from "./delivery";
import { purchaseRecord } from "./contracts";
import { webhook } from "./webhook";

const PREFIX = "/api/v1/commerce/";

export async function handleCommerceRequest(
  request: Request, env: CommerceEnv,
  fetcher: typeof fetch = fetch,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith(PREFIX)) return null;
  const requestId = crypto.randomUUID();
  try {
    if (path === PREFIX + "offers") {
      if (request.method !== "GET") return methodNotAllowed("GET");
      return reply({ schemaVersion: 1, offers: publicOffers(env), commerceActive: Boolean(publicOffers(env).some((o) => o["availability"] === "purchase_available")) });
    }
    if (path === PREFIX + "checkout") {
      if (request.method !== "POST") return methodNotAllowed("POST");
      return await checkout(request, env, fetcher);
    }
    if (path === PREFIX + "stripe-webhook") {
      if (request.method !== "POST") return methodNotAllowed("POST");
      return await webhook(request, env, fetcher);
    }
    const status = /^\/api\/v1\/commerce\/orders\/([^/]+)$/.exec(path);
    if (status) {
      if (request.method !== "GET") return methodNotAllowed("GET");
      return await orderStatus(request, env, status[1]!);
    }
    const receipt = /^\/api\/v1\/commerce\/purchase-record\/([^/]+)$/.exec(path);
    if (receipt) {
      if (request.method !== "GET") return methodNotAllowed("GET");
      return await purchaseRecord(request, env, receipt[1]!);
    }
    const asset = /^\/api\/v1\/commerce\/download\/([^/]+)$/.exec(path);
    if (asset) {
      if (request.method !== "GET") return methodNotAllowed("GET");
      return await download(request, env, asset[1]!);
    }
    return reply({ error: "NOT_FOUND" }, 404);
  } catch (error) {
    const failure = error instanceof CommerceFailure
      ? error : new CommerceFailure("COMMERCE_DEPENDENCY_ERROR", 503, true);
    // Only a bounded code and correlation ID are logged. No tokens, buyer details, Stripe bodies or secrets.
    console.error(JSON.stringify({ event: "commerce_api_failure", code: failure.code, requestId }));
    return reply({ error: failure.code, requestId, retryable: failure.retryable }, failure.status,
      failure.status === 429 ? { "Retry-After": "60" } : {});
  }
}
