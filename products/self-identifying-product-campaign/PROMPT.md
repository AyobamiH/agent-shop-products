# Self-identifying product campaign

A production prompt for designing evidence-backed marketing campaigns that help the right people recognise their own current problem before presenting a relevant product, service or diagnostic next step.

This prompt is based on a working multi-product campaign registry used for founder technical rescue, small-business websites, governed AI operations, coding-agent evidence and tax-lien research workflows. It treats self-identification as a structured campaign model rather than a disguised sales pitch.

## Requirements

- A real product, service or diagnostic offer.
- A defined audience with meaningful exclusions.
- Observable problem signals that can be described without private data.
- Evidence supporting every factual product claim.
- A useful next step that may be taken without pressure.
- A channel where the audience already discusses the problem.
- A way to distinguish attention, recognition and qualification.

Do not invent customer results, guaranteed outcomes, urgency, superiority claims or personal knowledge about the reader. Do not generate mass cold outreach. The content must remain useful even when the reader never buys.

## Prompt: build a self-identifying product campaign

Paste everything below the line into an AI assistant. Replace bracketed business, product, audience and channel details where required, but preserve the evidence, claim, audience and anti-pressure rules.

---

Build a production-grade self-identifying product campaign for this business.

Use this flow:

```text
PRODUCT TRUTH
  → AUDIENCE
  → OBSERVABLE SIGNAL
  → CURRENT PROBLEM
  → PRACTICAL CONSEQUENCE
  → EVIDENCE
  → USEFUL INSIGHT
  → OPTIONAL PRODUCT CONNECTION
  → APPROPRIATE NEXT STEP
  → RESPONSE QUALIFICATION
  → LEARNING
```

The campaign should help the appropriate person think:

```text
“That describes what I am dealing with.”
```

It must not pressure them into thinking:

```text
“I am being pushed through a hidden sales funnel.”
```

## Objective

Create a reusable campaign system that:

1. defines what the product genuinely does;
2. identifies who can benefit now;
3. describes observable symptoms rather than assumed identities;
4. connects those symptoms to a practical consequence;
5. teaches something useful before mentioning the offer;
6. uses only evidence-backed claims;
7. lets the reader choose whether to respond;
8. routes qualified interest to a clear product or paid next step;
9. avoids treating views, likes or follows as sales conversion;
10. learns from real responses without changing truth to chase attention.

## What self-identification means

Self-identification is not:

- pretending to know the reader personally;
- diagnosing people from one post;
- fear-based copy;
- hidden urgency;
- engineered insecurity;
- shame;
- mass cold outreach;
- vague advice followed by a hard pitch;
- listing every feature;
- disguising a sales message as neutral help.

Self-identification is:

- describing a specific observable situation;
- explaining why it matters;
- showing the practical consequence;
- offering one useful way to assess it;
- connecting it to a credible next step;
- allowing the reader to opt in.

The reader owns the identification.

## Versioned campaign registry

Create:

```text
marketing/
  registry.v1.json
  evidence/
  examples/
  responses/
  reports/
```

Use a registry equivalent to:

```ts
interface MarketingRegistry {
  schemaVersion: "1.0.0";
  registryVersion: string;
  updatedAt: string;
  products: ProductRecord[];
  audiences: AudienceRecord[];
  identitySignals: IdentitySignal[];
  problemOutcomes: ProblemOutcome[];
  claims: ClaimRecord[];
  evidence: EvidenceRecord[];
  campaigns: CampaignRecord[];
  strategies: StrategyRecord[];
  callsToAction: CallToActionRecord[];
  channelPolicies: ChannelPolicy[];
  approvals: ApprovalRecord[];
}
```

Every record must be versioned and lifecycle-controlled:

```ts
interface LifecycleRecord {
  id: string;
  version: string;
  status: "draft" | "active" | "paused" | "retired";
  createdAt: string;
  updatedAt: string;
}
```

Do not generate campaign truth from unversioned chat notes.

## Product truth

Define each product or service:

