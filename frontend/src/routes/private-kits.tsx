import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { buildPageHead } from "@/lib/seo/meta";

type KitOffer = {
  id: string; title: string; summary: string; version: string;
  availability: string; unitAmountPence?: number;
  termsVersion?: string; licenceVersion?: string; refundPolicyVersion?: string;
  termsUrl?: string; licenceUrl?: string; refundUrl?: string;
  buyerRequirements?: string[];
};
type Catalogue = { offers: KitOffer[]; commerceActive: boolean };
type CheckoutReceipt = { orderId: string; claimToken: string; checkoutUrl: string };
const OFFER_URL = "/api/v1/commerce/offers";
const KIT_ID = "private-production-agent-operating-kit";

export const Route = createFileRoute("/private-kits")({
  head: () => buildPageHead({
    title: "Private execution kits — Agent Shop",
    description: "Separate original paid execution kits from free public skills. Commercial access opens only after verified delivery, licensed terms and checkout are available.",
    path: "/private-kits",
  }),
  component: PrivateKitsPage,
});

function PrivateKitsPage() {
  const [offer, setOffer] = useState<KitOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    fetch(OFFER_URL, { signal: abort.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Commerce availability could not be checked");
        return response.json() as Promise<Catalogue>;
      })
      .then((data) => {
        setOffer(data.offers.find((item) => item.id === KIT_ID) ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          setError("Commerce status is temporarily unavailable. No payment has been started.");
          setLoading(false);
        }
      });
    return () => abort.abort();
  }, []);

  const available = offer?.availability === "purchase_available" && typeof offer.unitAmountPence === "number";
  const price = available
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(offer!.unitAmountPence! / 100)
    : null;

  async function beginPurchase() {
    if (!available || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/commerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ offerId: KIT_ID }),
        cache: "no-store",
      });
      const data = await response.json() as Partial<CheckoutReceipt> & { error?: string };
      if (!response.ok || !data.orderId || !data.claimToken || !data.checkoutUrl) {
        throw new Error(data.error || "CHECKOUT_UNAVAILABLE");
      }
      const redirect = new URL(data.checkoutUrl);
      if (redirect.protocol !== "https:" || redirect.hostname !== "checkout.stripe.com") {
        throw new Error("UNTRUSTED_CHECKOUT");
      }
      sessionStorage.setItem("agent-shop:commerce-order", data.orderId);
      sessionStorage.setItem("agent-shop:commerce-claim", data.claimToken);
      window.location.assign(redirect.toString());
    } catch {
      setError("Checkout could not be started safely. No delivery entitlement has been granted.");
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <div className="max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link to="/shop" className="underline underline-offset-4">Public catalogue</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Private execution kits</span>
        </nav>
        <div className="mt-8">
          <SectionHeading
            as="h1"
            eyebrow="Separate commercial product"
            title="Private execution kits, not repackaged public prompts"
            description="Review the public operating-files skill first. A paid offer, if released, is an independently versioned implementation kit with its own licence, update boundary and verified delivery."
          />
        </div>
        <section className="mt-8 rounded-xl border border-border bg-surface p-6" aria-label="Private kit offer">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Private Production Agent Operating Kit · v2026.10.1</p>
          <h2 className="mt-3 text-xl font-semibold">{offer?.title || "Private Production Agent Operating Kit"}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {offer?.summary || "A proposed private execution pack with checked templates, runtime verification cases and failure-handling examples."}
          </p>
          <p className="mt-4 text-sm">
            Open source stays free:{" "}
            <a className="underline underline-offset-4" href="/products/production-agent-operating-files">
              Production Agent Operating Files
            </a>.
          </p>
          <div className="mt-5 border-t border-border pt-5">
            {loading ? <p role="status">Checking verified commerce availability…</p> : (
              available ? (
                <>
                  <p className="text-lg font-semibold">{price}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    One-off digital delivery. The displayed GBP amount excludes applicable taxes,
                    which are calculated during the approved Stripe checkout.
                    Review the governing documents before purchasing.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <a href={offer?.termsUrl} className="underline">Purchase terms</a>
                    <a href={offer?.licenceUrl} className="underline">Kit licence</a>
                    <a href={offer?.refundUrl} className="underline">Refunds and cancellation</a>
                  </div>
                  <button type="button" disabled={busy} onClick={beginPurchase}
                    className="mt-4 min-h-11 rounded-md bg-primary px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
                    {busy ? "Opening secure checkout…" : "Continue to secure checkout"}
                  </button>
                </>
              ) : (
                <>
                  <p className="font-medium">Private-kit checkout is not yet open</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No price, paid licence, download entitlement or guaranteed delivery is currently offered.
                    Public skills remain accessible without purchase.
                  </p>
                  <a className="mt-4 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm underline"
                    href="/integration-services">Request a scoped integration instead</a>
                </>
              )
            )}
            {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          </div>
        </section>
        <section className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">What purchase will not authorise</h2>
          <p className="mt-3">
            A kit purchase does not grant access to your repositories, Cloudflare, Stripe or third-party
            provider accounts. Execution, deployment, billing and production changes remain separately
            authorised and independently verified.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
