import { COOKIE_PREFIX, CONSENT_LIFETIME_MS } from "./config";
import type { DiscoveryEvent } from "./events";
import type { AnalyticsTransport } from "./runtime";

type GoogleWindow = Window & { agentShopAnalyticsLayer?: IArguments[] };
const scriptId = "agent-shop-analytics";
export function createGoogleTransport(
  browser: Window = window,
  doc: Document = document,
): AnalyticsTransport {
  const target = browser as GoogleWindow;
  const flags = browser as unknown as Record<string, unknown>;
  let measurementId: string | null = null;
  let active = false;
  function command(..._values: unknown[]) {
    // gtag expects Arguments, not an arbitrary event object or form contents.
    // eslint-disable-next-line prefer-rest-params -- The documented gtag queue consumes Arguments.
    target.agentShopAnalyticsLayer?.push(arguments);
  }
  function clearCookies() {
    for (const cookie of doc.cookie.split(";")) {
      const name = cookie.trim().split("=")[0] ?? "";
      if (!name.startsWith(COOKIE_PREFIX + "_")) continue;
      for (const domain of ["", "; Domain=agents.proofandstate.com"]) {
        doc.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax; Secure" + domain;
      }
    }
  }
  return {
    start(id, page) {
      measurementId = id;
      flags["ga-disable-" + id] = false;
      active = true;
      target.agentShopAnalyticsLayer ??= [];
      command("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      command("js", new Date());
      command("config", id, {
        ...page.parameters,
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        ignore_referrer: true,
        cookie_domain: "none",
        cookie_prefix: COOKIE_PREFIX,
        cookie_path: "/",
        cookie_expires: CONSENT_LIFETIME_MS / 1000,
        cookie_update: false,
        cookie_flags: "SameSite=Lax;Secure",
        transport_type: "beacon",
        // Never derive campaign values from arbitrary URL parameters.
        campaign_source: page.parameters["discovery_source"],
        campaign_medium: "referral",
        campaign_name: page.parameters["discovery_campaign"],
        campaign_content: "",
        campaign_term: "",
      });
      if (!doc.getElementById(scriptId)) {
        const script = doc.createElement("script");
        script.id = scriptId;
        script.async = true;
        script.referrerPolicy = "no-referrer";
        script.src =
          "https://www.googletagmanager.com/gtag/js?id=" + id + "&l=agentShopAnalyticsLayer";
        doc.head.append(script);
      }
    },
    send(event: DiscoveryEvent) {
      if (!active || !measurementId || flags["ga-disable-" + measurementId]) return;
      command("set", {
        page_location: event.parameters["page_location"],
        page_referrer: "",
        page_title: event.parameters["page_title"],
      });
      command("event", event.name, { ...event.parameters, send_to: measurementId });
    },
    stop(clear = false) {
      // No consent-denied ping: disable before clearing the queued events or cookies.
      active = false;
      if (measurementId) flags["ga-disable-" + measurementId] = true;
      if (target.agentShopAnalyticsLayer) target.agentShopAnalyticsLayer.length = 0;
      // Keep the loaded SDK during safe navigation; avoid duplicate handlers.
      // Withdrawal reloads the page after disabling and clearing scoped storage.
      if (clear) {
        doc.getElementById(scriptId)?.remove();
        clearCookies();
      }
    },
  };
}