```ts
interface ProductRecord extends LifecycleRecord {
  name: string;
  category:
    | "product"
    | "service"
    | "diagnostic"
    | "consulting"
    | "software"
    | "community";
  currentState:
    | "concept"
    | "prototype"
    | "active"
    | "marketable"
    | "commercially_ready";
  targetAudienceIds: string[];
  allowedCampaignTypes: CampaignType[];
  claimIds: string[];
  evidenceIds: string[];
  defaultCallToActionId: string;
  minimumCooldownHours: number;
  dailyPublicationCap: number;
}
```

Record only current truth.

Do not claim:

```text
used by thousands
industry-leading
proven to increase revenue
guaranteed to save time
```

unless active evidence supports the exact statement.

A repository proves existence. It does not prove adoption, customer outcomes or superiority.

## Audience

Define:

```ts
interface AudienceRecord extends LifecycleRecord {
  name: string;
  description: string;
  currentContext: string[];
  exclusions: string[];
  channels: string[];
  buyingContext: string[];
}
```

A useful audience is narrow enough to recognise a real situation.

Good:

```text
Founders with an active product whose deployment or maintenance friction is
slowing a launch, customer commitment or commercial deadline.
```

```text
Small-business owners whose website receives visitors but makes the next useful
action difficult to understand or complete.
```

Too broad:

```text
entrepreneurs
business owners
people who need websites
anyone interested in AI
```

Exclusions are mandatory.

Examples:

- hobby projects without business intent;
- abandoned products;
- people seeking guaranteed financial returns;
- teams seeking permission bypasses;
- organisations whose problem is already solved;
- readers for whom the proposed next step is inappropriate.

## Observable identity signals

Define:

```ts
interface IdentitySignal extends LifecycleRecord {
  audienceId: string;
  signal: string;
  evidenceRequirement: string;
  observableIndicators: string[];
  prohibitedInferences: string[];
}
```

Good signal:

```text
Your product is live enough to matter, but deployment, reliability or
maintenance friction is slowing the next commercial step.
```

Useful indicators:

- releases repeatedly miss a named deadline;
- local and production behaviour differ;
- one person manually restores failed workflows;
- customers hit an unresolved path;
- the team cannot explain production state confidently.

Prohibited inference:

```text
The founder is incompetent.
The team does not care about quality.
The business is failing.
```

Describe the situation, not the person's character.

## Signal evidence

A signal is not eligible merely because it sounds plausible.

Require one or more:

- public product behaviour;
- user-provided facts;
- repository evidence;
- official platform data;
- an attributable support request;
- an observed workflow;
- a current diagnostic result;
- a clearly labelled hypothetical example.

For a broad public post, describe a common pattern without claiming a specific person has it.

For an identified business or founder, do not mention a problem unless the evidence is public, attributable and appropriate to discuss.

## Problem and outcome mapping

Define:

```ts
interface ProblemOutcome extends LifecycleRecord {
  problem: string;
  practicalConsequences: string[];
  usefulOutcome: string;
  productIds: string[];
  disallowedClaims: string[];
}
```

Good problem:

```text
The website makes visitors work too hard to understand the offer or take the
next step.
```

Bad problem:

```text
The website is bad.
```

Good consequence:

- visitors abandon the path;
- enquiries arrive without useful context;
- staff manually answer repeated questions;
- trust falls when the experience breaks.

Good useful outcome:

```text
A clearer and more accessible route to an appropriate enquiry.
```

Do not turn that outcome into a guaranteed commercial result.

## Claims and evidence

Define:

```ts
interface ClaimRecord extends LifecycleRecord {
  productId: string;
  text: string;
  evidenceIds: string[];
  risk: "low" | "medium" | "high";
  allowedChannels: string[];
  prohibitedTransformations: string[];
}
```

```ts
interface EvidenceRecord extends LifecycleRecord {
  type:
    | "source_code"
    | "repository"
    | "runtime_readback"
    | "test_report"
    | "customer_evidence"
    | "public_document"
    | "screenshot"
    | "metric";
  source: string;
  capturedAt: string;
  summary: string;
  supportsClaimIds: string[];
  freshnessDays: number | null;
}
```

Every factual statement must resolve to active evidence.

When evidence supports:

```text
The product contains a deterministic audit command.
```

do not transform it into:

```text
The product makes every coding agent reliable.
```

