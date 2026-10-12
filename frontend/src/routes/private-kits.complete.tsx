import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { OrderRecoveryForm } from "@/components/commerce/OrderRecoveryForm";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageHead } from "@/lib/seo/meta";
import { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from "@/lib/contact";

type OrderStatus = {
  orderId: string;
  state: "creating" | "checkout_open" | "paid" | "failed" | "revoked";
  purchaseRecordAvailable?: boolean; purchaseRecordSaved?: boolean;
  fulfilment: "available" | "unavailable";
};
export const Route = createFileRoute("/private-kits/complete")({
  head: () => buildPageHead({
    title: "Private kit order status — Agent Shop",
    description: "Check your private kit order and download availability.",
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
      setError("We could not retrieve your order in this browser. Try again, or contact us with your order reference.");
    } finally {
      setWorking(false);
    }
  }
  useEffect(() => { void readStatus(); }, []);

  async function downloadKit(purchaseRecord = false) {
    const identity = credentials();
    if (!identity || working || (!purchaseRecord && record?.fulfilment !== "available")) return;
    setError("");
    setWorking(true);
    try {
      const response = await fetch("/api/v1/commerce/" + (purchaseRecord ? "purchase-record/" : "download/") + encodeURIComponent(identity.id), {
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
        anchor.download = purchaseRecord ? "agent-shop-purchase-record.txt" : "private-agent-execution-kit.zip";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } finally { URL.revokeObjectURL(url); }
      if (purchaseRecord) await readStatus();
    } catch {
      setError("Your download is currently unavailable. Please try again or contact us with your order reference.");
    } finally { setWorking(false); }
  }

  return (
    <PageShell>
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Private kit order</p>
        <h1 className="mt-4 text-3xl font-semibold">Your kit order</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Check your payment status and download your kit once payment is confirmed.
        </p>
        <div className="mt-8 rounded-xl border border-border bg-surface p-6">
          <p role="status" className="font-medium">
            {record ? "Order state: " + record.state : "Your order status is not available yet"}
          </p>
          {record?.purchaseRecordAvailable && (
            <button className="mt-4 min-h-11 rounded-md border border-border px-4 disabled:opacity-60"
              type="button" disabled={working} onClick={() => void downloadKit(true)}>
              Save purchase record
            </button>
          )}
          {record?.purchaseRecordAvailable && !record.purchaseRecordSaved && (
            <p className="mt-3 text-sm">Save your purchase record before downloading the kit. It includes your terms and payment total.</p>
          )}
          {record?.fulfilment === "available" && (
            <button className="mt-4 min-h-11 rounded-md bg-primary px-4 text-white disabled:opacity-60"
              type="button" disabled={working || (record.purchaseRecordAvailable && !record.purchaseRecordSaved)} onClick={() => void downloadKit()}>
              Download your kit
            </button>
          )}
          <button className="mt-4 ml-3 min-h-11 rounded-md border border-border px-4 disabled:opacity-60"
            type="button" disabled={working} onClick={readStatus}>
            {working ? "Checking…" : "Recheck status"}
          </button>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          If you changed browsers or devices, email{" "}
          <a href={SUPPORT_EMAIL_HREF} className="break-all underline">{SUPPORT_EMAIL}</a>{" "}
          with your order reference or Stripe receipt for help recovering access.
          Do not include payment card details in your enquiry.
        </p>
        <OrderRecoveryForm onRestore={readStatus} />
        <Link className="mt-6 inline-flex underline underline-offset-4" to="/shop">Return to catalogue</Link>
      </div>
    </PageShell>
  );
}
