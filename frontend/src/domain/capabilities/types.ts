export const CAPABILITY_KINDS = ["skill", "tool", "control"] as const;
export type CapabilityKind = (typeof CAPABILITY_KINDS)[number];
export type Capability = {
  readonly id: string;
  readonly name: string;
  readonly kind: CapabilityKind;
  readonly provider: string;
  readonly surfaces: readonly string[];
  readonly executionConstraint?: string;
  readonly integrationRequestAllowed: boolean;
};
export type CapabilityQuery = {
  readonly q?: string | undefined;
  readonly kind?: CapabilityKind | undefined;
  readonly provider?: string | undefined;
  readonly page?: number | undefined;
};
