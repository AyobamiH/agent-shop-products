import { acquisitionPolicy, capabilityMeta } from "./repository";
import type { Capability } from "./types";

export function buildIntegrationBrief(capability: Capability) {
  return {
    schemaVersion: "1.0.0",
    recordKind: "capability-integration-brief",
    capability,
    inventoryCapturedOn: capabilityMeta.capturedOn,
    acquisition: acquisitionPolicy,
    status: capability.integrationRequestAllowed
      ? "buyer-input-and-provider-review-required"
      : "excluded-by-owner-execution-constraint",
    requiredBuyerInputs: [
      "contactEmail",
      "concrete requested outcome",
      "target runtime",
      "provider access and authority",
    ],
    ...(capability.integrationRequestAllowed
      ? {
          handoff: {
            method: acquisitionPolicy.requestMethod,
            endpoint: acquisitionPolicy.requestEndpoint,
            maxBodyBytes: acquisitionPolicy.requestBodyLimitBytes,
            templateIsIncomplete: true,
            requestTemplate: {
              requestedOutcome: `Assess and quote original integration work using ${capability.kind} ${capability.name}. Confirm feasibility, permissions, deliverables and acceptance before implementation.`,
              scope: "other",
              allowedActions: ["inspect"],
              blockedActions: ["merge", "deploy", "change_billing"],
              deliveryType: "report",
              acceptanceCriteria: [
                "Agreed target runtime and authorised provider access",
                "A scoped quote before implementation",
                "No resale of provider accounts or unlicensed external implementations",
              ],
              notes: `Agent Shop capability ID: ${capability.id}. Discovery is not an accepted job or purchase.`,
            },
          },
        }
      : {}),
  };
}
