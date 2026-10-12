import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
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
const PLANNED_PRICE_LABEL = "Planned introductory price: £9 one-off.";

export const Route = createFileRoute("/private-kits")({
  head: () => buildPageHead({
    title: "Private execution kits — Agent Shop",
    description: "Explore the Private Production Agent Operating Kit, its contents, licence, support and availability.",
    path: "/private-kits",
  }),
  component: PrivateKitsLayout,
});

function PrivateKitsLayout() {
  const matchRoute = useMatchRoute();
  return matchRoute({ to: "/private-kits/complete" }) ? <Outlet /> : <PrivateKitsPage />;
}

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
          setError("Availability is temporarily unavailable. Please try again. No payment has been started.");
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
      setError("Checkout could not be opened. Please try again or contact us for help.");
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
            eyebrow="Original implementation kit"
            title="Private execution kits"
            description="Explore reference examples, runtime verification cases and failure-handling guidance for building agent systems."
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
            {loading ? (
              <div>
                <p className="font-medium">{PLANNED_PRICE_LABEL}</p>
                <p role="status" className="mt-2 text-sm text-muted-foreground">
                  Checking whether online orders are open. No payment has been started.
                </p>
                <a href="/integration-services" className="mt-4 inline-block text-sm text-primary underline underline-offset-4">
                  Enquire about professional integration
                </a>
              </div>
            ) : (
              available ? (
                <>
                  <p className="text-lg font-semibold">{price}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    One-off digital delivery. Any applicable tax and the final total are
                    shown before you pay. Review the purchase terms before continuing.
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
                    {PLANNED_PRICE_LABEL} Online purchases are currently unavailable.
                    Browse the public skills or contact us about integration work.
                  </p>
                  <a className="mt-4 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm underline"
                    href="/integration-services">Enquire about integration</a>
                </>
              )
            )}
            {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          </div>
        </section>
        <section aria-labelledby="private-kit-value" className="mt-8 border-t border-border pt-8">
          <h2 id="private-kit-value" className="text-lg font-semibold">
            What is different from the free public reference?
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Private, versioned runtime guard and integration fixtures, not a paid copy of the public prompt.</li>
            <li>Executable verification and failure-handling cases for authorised agent workflows.</li>
            <li>Rollback and recovery worksheets for reviewing changes before applying them.</li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Once purchases open, delivery is for the purchased version with 30 days of bounded
            archive-access and documented-test assistance. No automatic upgrade or deployment
            authority is included. The stated refund policy allows 14-day full refunds, including
            after download.
          </p>
        </section>
        <nav aria-label="Buyer information" className="mt-6 flex flex-wrap gap-4 text-sm">
          <a href="/legal/kit-terms" className="underline">Purchase terms</a>
          <a href="/legal/kit-licence" className="underline">Licence</a>
          <a href="/legal/kit-refunds" className="underline">Refunds</a>
          <a href="/legal/kit-privacy" className="underline">Privacy</a>
        </nav>
        <section className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">Using the kit</h2>
          <p className="mt-3">
            Review and adapt the examples for your environment before running them. You are
            responsible for obtaining the permissions needed to connect accounts, change
            repositories, deploy code or incur charges.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
