import { describe, expect, it } from "vitest";
import appServer from "../../../server";

const offersURL = "https://agents.proofandstate.com/api/v1/commerce/offers";
const globalEnv = globalThis as typeof globalThis & { __env__?: unknown };

describe("Nitro/TanStack Cloudflare worker environment boundary", () => {
  it("reports planned offers without 503 when the SSR inner fetch has no env argument", async () => {
    const before = globalEnv.__env__;
    try {
      delete globalEnv.__env__;
      const response = await appServer.fetch(new Request(offersURL), undefined, undefined);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.commerceActive).toBe(false);
      expect(body.offers[0]).toMatchObject({ availability: "planned" });
    } finally {
      globalEnv.__env__ = before;
    }
  });
  it("reads Nitro adapter-bound env per request rather than requiring fetch's second argument", async () => {
    const before = globalEnv.__env__;
    try {
      globalEnv.__env__ = { COMMERCE_ENABLED: "false", COMMERCE_MODE: "test" };
      const response = await appServer.fetch(new Request(offersURL), undefined, undefined);
      expect(response.status).toBe(200);
      expect((await response.json()).commerceActive).toBe(false);
    } finally {
      globalEnv.__env__ = before;
    }
  });
});