## Claim ladder

Use the least ambitious claim supported by evidence:

```text
existence
  → implemented capability
  → verified capability
  → repeated operational result
  → customer outcome
  → comparative superiority
```

Do not jump levels.

Examples:

- repository exists → existence;
- code and tests show a feature → implemented capability;
- independent runtime proof passes → verified capability;
- several dated runs pass → repeated operational result;
- attributable client evidence → customer outcome;
- controlled comparison → comparative claim.

Most campaign claims should remain in the first four levels.

## Campaign types

Support:

```ts
type CampaignType =
  | "self_identification"
  | "problem_education"
  | "practical_diagnostic"
  | "proof_and_evidence"
  | "product_update"
  | "founder_observation"
  | "research_insight"
  | "community_discussion";
```

Self-identification may be primary when the commercial goal is to help relevant people recognise their need.

It must not dominate the entire content portfolio.

## Campaign record

```ts
interface CampaignRecord extends LifecycleRecord {
  productId: string;
  name: string;
  type: CampaignType;
  audienceId: string;
  identitySignalIds: string[];
  problemOutcomeIds: string[];
  strategyId: string;
  channelIds: string[];
  callToActionId: string;
  claimIds: string[];
  evidenceIds: string[];
  priority: number;
  minimumCooldownHours: number;
  dailyCap: number;
}
```

Validate:

- audience matches product;
- signals belong to audience;
- problems map to product;
- strategy allows campaign type;
- CTA is appropriate;
- claims have evidence;
- channel policy allows the format;
- approval is current.

## Strategy: self-identification without pressure

Define:

```ts
interface StrategyRecord extends LifecycleRecord {
  name: string;
  objective: string;
  allowedCampaignTypes: CampaignType[];
  requiredElements: string[];
  prohibitedPatterns: string[];
}
```

Use:

```text
Name:
Self-identification without pressure

Objective:
Help the appropriate person recognise a current problem and a useful next step.

Required elements:
- one observable signal;
- one practical consequence;
- one useful insight;
- one evidence-backed connection;
- one optional next step.

Prohibited patterns:
- false urgency;
- guarantees;
- unverifiable superiority;
- hidden sales language;
- mass cold outreach;
- shame;
- fabricated scarcity;
- invented customer outcomes.
```

## Post architecture

Use this shape:

```text
1. Observable moment
2. Pattern
3. Consequence
4. Useful distinction
5. Practical check
6. Optional next step
```

### Observable moment

Good:

```text
Your product works locally, but every production change still feels like a
small emergency.
```

Avoid:

```text
Are you a struggling founder?
```

### Pattern

Explain the structure:

```text
That often means deployment knowledge lives in one person's memory rather than
in a repeatable workflow.
```

Use cautious language when causation is not proven.

### Consequence

```text
The problem is not only slower releases. It becomes difficult to know whether a
fix is safe, repeatable or dependent on the person who performed it.
```

### Useful distinction

```text
A successful deployment command is not the same as verified production state.
```

### Practical check

```text
Could another team member reproduce the release and verify the live result
using only the repository and runbook?
```

### Optional next step

```text
That is the kind of delivery friction I handle through a bounded technical
diagnostic.
```

The post must remain useful without the final sentence.

## Copy rules

Use:

- direct language;
- specific nouns;
- observable behaviour;
- short explanations;
- honest uncertainty;
- one main idea;
- one next step.

Avoid:

- generic motivation;
- rhetorical-question chains;
- “game-changing”;
- “unlock”;
- “revolutionise”;
- “skyrocket”;
- fake quotations;
- unsupported percentages;
- universal claims;
- melodramatic pain;
- several CTAs;
- feature dumping.

Do not write every post in the same cadence.

## Product mention timing

The product may appear:

- after the useful insight;
- inside a proof example;
- in the final optional next step;
- in a response after the reader asks.

Do not lead with the product name unless the post is explicitly a product update or proof post.

## CTA ladder

Define:

```ts
interface CallToActionRecord extends LifecycleRecord {
  type:
    | "none"
    | "reflection"
    | "conversation"
    | "resource"
    | "diagnostic"
    | "demo"
    | "purchase";
  text: string;
  qualificationRequired: boolean;
  paid: boolean;
  nextState: string;
}
```

