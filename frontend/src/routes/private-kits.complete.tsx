import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageHead } from "@/lib/seo/meta";

type OrderStatus = {
  orderId: string;
  state: "creating" | "checkout_open" | "paid" | "failed" | "revoked";
  fulfilment: "available" | "unavailable";
};
export const Route = createFileRoute("/private-kits/complete")({
  head: () => buildPageHead({
    title: "Private kit order status — Agent Shop",
    description: "Check payment-verified private-kit delivery without treating Stripe redirect parameters as proof of purchase.",
    path: "/private-kits/complete",
    indexable: false,
  }),
  component: CompletionPage,
});
function CompletionPage() {
  const [record, setRecord] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const credentials = (): { id: string; claim: string } | null => {
    const id = sessionStorage.getItem("agent-shop:commerce-order");
    const claim = sessionStorage.getItem("agent-shop:commerce-claim");
    return id && claim ? { id, claim } : null;
  };
  async function readStatus() {
    setWorking(true);
    setError("");
    try {
      const identity = credentials();
      if (!identity) throw new Error("MISSING_LOCAL_CLAIM");
      const response = await fetch("/api/v1/commerce/orders/" + encodeURIComponent(identity.id), {
        headers: { Authorization: "Bearer " + identity.claim },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("STATUS_NOT_AVAILABLE");
      setRecord(await response.json() as OrderStatus);
    } catch {
      setError("Payment status could not be verified with the local order claim. A checkout redirect alone does not grant access.");
    } finally {
      setWorking(false);
    }
  }
  useEffect(() => { void readStatus(); }, []);

  async function downloadKit() {
    const identity = credentials();
    if (!identity || working || record?.fulfilment !== "available") return;
    setError("");
    setWorking(true);
    try {
      const response = await fetch("/api/v1/commerce/download/" + encodeURIComponent(identity.id), {
        headers: { Authorization: "Bearer " + identity.claim },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("NOT_AUTHORISED");
      const blob = await response.blob();
      if (blob.size === 0) throw new Error("EMPTY_DELIVERY");
      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "private-agent-execution-kit.zip";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } finally { URL.revokeObjectURL(url); }
    } catch {
      setError("Verified delivery is unavailable. The order remains recoverable through authorised support.");
    } finally { setWorking(false); }
  }

  return (
    <PageShell>
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Private kit · secure fulfilment</p>
        <h1 className="mt-4 text-3xl font-semibold">Verify your kit order</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Payment and entitlement are verified server-side. Returning from Stripe does not mean
          the order was paid or that delivery is available.
        </p>
        <div className="mt-8 rounded-xl border border-border bg-surface p-6">
          <p role="status" className="font-medium">
            {record ? "Order state: " + record.state : "Awaiting an authenticated order readback"}
          </p>
          {record?.fulfilment === "available" && (
            <button className="mt-4 min-h-11 rounded-md bg-primary px-4 text-white disabled:opacity-60"
              type="button" disabled={working} onClick={downloadKit}>
              Download verified private kit
            </button>
          )}
          <button className="mt-4 ml-3 min-h-11 rounded-md border border-border px-4 disabled:opacity-60"
            type="button" disabled={working} onClick={readStatus}>
            {working ? "Checking…" : "Recheck status"}
          </button>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          If you changed browsers or devices, the local order claim will not be available here.
          Contact the provider with your Stripe receipt to request a controlled recovery.
          Never paste payment card details into an enquiry.
        </p>
        <Link className="mt-6 inline-flex underline underline-offset-4" to="/shop">Return to catalogue</Link>
      </div>
    </PageShell>
  );
}
