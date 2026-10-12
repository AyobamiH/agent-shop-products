export const POLICY_VERSION = "2026-10-12";
export const POLICY_STATUS = "Approved pre-launch terms; checkout remains closed";
export const SELLER = "Ayobami John Haastrup, sole trader trading as TAIL-WAGGING WEBSITES DESIGN FACTORY NORTHAMPTON";
export const policies = {
  "kit-terms": {
    title: "Private kit purchase terms",
    sections: [
      ["Seller and contact", SELLER + ". Public location: Northampton, Northamptonshire, UK, NN4 6LZ. Telephone: 07402342694. A customer-facing business address and monitored purchase-support email must be verified before sales open."],
      ["Availability", "This document describes the approved launch terms. It is not an invitation to pay while checkout is closed. A purchase requires an available offer and the complete price displayed in Stripe Checkout."],
      ["Your purchase", "Private Production Agent Operating Kit v2026.10.1 is a small original reference implementation supplied as a versioned ZIP, with signed-grant examples, 17 Node verification cases and a failure/rollback matrix. It is not a turnkey agent, installation or professional integration."],
      ["Price", "The intended entry amount is £9 once, without a subscription or automatic renewal. Applicable tax and the complete payable amount must be shown before payment. Tax treatment is being verified before launch."],
      ["Delivery and recovery", "Download access is granted after verified payment and a durable entitlement. A browser success redirect is not proof of payment. Keep the order reference. If access fails or you change browser, contact the seller by telephone for controlled recovery or a refund; do not pay a second time to recover the same purchase."],
      ["Support and updates", "The purchased version includes 30 days of assistance for download access, archive integrity and reproducing the documented tests. A monitored email route will be published before checkout opens. Custom engineering, production incident response, guaranteed response times and future versions are not included."],
      ["Rights and authority", "The separate kit licence and refund policy form part of these terms. Purchase does not grant repository, provider-account, deployment or billing authority. Review examples and obtain permission before execution. No particular production outcome is guaranteed. Nothing in these terms removes applicable statutory consumer rights."],
    ],
  },
  "kit-licence": {
    title: "Private kit licence",
    sections: [
      ["Licence grant", "After verified payment, the purchasing person or business receives a non-exclusive, perpetual right to inspect, modify and incorporate the original reference examples into its own projects and authorised client projects."],
      ["Redistribution", "Do not redistribute or resell the standalone archive. The licence does not grant rights to third-party skill implementations, tools, provider credentials or services. Public source material keeps its own licence."],
      ["Refunds", "A full refund terminates this commercial licence and further download access. Stop using and delete the purchased private material and copies under your control. Statutory rights remain unaffected."],
      ["Execution", "This is a reference implementation. The buyer must review, adapt and verify it for the intended environment. The licence grants no authority to change a repository, merge, deploy or spend money."],
    ],
  },
  "kit-refunds": {
    title: "Refunds and cancellation",
    sections: [
      ["14-day refund", "Request a full refund within 14 days of payment, including after download. We do not require you to waive cancellation rights to receive the kit. Contact the seller on 07402342694 with your order reference; do not send card details or access tokens."],
      ["Processing", "An accepted refund is issued to the original payment method within 14 days of your request. The payment provider may take additional time to display it. Further downloads and the commercial licence are revoked when the refund is processed."],
      ["Faulty content or failed delivery", "If the archive cannot be delivered, is faulty or is misdescribed, contact the seller for recovery, correction or an appropriate refund. The 14-day voluntary policy does not limit statutory rights."],
    ],
  },
  "kit-privacy": {
    title: "Private kit data and privacy",
    sections: [
      ["Controller", SELLER + ". Contact 07402342694 for purchase-data questions. Checkout remains closed until the customer-facing business address and monitored support email are ready."],
      ["Data used for fulfilment", "The commerce service records the offer and terms version, order and payment references, amount, currency, order timestamps and state, hashed download claim, entitlement and download state, processed webhook references and refund state. These records support contract delivery, recovery, fraud prevention and refunds."],
      ["Payment and hosting", "Stripe handles payment and billing information on its hosted checkout. Agent Shop does not collect full card details. Cloudflare hosts the service, stores private kit files and order records, and processes operational request logs. These providers process data under their applicable terms and privacy notices."],
      ["Browser storage", "This checkout uses session storage for the order reference and secret download claim. The claim provides access to the order: do not share it. A success URL alone cannot grant access. Closing the browser can remove that claim; contact the seller for recovery."],
      ["Retention and your rights", "Order, refund and security records are retained only as needed for fulfilment, accounting, legal obligations and resolving disputes. The specific retention schedule and monitored contact route must be completed before launch. You may request access, correction or erasure where applicable, and complain to the UK Information Commissioner's Office. We do not sell purchase information."],
    ],
  },
} as const;
export type PolicySlug = keyof typeof policies;
export function getPolicy(slug: string) {
  return Object.hasOwn(policies, slug) ? policies[slug as PolicySlug] : undefined;
}
export const policyPaths = Object.keys(policies).map((slug) => "/legal/" + slug);