Use the lowest-pressure appropriate CTA.

Reflection:

```text
Worth checking before the next release.
```

Conversation:

```text
I would be interested to know how your team currently verifies the live result.
```

Resource:

```text
The repository includes the exact audit contract.
```

Diagnostic:

```text
For a live product with this problem, the next step is a bounded deployment
diagnostic rather than another generic rebuild.
```

Use a paid CTA only after the person has identified the problem and the service fits.

Do not put invoice language inside a general public post.

## Commercial path

Keep the commercial path separate:

```text
public post
  → relevant response
  → clarification
  → qualification
  → bounded diagnostic
  → scoped proposal
  → invoice
  → scheduled work
```

Each transition needs a condition.

Useful qualification:

- a current system exists;
- the problem affects a commercial objective;
- the buyer can provide access or evidence;
- the work fits the service boundary;
- the buyer understands implementation is paid.

Do not perform the full diagnosis publicly to prove expertise.

Provide enough value to establish understanding, then preserve detailed work for the paid scope.

## Response classification

Use:

```ts
type ResponseState =
  | "not_relevant"
  | "curious"
  | "self_identified"
  | "problem_confirmed"
  | "qualified"
  | "needs_paid_diagnostic"
  | "not_a_fit"
  | "follow_up_later";
```

```ts
interface CampaignResponse {
  responseId: string;
  campaignId: string;
  contentId: string;
  channelId: string;
  observedAt: string;
  state: ResponseState;
  readerStatedProblem: string | null;
  evidenceProvided: string[];
  nextAction: string;
  consentForDirectContact: boolean;
}
```

Do not classify:

- a like as qualified;
- a follow as a lead;
- a view as intent;
- a generic compliment as problem confirmation;
- silence as rejection.

## Public replies

A public reply should:

1. acknowledge the stated situation;
2. ask one useful clarifying question when needed;
3. avoid diagnosing an unseen system;
4. avoid exposing private details;
5. avoid giving away the full paid implementation;
6. offer the appropriate next step.

Good:

```text
That sounds fixable. The useful distinction is whether the failure is in the
deployment path or only in provider readback. I would need the exact error and
current workflow before saying which.
```

Avoid a value-free reply such as:

```text
DM me, I can fix it.
```

## Direct messages

Use direct messages only when:

- the person asks;
- the public thread would expose sensitive details;
- a paid diagnostic is appropriate;
- channel norms support it.

A first message should include:

- reference to the public context;
- information needed;
- boundary between initial review and paid work;
- the next process step.

Do not send mass unsolicited messages from weak signals.

## Campaign lanes

### Founder technical rescue

- require evidence of an active product;
- focus on one demonstrable bottleneck;
- link it to delivery, trust or commercial readiness;
- avoid insulting “vibe coding”;
- distinguish an experiment from a maintainable product;
- offer a bounded diagnostic before a broad rebuild.

Signals may include:

- deployment inconsistency;
- missing production verification;
- unclear source of truth;
- unreproducible environment;
- brittle authentication;
- manual recovery;
- data-policy uncertainty;
- confusing customer paths.

### Small-business websites

- describe the visitor journey;
- focus on clarity, speed, accessibility or enquiry friction;
- avoid “your website is losing you money” without evidence;
- provide one practical check;
- connect to a diagnostic or improvement service.

Useful checks:

- Can a first-time visitor identify the service and area served?
- Is the primary next action visible without guessing?
- Does the form request only useful information?
- Does the mobile route work?
- Are performance and accessibility failures material?

### Technical products

- lead with a recognisable workflow failure;
- teach one engineering distinction;
- show an evidence-backed implementation pattern;
- link to source or documentation;
- use repository or diagnostic CTAs before sales CTAs.

### Research products

- focus on fragmented inputs, provenance and decision traceability;
- avoid financial guarantees;
- separate tooling from investment advice;
- show how sources remain attached to decisions;
- use conversation or product-proof CTAs.

## Channel policy

Define:

