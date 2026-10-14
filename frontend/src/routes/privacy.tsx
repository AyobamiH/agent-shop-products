import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageHead } from "@/lib/seo/meta";
import { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from "@/lib/contact";
import { analyticsConfig, configuredMeasurementId, CONSENT_VERSION } from "@/lib/analytics/config";
export const Route = createFileRoute("/privacy")({
  head: () =>
    buildPageHead({
      title: "Website privacy and optional analytics — Agent Shop",
      description:
        "How Agent Shop handles optional discovery analytics, consent, website requests and links to independent integration enquiries.",
      path: "/privacy",
    }),
  component: WebsitePrivacy,
});
function WebsitePrivacy() {
  const enabled = !!configuredMeasurementId(analyticsConfig);
  return (
    <PageShell>
      <article className="max-w-3xl space-y-7 text-sm leading-7">
        <h1 className="text-3xl font-semibold">Website privacy and optional analytics</h1>
        <p>Version {CONSENT_VERSION} · 14 October 2026</p>
        <p>
          <strong>Current status:</strong>{" "}
          {enabled
            ? "Optional Google Analytics is available only after you allow it."
            : "Google Analytics is off. This site does not currently load a Google Analytics script, set its cookies or send its events."}
        </p>
        <section>
          <h2 className="text-xl font-semibold">Who operates this website?</h2>
          <p className="mt-3">
            Agent Shop is a Proof &amp; State project operated by Ayobami John Haastrup, a sole
            trader trading as Tail Wagging Website Design Factory Northampton. Contact{" "}
            <a href={SUPPORT_EMAIL_HREF} className="underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            about website data or your rights.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Your choice</h2>
          <p className="mt-3">
            When analytics is available, choosing Allow analytics is optional. Rejecting it does not
            restrict the catalogue, enquiries or purchases. We do not load the analytics script or
            send cookieless analytics pings before consent. You can change your choice through
            Analytics settings in the footer. Your preference is stored in your browser for up to
            180 days; it is not sent as a customer identifier.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("agent-shop:analytics-settings"))}
            className="mt-3 min-h-11 rounded border border-border px-4"
          >
            Analytics settings
          </button>
        </section>
        <section>
          <h2 className="text-xl font-semibold">What optional measurement would collect</h2>
          <p className="mt-3">
            With consent and an enabled stream, Google Analytics measures public page views,
            selections of publicly listed capabilities and clicks to request an integration quote.
            Our events contain canonical public paths and fixed campaign labels, not free-text
            searches, full referring URLs, enquiry contents, email addresses, order references or
            access tokens. Private order-completion and API routes are excluded. URLs containing
            unrecognised parameters are not measured.
          </p>
          <p className="mt-3">
            Google Analytics uses a pseudonymous browser identifier and processes device and network
            information to provide reports. It is not anonymous merely because we omit your name.
            Advertising features, Google Signals, cross-domain linking and automatic enhanced
            measurement are not part of this setup. Our activation gate requires two-month
            event-data retention and a correctly owned Agent Shop stream. Consent cookies have an
            Agent Shop-specific prefix and expire within 180 days; withdrawing consent clears these
            cookies and stops collection.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Providers and other website requests</h2>
          <p className="mt-3">
            Cloudflare hosts the website and processes requests and operational logs to provide and
            protect it. The current design also loads Google Fonts, independently of optional
            analytics. These network services receive information needed to answer the request,
            including the requesting IP address. If analytics is enabled and you consent, Google
            processes analytics data under its terms, including applicable international transfer
            safeguards. We use consent for optional analytics and legitimate interests in operating
            and securing the website for necessary operational processing. You can withdraw
            analytics consent at any time.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Enquiries, purchases and your rights</h2>
          <p className="mt-3">
            Clicking Request a quote takes you to Tail Wagging's contact form with fixed, unsigned
            marketing referral labels. A click is not a submitted or qualified enquiry. Submitted
            contact details are handled by that service, not sent to Agent Shop analytics.{" "}
            <a href="/legal/kit-privacy" className="underline">
              Private-kit purchase data has a separate privacy notice
            </a>
            ; necessary order recovery is independent of analytics consent.
          </p>
          <p className="mt-3">
            Contact us to request access, correction, erasure, restriction or portability where
            applicable, or to object to processing. You may complain to the UK Information
            Commissioner's Office. Withdrawal does not make earlier consented processing unlawful.
            We do not sell enquiry or purchase information.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
