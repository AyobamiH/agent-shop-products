import readiness from "../../../../commerce/launch-readiness.json";

const required = [
  "publicBusinessAddress", "monitoredSupportEmail", "taxTreatment", "liveMerchantProfile",
  "buyerContractAndRecovery", "retentionPolicy",
] as const;

// Source-controlled evidence gate for NEW live sales only. Never gate settlement
// or delivery of an existing paid order on a later launch-readiness change.
export function merchantReady(value: unknown = readiness): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record["schemaVersion"] !== 1 ||
      record["offerId"] !== "private-production-agent-operating-kit" ||
      !record["checks"] || typeof record["checks"] !== "object") return false;
  const checks = record["checks"] as Record<string, unknown>;
  return required.every((name) => {
    const check = checks[name] as Record<string, unknown> | undefined;
    if (!check || check["status"] !== "verified" || typeof check["evidence"] !== "string") return false;
    try {
      const url = new URL(check["evidence"]);
      return url.protocol === "https:" && !url.username && !url.password &&
        url.hostname === "github.com" &&
        /^\/AyobamiH\/agent-shop-products\/(?:blob\/[a-f0-9]{40}\/docs\/|issues\/\d+)/.test(url.pathname);
    } catch { return false; }
  });
}
