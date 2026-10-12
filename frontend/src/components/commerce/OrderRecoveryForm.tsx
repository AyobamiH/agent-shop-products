import { useState } from "react";
export function OrderRecoveryForm({ onRestore }: { onRestore: () => Promise<void> }) {
  const [order, setOrder] = useState(""), [code, setCode] = useState(""), [error, setError] = useState("");
  return (
    <details className="mt-6 rounded-xl border border-border p-4">
      <summary className="cursor-pointer text-sm font-medium">Have an access code from support?</summary>
      <form className="mt-4 space-y-4" onSubmit={async event => {
        event.preventDefault(); setError("");
        if (!/^[0-9a-f-]{36}$/i.test(order.trim()) || !/^[A-Za-z0-9_-]{40,90}$/.test(code.trim())) {
          setError("Enter the order reference and access code supplied by support."); return;
        }
        try {
          sessionStorage.setItem("agent-shop:commerce-order", order.trim());
          sessionStorage.setItem("agent-shop:commerce-claim", code.trim());
          setCode(""); await onRestore();
        } catch { setError("Your browser could not save access. Please enable session storage and try again."); }
      }}>
        <label className="block text-sm">Order reference
          <input required value={order} onChange={event => setOrder(event.target.value)} autoComplete="off"
            className="mt-1 block min-h-11 w-full rounded-md border border-border bg-background px-3" />
        </label>
        <label className="block text-sm">Private access code
          <input required type="password" value={code} onChange={event => setCode(event.target.value)} autoComplete="off"
            className="mt-1 block min-h-11 w-full rounded-md border border-border bg-background px-3" />
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border px-4">Restore order access</button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </form>
    </details>
  );
}
