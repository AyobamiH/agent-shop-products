import configuration from "./configuration.json";

export const ANALYTICS_ORIGIN = "https://agents.proofandstate.com";
export const CONSENT_VERSION = "2026-10-14.1";
export const CONSENT_KEY = "agent-shop:analytics-consent";
export const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
export const COOKIE_PREFIX = "agent_shop";
export type AnalyticsConfig = {
  schemaVersion: number;
  enabled: boolean;
  origin: string;
  propertyId: string | null;
  streamId: string | null;
  measurementId: string | null;
  ownershipVerifiedAt: string | null;
  enhancedMeasurementDisabled: boolean;
  advertisingFeaturesDisabled: boolean;
  retentionMonths: number | null;
  consentVersion: string;
};

// An environment variable alone must never activate an unrelated Google stream.
export const analyticsConfig: AnalyticsConfig = Object.freeze(configuration);
export function configuredMeasurementId(config: AnalyticsConfig, now = Date.now()): string | null {
  if (
    !config.enabled ||
    config.schemaVersion !== 1 ||
    config.origin !== ANALYTICS_ORIGIN ||
    config.consentVersion !== CONSENT_VERSION ||
    !config.enhancedMeasurementDisabled ||
    !config.advertisingFeaturesDisabled ||
    config.retentionMonths !== 2 ||
    !/^properties\/\d+$/.test(config.propertyId ?? "") ||
    !/^\d+$/.test(config.streamId ?? "") ||
    !/^G-[A-Z0-9]{6,20}$/.test(config.measurementId ?? "")
  )
    return null;
  const verified = Date.parse(config.ownershipVerifiedAt ?? "");
  return Number.isFinite(verified) && verified <= now ? config.measurementId : null;
}
