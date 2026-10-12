import { z } from "zod";
import source from "@catalog/integration-packages.json";

const text = z.string().min(1);
export const integrationPackages = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    recordKind: z.literal("original-private-integration-packages"),
    releasedOn: text,
    implementationSourceRevision: z.string().regex(/^[a-f0-9]{40}$/),
    packages: z
      .array(
        z
          .object({
            id: text,
            version: text,
            title: text,
            summary: text,
            boundary: text,
            runtime: text,
            verification: text,
            files: z.number().int().positive(),
            bytes: z.number().int().positive(),
            sha256: z.string().regex(/^[a-f0-9]{64}$/),
            availability: z.literal("quote_first_integration"),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .parse(source);
if (
  new Set(integrationPackages.packages.map((item) => item.id)).size !==
  integrationPackages.packages.length
) {
  throw new Error("Duplicate integration package ID");
}
