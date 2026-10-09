import { z } from "zod";

const text = z.string().min(1);
export const inventorySchema = z.object({
  schemaVersion: text,
  capturedOn: text,
  scope: z.object({
    completeness: text,
    runtimeRule: text,
    skillBodiesIncluded: z.literal(false),
    toolInstructionBodiesIncluded: z.literal(false),
  }),
  counts: z.object({
    uniqueSkills: z.number().int(),
    advertisedTools: z.number().int(),
    orchestrationControls: z.number().int(),
  }),
  skills: z.array(
    z.object({ name: text, surfaces: z.array(z.enum(["cloud", "executor"])).min(1) }),
  ),
  tools: z.array(z.object({ name: text, provider: text })),
  orchestrationControls: z.array(text),
  executionConstraints: z.array(z.object({ provider: text, state: text, reason: text })),
});

export const acquisitionSchema = z
  .object({
    schemaVersion: text,
    recordKind: z.literal("capability-integration-acquisition-policy"),
    reviewedOn: text,
    model: z.literal("quote-first-original-integration"),
    providerName: text,
    providerGuide: z.string().url(),
    providerCatalogue: z.string().url(),
    providerContractSource: z.string().url(),
    requestEndpoint: z.string().url(),
    requestMethod: z.literal("POST"),
    requestBodyLimitBytes: z.number().int().positive(),
    deliverables: z.array(text).min(1),
    buyerRequirements: z.array(text).min(1),
    boundaries: z.array(text).min(1),
  })
  .strict();
