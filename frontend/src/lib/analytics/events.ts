import { getProductBySlug } from "@/domain/catalog/repository";
import { getCapability } from "@/domain/capabilities/repository";
import { SOLUTION_TRACKS } from "@/domain/commercial/decision";
import { ANALYTICS_ORIGIN } from "./config";

const pages = new Set([
  "/",
  "/agents",
  "/shop",
  "/solutions",
  "/problems",
  "/knowledge",
  "/capabilities",
  "/coding-bugs",
  "/integration-services",
  "/private-kits",
  "/privacy",
  "/legal/kit-terms",
  "/legal/kit-licence",
  "/legal/kit-refunds",
  "/legal/kit-privacy",
]);
const sources = new Set([
  "linkedin",
  "threads",
  "reddit",
  "github",
  "proofandstate",
  "tailwagging",
]);
const campaigns = new Set([
  "agent_shop_evidence",
  "agent_shop_integration",
  "agent_shop_private_kit",
]);
// Owner-approved Post-Once publication. The verified LinkedIn short-link
// changes "_" to empty in the four UTM query keys. Accept ONLY this exact
// already-published referral, never arbitrary aliases or customer URL fields.
const reviewedPostOnce = Object.freeze({
  campaign: "ASP-LIVE-20261016-001",
  source: "linkedin",
  medium: "social",
  content: "catalogue",
});
const approvedStandardKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
const observedLinkedinKeys = ["utmsource", "utmmedium", "utmcampaign", "utmcontent"];
const allowedPostOncePages = new Set(["/", "/shop"]);
function reviewedPostOnceQuery(path: string, params: URLSearchParams): boolean {
  if (!allowedPostOncePages.has(path) || params.size !== 4) return false;
  const keys = [...params.keys()];
  let selected: string[];
  if (approvedStandardKeys.every((key) => keys.includes(key))) selected = approvedStandardKeys;
  else if (observedLinkedinKeys.every((key) => keys.includes(key))) selected = observedLinkedinKeys;
  else return false; // Reject mixed, duplicate, extra or partial keys.
  return (
    new Set(keys).size === 4 &&
    params.get(selected[0]!) === reviewedPostOnce.source &&
    params.get(selected[1]!) === reviewedPostOnce.medium &&
    params.get(selected[2]!) === reviewedPostOnce.campaign &&
    params.get(selected[3]!) === reviewedPostOnce.content
  );
}
export type SafePage = {
  path: string;
  pageGroup: string;
  campaign: string;
  source: string;
  socialMedium: "social" | "referral" | null;
  socialContent: string | null;
};
export type DiscoveryEvent = {
  name: "page_view" | "select_capability" | "quote_click";
  parameters: Record<string, string>;
};

// Never forward free text, unknown paths, arbitrary UTMs, query values or hashes.
// Unsafe URLs are excluded entirely, including after a visitor previously consented.
export function safePage(href: string): SafePage | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.origin !== ANALYTICS_ORIGIN || url.username || url.password) return null;
  const path = url.pathname;
  const product = path.startsWith("/products/") && getProductBySlug(path.slice(10));
  const capability = path.startsWith("/capabilities/") && getCapability(path.slice(14));
  if (!pages.has(path) && !product && !capability) return null;
  if (url.hash && !(path === "/solutions" && SOLUTION_TRACKS.some((t) => "#" + t.id === url.hash)))
    return null;
  const params = url.searchParams;
  const keys = [...params.keys()];
  const reviewed = reviewedPostOnceQuery(path, params);
  if (!reviewed) {
    if (
      keys.some((key) => !["utm_source", "utm_medium", "utm_campaign"].includes(key)) ||
      new Set(keys).size !== keys.length
    )
      return null;
    if (
      keys.length &&
      (keys.length !== 3 ||
        !sources.has(params.get("utm_source") ?? "") ||
        !["social", "referral"].includes(params.get("utm_medium") ?? "") ||
        !campaigns.has(params.get("utm_campaign") ?? ""))
    )
      return null;
  }
  return {
    path,
    pageGroup: capability ? "external_capability" : product ? "public_product" : path,
    source: reviewed ? reviewedPostOnce.source : (params.get("utm_source") ?? "unattributed"),
    campaign: reviewed ? reviewedPostOnce.campaign : (params.get("utm_campaign") ?? "none"),
    socialMedium: reviewed ? "social" : (params.get("utm_medium") as "social" | "referral" | null),
    socialContent: reviewed ? reviewedPostOnce.content : null,
  };
}
export function discoveryEvent(
  href: string,
  name: string,
  selectedId?: string,
): DiscoveryEvent | null {
  const page = safePage(href);
  if (!page || !["page_view", "select_capability", "quote_click"].includes(name)) return null;
  const parameters: Record<string, string> = {
    page_location: ANALYTICS_ORIGIN + page.path,
    page_referrer: "",
    page_title: "Agent Shop — " + page.pageGroup,
    page_group: page.pageGroup,
    discovery_source: page.source,
    discovery_campaign: page.campaign,
    ...(page.socialMedium === "social" && page.socialContent
      ? { discovery_medium: page.socialMedium, discovery_content: page.socialContent }
      : {}),
  };
  if (name === "select_capability") {
    const selected = getCapability(selectedId ?? "");
    if (!selected || page.path !== "/capabilities") return null;
    parameters["capability_id"] = selected.id;
    parameters["capability_kind"] = selected.kind;
  }
  if (name === "quote_click") {
    const capability = page.path.startsWith("/capabilities/") && getCapability(page.path.slice(14));
    if (
      page.path !== "/integration-services" &&
      !(capability && capability.integrationRequestAllowed)
    )
      return null;
    parameters["quote_context"] = capability ? "capability_brief" : "integration_services";
  }
  return { name: name as DiscoveryEvent["name"], parameters };
}
