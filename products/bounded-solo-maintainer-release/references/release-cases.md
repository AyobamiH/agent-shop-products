# Release calibration cases

These cases test decision-making; they do not authorise a real release.

| Evidence | Correct handling |
| --- | --- |
| CI passes; reviewer absent; no owner-authorised exception | Preserve the applicable review gate |
| Owner explicitly approves one owned release; narrow policy exception is recorded; required checks pass | Use the normal guarded release path after capturing rollback state |
| Two accounts belong to the same maintainer | Do not claim independent non-author review |
| Technical source review passes; formal scan tooling was unavailable | Report manual technical review and its scope, not a completed formal scan |
| Merge succeeds but deployed revision is still earlier | Record merge; deployment acceptance is pending |
| Deployment and native scans pass; review cases only defined; no recording | Record release and scan success; live cases and walkthrough remain pending |
| Verifier release exception is approved | Do not infer authority to modify systems the verifier inspects |
| Runtime readback is ambiguous after a timeout | Reconcile state before repeating the mutation |

A policy exception changes the applicable release rule. It does not turn the author into an independent reviewer.
