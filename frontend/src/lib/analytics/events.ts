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
export type SafePage = { path: string; pageGroup: string; campaign: string; source: string };
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
  return {
    path,
    pageGroup: capability ? "external_capability" : product ? "public_product" : path,
    source: params.get("utm_source") ?? "unattributed",
    campaign: params.get("utm_campaign") ?? "none",
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
