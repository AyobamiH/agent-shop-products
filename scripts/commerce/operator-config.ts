import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { d1Rest } from "./d1-rest";
import type { CommerceEnv } from "../../frontend/src/server/commerce/config";

export function readPrivateJson(path: string): Record<string, unknown> {
  const file = resolve(path), info = statSync(file);
  if (!info.isFile() || (info.mode & 0o077) !== 0) throw Error("PRIVATE_FILE_PERMISSIONS_REQUIRED");
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}
export function operatorEnvironment(filename: string): CommerceEnv {
  const config = readPrivateJson(filename);
  const accountId = String(config["accountId"] || ""), databaseId = String(config["databaseId"] || "");
  const mode = config["mode"];
  if (mode !== "test" && mode !== "live") throw Error("EXPLICIT_MODE_REQUIRED");
  if (accountId !== "6ddcbcb8474f1a7e460b2f0aabec0e2f") throw Error("UNEXPECTED_CLOUDFLARE_ACCOUNT");
  const production = databaseId === "f3fa2e0b-bb41-4c51-8b44-25f699baa39b";
  if ((mode === "live") !== production) throw Error("DATABASE_MODE_MISMATCH");
  let token = config["cloudflareToken"];
  if (!token && typeof config["cloudflareTokenFile"] === "string") {
    const info = statSync(config["cloudflareTokenFile"]);
    if (!info.isFile() || (info.mode & 0o077) !== 0) throw Error("PRIVATE_AUTH_FILE_REQUIRED");
    const entries = new Map(readFileSync(config["cloudflareTokenFile"], "utf8").split(/\r?\n/).flatMap(line => {
      const index = line.indexOf("=");
      return index < 1 ? [] : [[line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, "")]];
    }));
    if (entries.get("CLOUDFLARE_ACCOUNT_ID") !== accountId) throw Error("AUTH_ACCOUNT_MISMATCH");
    token = entries.get("CLOUDFLARE_API_TOKEN");
  }
  if (!token && typeof config["wranglerAuthFile"] === "string") {
    const info = statSync(config["wranglerAuthFile"]);
    if (!info.isFile() || (info.mode & 0o077) !== 0) throw Error("PRIVATE_AUTH_FILE_REQUIRED");
    token = Bun.TOML.parse(readFileSync(config["wranglerAuthFile"], "utf8"))["oauth_token"];
  }
  if (typeof token !== "string" || !token) throw Error("CLOUDFLARE_AUTH_REQUIRED");
  const env: CommerceEnv = { COMMERCE_MODE: mode, COMMERCE_DB: d1Rest(accountId, databaseId, token) };
  if (typeof config["stripeKeyFile"] === "string") {
    const source = readPrivateJson(config["stripeKeyFile"]);
    const key = source["stripeKey"];
    if (typeof key !== "string" || !(key.startsWith("rk_" + mode + "_") || (mode === "test" && key.startsWith("sk_test_")))) throw Error("RESTRICTED_STRIPE_KEY_REQUIRED");
    env.STRIPE_SECRET_KEY = key;
  }
  return env;
}
