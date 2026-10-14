import { AnalyticsPreferences } from "./AnalyticsPreferences";
import { useEffect, useRef, useState } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { analyticsConfig, configuredMeasurementId, CONSENT_KEY } from "@/lib/analytics/config";
import { readConsent, saveConsent } from "@/lib/analytics/consent";
import type { ConsentChoice } from "@/lib/analytics/consent";
import type { SafePage } from "@/lib/analytics/events";
import type { DiscoveryRuntime } from "@/lib/analytics/runtime";

export function DiscoveryAnalytics() {
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location.href });
  const runtime = useRef<DiscoveryRuntime | null>(null);
  const safePage = useRef<((href: string) => SafePage | null) | null>(null);
  const forceDenied = useRef(false);
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const enabled = !!configuredMeasurementId(analyticsConfig);
  const publicRoute = !!safePage.current?.(analyticsConfig.origin + location);

  useEffect(() => {
    let mounted = true;
    async function initialise() {
      if (enabled) {
        const [runtimeModule, transportModule, eventsModule] = await Promise.all([
          import("@/lib/analytics/runtime"),
          import("@/lib/analytics/google-transport"),
          import("@/lib/analytics/events"),
        ]);
        if (!mounted) return;
        runtime.current = new runtimeModule.DiscoveryRuntime(
          analyticsConfig,
          transportModule.createGoogleTransport(),
        );
        safePage.current = eventsModule.safePage;
      }
      if (!mounted) return;
      try {
        setChoice(readConsent(window.localStorage));
      } catch {
        setChoice(null);
      }
      setReady(true);
    }
    void initialise().catch(() => {
      if (mounted) setReady(true);
    });
    const open = () => setSettingsOpen(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== CONSENT_KEY && event.key !== null) return;
      runtime.current?.pause();
      try {
        setChoice(readConsent(window.localStorage));
      } catch {
        setChoice(null);
      }
    };
    window.addEventListener("agent-shop:analytics-settings", open);
    window.addEventListener("storage", sync);
    const unsubscribe = router.subscribe("onBeforeNavigate", () => runtime.current?.pause());
    return () => {
      mounted = false;
      runtime.current?.pause();
      unsubscribe();
      window.removeEventListener("agent-shop:analytics-settings", open);
      window.removeEventListener("storage", sync);
    };
  }, [router, enabled]);

  useEffect(() => {
    if (!ready) return;
    const currentChoice = () => {
      if (forceDenied.current) return "denied";
      try {
        return readConsent(window.localStorage);
      } catch {
        return null;
      }
    };
    runtime.current?.update(window.location.href, currentChoice());
    const click = (event: MouseEvent) => {
      if (!event.isTrusted || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[data-discovery-event]");
      if (!link) return;
      // Use only our two canonical contact destinations, not arbitrary DOM link URLs.
      const type = link.dataset["discoveryEvent"];
      if (
        type === "quote_click" &&
        !/^https:\/\/tailwaggingwebdesign\.com\/contact\/\?utm_source=agent_shop&utm_medium=referral&utm_campaign=(integration_services|capability_brief)$/.test(
          link.href,
        )
      )
        return;
      runtime.current?.event(
        window.location.href,
        currentChoice(),
        type ?? "",
        link.dataset["capabilityId"],
      );
    };
    document.addEventListener("click", click, true);
    // Expired consent in an idle tab must stop collection without needing another click.
    const timer = window.setInterval(() => {
      const value = currentChoice();
      if (value !== "granted") runtime.current?.pause();
      setChoice(value);
    }, 30000);
    return () => {
      document.removeEventListener("click", click, true);
      window.clearInterval(timer);
    };
  }, [location, choice, ready]);

  function choose(value: ConsentChoice) {
    runtime.current?.pause(value === "denied");
    let saved = false;
    try {
      saved = saveConsent(window.localStorage, value);
    } catch {
      /* fail closed */
    }
    forceDenied.current = !saved;
    if (!saved) runtime.current?.pause(true);
    if (saved && value === "granted") runtime.current?.update(window.location.href, value);
    setStorageFailed(!saved);
    setChoice(saved ? value : null);
    setSettingsOpen(!saved);
    // A fresh page removes any previously loaded Google handlers after withdrawal.
    if (value === "denied" && saved) window.location.reload();
  }
  if (!ready || (!settingsOpen && !(enabled && publicRoute && choice === null))) return null;
  return (
    <AnalyticsPreferences
      enabled={enabled}
      storageFailed={storageFailed}
      settingsOpen={settingsOpen}
      onChoose={choose}
      onClose={() => setSettingsOpen(false)}
    />
  );
}