```ts
interface ChannelPolicy extends LifecycleRecord {
  channelId: string;
  allowedCampaignTypes: CampaignType[];
  maximumLength: number | null;
  supportsLinks: boolean;
  supportsImages: boolean;
  supportsThreads: boolean;
  supportsDirectMessages: boolean;
  hashtagLimit: number;
  prohibitedPatterns: string[];
}
```

Adapt the idea to channel behaviour. Do not paste identical copy everywhere.

### Short-form text

Use:

- one sharp signal;
- one distinction;
- one practical check;
- an optional CTA.

### Community forum

Use:

- context;
- explanation;
- evidence;
- an open question;
- no immediate hard sell.

### Professional network

Use:

- operational consequence;
- business relevance;
- practical lesson;
- evidence;
- restrained CTA.

### Visual platform

The visual should communicate one signal or distinction.

The caption should add context rather than repeat the image.

## Generation input

```ts
interface CampaignGenerationInput {
  registryVersion: string;
  productId: string;
  campaignType: CampaignType;
  channelIds: string[];
  numberOfIdeas: number;
  businessObjective: string;
  existingContentHashes: string[];
  recentTopics: string[];
  approvedEvidenceIds: string[];
}
```

Reject when:

- product is inactive;
- campaign type is disallowed;
- audience is inactive;
- signal or problem is missing;
- evidence does not support claims;
- CTA exceeds the relationship stage;
- channel policy is missing.

## Campaign idea output

```ts
interface CampaignIdea {
  ideaId: string;
  productId: string;
  audienceId: string;
  identitySignalId: string;
  problemOutcomeId: string;
  campaignType: CampaignType;
  angle: string;
  readerRecognitionMoment: string;
  usefulInsight: string;
  practicalCheck: string;
  claimIds: string[];
  evidenceIds: string[];
  callToActionId: string;
  channelPlan: Array<{
    channelId: string;
    format: string;
    copy: string;
    alternateOpening: string;
    mediaBrief: string | null;
  }>;
  riskFlags: string[];
  validation: CampaignValidation;
}
```

## Validation

```ts
interface CampaignValidation {
  passed: boolean;
  checks: Array<{
    id: string;
    status: "passed" | "failed" | "warning";
    evidence: string[];
  }>;
}
```

Require:

- active audience;
- signal belongs to audience;
- problem maps to product;
- claim evidence resolves;
- evidence is fresh enough;
- no assumed private facts;
- no guarantee;
- no false urgency;
- no shame;
- no superiority claim;
- no hidden mass-outreach language;
- CTA matches the relationship stage;
- copy contains a useful insight;
- copy remains useful without product mention;
- channel limits pass;
- exact duplicate is absent;
- topic repetition is acceptable.

Fail closed on failed checks.

## Duplicate and fatigue control

Hash campaign meaning, not only exact text.

Include:

```text
productId
audienceId
identitySignalId
problemOutcomeId
campaignType
angle
claimIds
CTA type
```

Prevent:

- exact duplicate copy;
- repeated rewrites of one signal;
- constant “if this is you” openings;
- the same CTA every day;
- one product dominating;
- daily pain-based angles.

Use cooldowns for product, audience, signal, problem, CTA and campaign type.

## Portfolio balance

Include:

```text
self-identification
problem education
practical diagnostic
proof and evidence
product update
research insight
community discussion
```

Set a maximum share for self-identification content.

Example:

```text
maximumSelfIdentificationShare = 0.40
```

This prevents the account from making every post about the reader's pain.

## Learning loop

After publication, record:

- channel;
- campaign;
- signal;
- problem;
- CTA;
- meaningful responses;
- qualification states;
- objections;
- confusion;
- incorrect assumptions;
- evidence gaps.

Do not optimise only for views.

Useful signals:

- people accurately describe the problem;
- relevant people ask practical questions;
- a reader provides evidence;
- the next step is understood;
- qualified diagnostics begin;
- irrelevant responses fall.

Do not make claims more dramatic because dramatic copy receives engagement.

## Metrics

Separate:

```text
attention
recognition
conversation
qualification
commercial outcome
```

Attention:

- views;
- reach;
- saves;
- link clicks.

Recognition:

