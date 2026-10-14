import { CONSENT_KEY, CONSENT_LIFETIME_MS, CONSENT_VERSION } from "./config";
export type ConsentChoice = "granted" | "denied";
export type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;
export function readConsent(storage: PreferenceStorage, now = Date.now()): ConsentChoice | null {
  try {
    const item: unknown = JSON.parse(storage.getItem(CONSENT_KEY) ?? "null");
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const choice = record["choice"];
    const timestamp = record["timestamp"];
    if (
      record["version"] !== CONSENT_VERSION ||
      (choice !== "granted" && choice !== "denied") ||
      typeof timestamp !== "number" ||
      !Number.isFinite(timestamp) ||
      timestamp > now ||
      now - timestamp >= CONSENT_LIFETIME_MS
    )
      return null;
    return choice;
  } catch {
    return null;
  }
}
export function saveConsent(
  storage: PreferenceStorage,
  choice: ConsentChoice,
  now = Date.now(),
): boolean {
  try {
    storage.setItem(
      CONSENT_KEY,
      JSON.stringify({ version: CONSENT_VERSION, choice, timestamp: now }),
    );
    return true;
  } catch {
    return false;
  }
}
