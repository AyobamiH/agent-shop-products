import { describe, expect, it } from "vitest";
import { integrationPackages } from "./packages";

describe("original private package discovery", () => {
  it("publishes immutable metadata without payloads or active checkout", () => {
    expect(integrationPackages.packages).toHaveLength(3);
    for (const item of integrationPackages.packages) {
      expect(item.availability).toBe("quote_first_integration");
      expect(item.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(Object.keys(item)).not.toContain("downloadUrl");
      expect(Object.keys(item)).not.toContain("price");
      expect(Object.keys(item)).not.toContain("payload");
    }
  });
});
