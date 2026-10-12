import { SUPPORT_EMAIL } from "../../lib/contact";

export const POLICY_VERSION = "2026-10-12.2";
export const SELLER = "Ayobami John Haastrup, sole trader trading as TAIL-WAGGING WEBSITES DESIGN FACTORY NORTHAMPTON";
export const policies = {
  "kit-terms": {
    title: "Private kit purchase terms",
    sections: [
      ["Seller and contact", SELLER + ". Public location: Northampton, Northamptonshire, UK, NN4 6LZ. Telephone: 07402342694. Email: " + SUPPORT_EMAIL + "."],
      ["Availability", "Current availability is shown on the private kits page. Review the complete price in Stripe Checkout before making a purchase."],
      ["Your purchase", "Private Production Agent Operating Kit v2026.10.1 is a small original reference implementation supplied as a versioned ZIP, with signed-grant examples, 17 Node verification cases and a failure/rollback matrix. It is not a turnkey agent, installation or professional integration."],
      ["Price", "The planned price is £9 one-off, without a subscription or automatic renewal. The complete payable amount, including any applicable tax, is shown before payment."],
      ["Delivery and recovery", "Download access becomes available after payment is confirmed. Save the purchase record provided on your order page before downloading the kit. It contains your order reference, payment total and the terms for your purchase. If your download is unavailable or you change browser, email or telephone us for help recovering access or requesting a refund. Do not pay again to recover the same purchase."],
      ["Support and updates", "The purchased version includes 30 days of assistance for download access, archive integrity and reproducing the documented tests. Email " + SUPPORT_EMAIL + " with your order reference for assistance. Custom engineering, production incident response, guaranteed response times and future versions are not included."],
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
      ["14-day refund", "Request a full refund within 14 days of payment, including after download. We do not require you to waive cancellation rights to receive the kit. Email " + SUPPORT_EMAIL + " or call 07402342694 with your order reference. Do not send card details or access tokens."],
      ["Processing", "An accepted refund is issued to the original payment method within 14 days of your request. The payment provider may take additional time to display it. Further downloads and the commercial licence are revoked when the refund is processed."],
      ["Faulty content or failed delivery", "If the archive cannot be delivered, is faulty or is misdescribed, contact the seller for recovery, correction or an appropriate refund. The 14-day voluntary policy does not limit statutory rights."],
    ],
  },
  "kit-privacy": {
    title: "Private kit data and privacy",
    sections: [
      ["Controller", SELLER + ". For purchase-data questions, email " + SUPPORT_EMAIL + " or call 07402342694."],
      ["Data used for fulfilment", "We record what you purchased, the applicable terms, payment and order references, amount and currency, order dates, payment confirmation, download access and refund status. These records support delivery, access recovery, fraud prevention and refunds."],
      ["Payment and hosting", "Stripe handles payment and billing information on its hosted checkout. Agent Shop does not collect full card details. Cloudflare hosts the service, stores private kit files and order records, and processes operational request logs. These providers process data under their applicable terms and privacy notices."],
      ["Browser storage", "Your browser temporarily stores your order reference and a private access token so you can check your order and download your kit. Do not share the token. Closing the browser may remove it; contact us if you need help recovering access."],
      ["Retention and your rights", "Financial records are kept for at least five years after the 31 January filing deadline for the relevant tax year, and longer where a legal obligation or dispute requires it. We retain the minimum purchase, licence and refund records needed to honour continuing access and prevent refunded access being restored. Technical webhook records are removed after 90 days. Failed checkout attempts that never reached a payment session are removed after 30 days, unless held for investigation. Expired checkout links are removed from completed records after two days. You may request access, correction or erasure where applicable, and complain to the UK Information Commissioner's Office. We do not sell purchase information."],
    ],
  },
} as const;
export type PolicySlug = keyof typeof policies;
export function getPolicy(slug: string) {
  return Object.hasOwn(policies, slug) ? policies[slug as PolicySlug] : undefined;
}
export const policyPaths = Object.keys(policies).map((slug) => "/legal/" + slug);
