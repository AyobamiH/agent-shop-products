import type { ConsentChoice } from "@/lib/analytics/consent";
type Props = {
  enabled: boolean;
  storageFailed: boolean;
  settingsOpen: boolean;
  onChoose: (value: ConsentChoice) => void;
  onClose: () => void;
};
export function AnalyticsPreferences({
  enabled,
  storageFailed,
  settingsOpen,
  onChoose,
  onClose,
}: Props) {
  return (
    <section
      aria-label="Analytics preferences"
      className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto border-t border-border bg-surface px-4 py-6 shadow-lg"
    >
      <div className="mx-auto max-w-[74rem]">
        <h2 className="text-lg font-semibold">Optional analytics</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed">
          {enabled
            ? "Allow Google Analytics to measure public page views, public capability selections and clicks to request a quote. It uses a browser identifier. We do not use advertising features or send enquiry text, purchase references or private access tokens."
            : "Analytics is currently off. No Google Analytics script, cookies or events are loaded. Browsing and quote requests do not require analytics."}
        </p>
        {enabled && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onChoose("granted")}
              className="min-h-11 rounded border border-border px-4 py-2 text-sm"
            >
              Allow analytics
            </button>
            <button
              type="button"
              onClick={() => onChoose("denied")}
              className="min-h-11 rounded border border-border px-4 py-2 text-sm"
            >
              Reject analytics
            </button>
          </div>
        )}
        {storageFailed && (
          <p role="alert" className="mt-3 text-sm">
            Your preference could not be saved. Analytics remains off.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a href="/privacy" className="underline">
            Website privacy and measurement
          </a>
          {settingsOpen && (
            <button type="button" onClick={onClose} className="underline">
              Close settings
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
