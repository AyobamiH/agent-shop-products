/**
 * Authoritative distinction between existing public discovery, not-yet-issued
 * premium licences, and separately scoped professional implementation.
 * Never promote a proposed offer to an active SKU without commercial evidence.
 */
export const COMMERCIAL_PATHS = [
  {
    id: "public-reference",
    title: "Public prompt or skill reference",
    availability: "available_reference",
    description: "Inspect the published problem, requirements and limitations before using an openly accessible source.",
    actionPath: "/shop",
    actionLabel: "Browse current source-backed capabilities",
  },
  {
    id: "execution-kit",
    title: "Enhanced private execution kit",
    availability: "not_for_sale",
    description: "A future distinct deliverable would need private reusable assets, supported version, acceptance tests, recovery notes and an explicit licence. It is not currently available to purchase.",
  },
  {
    id: "workflow-bundle",
    title: "Curated workflow bundle",
    availability: "not_for_sale",
    description: "A future bundle would need documented interoperability, all included versions, a deliverable, support scope and commercial terms. No bundle price or checkout is active.",
  },
  {
    id: "professional-integration",
    title: "Professional integration and repair",
    availability: "quote_first",
    description: "A separate provider can assess a bounded repository fix, workflow integration or verification task. Feasibility, authority and price are agreed before work or payment.",
    actionPath: "/integration-services",
    actionLabel: "Request a scoped implementation quote",
  },
] as const;

export const SOLUTION_TRACKS = [
  {
    id: "verify-agent-work",
    title: "An agent says the fix is done. How do you know?",
    audience: "Developers reviewing coding-agent work",
    symptom:
      "A tool returned success or a pull request appeared, but the live route, the relevant tests or the claimed effect disagree with the summary.",
    checks: [
      "Identify the exact repository revision and the specific result being claimed.",
      "Inspect independent tests and public runtime evidence without mutating the system under review.",
      "Separate an attempted action, accepted change, deployed release and verified outcome.",
    ],
    productSlugs: [
      "evidence-first-live-diagnostic-repair",
      "read-only-production-reconnaissance",
      "state-transition-evidence-contract",
      "outside-in-agent-crawl-verification",
    ],
    scopingQuestion: "Which one claimed outcome can be independently checked against a specific revision?",
  },
  {
    id: "install-agent-integration",
    title: "The tool is listed, but the integration still will not work",
    audience: "Agent operators selecting external integrations",
    symptom:
      "A capability appears in a catalogue or a plugin is connected, but the required provider account, permission, endpoint or action is unavailable.",
    checks: [
      "Separate advertised names from authenticated connection, granted permissions and proven execution.",
      "Establish the allowed environment, input contract, owner authorisation and recovery path.",
      "Confirm a small real operation and its readback before broadening automation.",
    ],
    productSlugs: [
      "capability-surface-reconciliation",
      "staged-mcp-plugin-activation",
      "production-agent-operating-files",
      "temporary-authority-bridge-lifecycle",
    ],
    scopingQuestion: "Which capability, provider permission and concrete operation fail today?",
  },
  {
    id: "recover-autonomous-work",
    title: "Recurring agent jobs duplicate effects or lose their place",
    audience: "Teams operating scheduled or long-running agent workflows",
    symptom:
      "A restarted process repeats a provider write, a dead run holds a lease, or a scheduler reports completion without a durable outcome receipt.",
    checks: [
      "Find the canonical work item, lease owner and durable idempotency identity.",
      "Read back external consequences before any retry or lease recovery.",
      "Define the observable completed state and preserve unresolved effects as unknown.",
    ],
    productSlugs: [
      "stale-lease-recovery-and-single-flight",
      "durable-business-outcome-reconciliation",
      "deterministic-social-publication",
      "measurement-gated-learning-admission",
    ],
    scopingQuestion: "Which previously attempted effect could be duplicated during recovery?",
  },
  {
    id: "subcontract-agent-task",
    title: "An agent should hand the job to an experienced human",
    audience: "Agent builders and business owners needing bounded technical work",
    symptom:
      "A repository patch, website repair or automation task exceeds the agent's capability or current authority. An unsupervised retry risks a broader effect.",
    checks: [
      "Describe one requested result, accessible source and acceptance criterion.",
      "Separate enquiry receipt, quote, owner approval, payment, implementation and final verification.",
      "Grant only the repository or provider authority required after the scope is accepted.",
    ],
    productSlugs: [
      "agent-subcontracting-commercial-handoff",
      "bounded-solo-maintainer-release",
      "evidence-backed-open-source-contribution",
    ],
    scopingQuestion: "What is the smallest deliverable and independent acceptance check worth commissioning?",
  },
] as const;