- “this is what is happening” responses;
- people restating the problem accurately;
- practical follow-up questions.

Conversation:

- substantive replies;
- requested direct messages;
- resource discussions.

Qualification:

- current problem confirmed;
- relevant system exists;
- commercial consequence stated;
- evidence available;
- decision-maker involved.

Commercial outcome:

- paid diagnostic;
- proposal;
- invoice;
- project won;
- product subscription.

Do not attribute revenue to a post without evidence connecting the stages.

Unavailable metrics remain unavailable, not zero.

## Required tests

### Registry tests

Test:

- missing audience;
- inactive product;
- orphan signal;
- problem not linked to product;
- stale evidence;
- unsupported claim;
- expired approval;
- prohibited campaign type;
- inappropriate CTA;
- missing channel policy.

### Copy tests

Test:

- false urgency;
- guarantee;
- unsupported percentage;
- shame language;
- superiority claim;
- assumed private fact;
- hidden pitch before value;
- feature dump;
- no useful insight;
- generic audience;
- hard CTA on first contact;
- implied customer outcome.

### Portfolio tests

Test:

- semantic duplicate;
- product cooldown;
- signal cooldown;
- CTA fatigue;
- self-identification share exceeded;
- one product dominating;
- alternate campaign type selected.

### Response tests

Test:

- like is not a lead;
- compliment is not qualification;
- reader states a matching problem;
- evidence is provided;
- paid diagnostic is appropriate;
- reader is not a fit;
- direct-message consent is absent;
- follow-up date is recorded.

## Reproducible fixture

Create:

```text
Product:
ReleaseCheck

Audience:
Small engineering teams with an active web application.

Observable signal:
Releases appear successful, but nobody can prove production state without
asking the person who deployed.

Problem:
Deployment knowledge is held in memory rather than a repeatable evidence path.

Useful outcome:
A release workflow another team member can reproduce and verify.

Supported claim:
ReleaseCheck provides a structured local deployment-readiness checklist.

Evidence:
Repository source and passing fixture tests.

CTA:
Read the checklist or request a bounded deployment diagnostic.
```

Generate:

1. one short-form self-identification post;
2. one professional-network version;
3. one community-forum version;
4. one proof-and-evidence follow-up;
5. one practical diagnostic post.

Verify:

- the audience can recognise the situation;
- no guarantee is made;
- the product is not mentioned before value in every version;
- CTA pressure matches the channel;
- content is semantically distinct;
- claims resolve to evidence;
- the self-identification post remains useful after removing the CTA.

## Example shape

```text
A deployment can finish successfully and still leave the team unable to answer
a basic question: what is actually running in production?

That becomes visible when every release needs the same person to explain the
environment, check the provider dashboard and decide whether the result is safe.

The practical test is simple: could another team member reproduce the release
and verify the live state using only the repository and runbook?

If not, the missing piece is probably not another deployment command. It is a
repeatable evidence path.

That is the kind of gap a bounded deployment diagnostic should clarify before a
team adds more automation.
```

## Completion contract

Do not claim completion until:

- product truth is versioned;
- audience and exclusions are explicit;
- signals are observable and non-judgmental;
- every signal has an evidence requirement;
- problems and outcomes map to products;
- every claim resolves to evidence;
- strategy prohibits pressure and fabricated claims;
- CTA states form a clear ladder;
- public content remains useful without a sale;
- detailed implementation work remains inside paid scope;
- response states distinguish attention from qualification;
- channel policies are explicit;
- duplicate and fatigue controls pass;
- the portfolio is not dominated by self-identification;
- metrics separate attention, recognition, qualification and revenue;
- the fixture passes validation;
- rejected content and reasons are reported;
- no mass unsolicited outreach is generated.

Final report:

```text
Registry version:
Product:
Audience:
Exclusions:
Identity signal:
Problem:
Useful outcome:
Claims:
Evidence:
Campaign type:
Channels:
Content ideas:
CTA:
Qualification path:
Validation:
Rejected ideas:
Risk controls:
Portfolio balance:
Commercial next step:
Remaining approval boundaries:
```

Do not report a campaign as evidence-backed when claims, signals or outcomes cannot be traced to active records.
