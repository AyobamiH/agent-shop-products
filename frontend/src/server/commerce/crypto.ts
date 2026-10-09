import { CommerceFailure } from "./config";

const encoder = new TextEncoder();
const maxWebhookBytes = 65_536;
const toleranceSeconds = 300;

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[a-f0-9]{64}$/i.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export async function verifyStripeSignature(
  body: string, header: string | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!secret.startsWith("whsec_") || !header || encoder.encode(body).length > maxWebhookBytes) return false;
  const fields = header.split(",").map((part) => part.trim().split("="));
  const timestamps = fields.filter(([name]) => name === "t").map(([, value]) => value);
  if (timestamps.length !== 1 || !/^[0-9]{10,12}$/.test(timestamps[0] || "")) return false;
  const timestamp = Number(timestamps[0]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;
  const signatures = fields.filter(([name]) => name === "v1").map(([, value]) => value);
  if (signatures.length === 0 || signatures.length > 8) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const signedBytes = encoder.encode(String(timestamp) + "." + body);
  for (const candidate of signatures) {
    const bytes = hexToBytes(candidate || "");
    if (bytes && await crypto.subtle.verify("HMAC", key, bytes, signedBytes)) return true;
  }
  return false;
}

export async function claimTokenHash(token: string): Promise<string> {
  if (!/^[A-Za-z0-9_-]{40,90}$/.test(token)) throw new CommerceFailure("INVALID_CLAIM", 401);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode("agent-shop-claim-v1:" + token)));
  return Array.from(digest, (v) => v.toString(16).padStart(2, "0")).join("");
}

export function newClaimToken(): string {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of raw) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function checkBodySize(request: Request, maxBytes: number): void {
  const length = Number(request.headers.get("content-length") || "0");
  if (length > maxBytes) throw new CommerceFailure("PAYLOAD_TOO_LARGE", 413);
}

export function assertBrowserOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (origin !== "https://agents.proofandstate.com" ||
      (site && site !== "same-origin" && site !== "none")) {
    throw new CommerceFailure("ORIGIN_DENIED", 403);
  }
}
