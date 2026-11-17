# ChatGPT teardown, Phase 2 (Sittsy model), 17 Nov 2026
Full text: ChatGPT conversation "Pitch Teardown Summary" (chatgpt.com/c/6afc1afc-2aa4-83ee-930c-1d7e64fd0a98)

## Verdict
Do not build as written. Disclosure does not turn an assumption into an authorised rule. Two concrete logic bugs (C7, Day 30 ordering) plus result semantics, the contradiction demo's fairness, and audit design must be fixed first.

## P0 fixes (all accepted)
1. C7: separate the recorded event from the interpretation. A claim inside the period shows CLAIM_RECORDED, POLICY INTERPRETATION UNCONFIRMED; never silently MISSED, never "no effect". Period defined as the exact interval [activation, activation + 30 days) and labelled a prototype convention. Legal note: never imply statutory rights are lost.
2. Three evidence classes in the DATA MODEL, not just labels: PUBLISHED / REPORTED_ENFORCEMENT / UNCONFIRMED_INTERPRETATION. Policy facts and demo assumptions get visibly different treatment everywhere.
3. Result vocabulary: the word ELIGIBLE is banned. Mid-period miss = REQUIREMENT_MISSED (with a plain-language explanation and "confirm with Sittsy"). End states: TRACKED_PUBLISHED_CONDITIONS_MET / TRACKED_REQUIREMENTS_NOT_MET / CANNOT_DETERMINE. Explicit precedence truth table: a confirmed miss stays primary even when unknowns coexist; unknowns block the MET result.
4. Contradiction demo made fair: both naive widgets claim to display the SAME thing, "Refund eligibility": one says EXPIRED (computed from the reported 7-day rule), the other says 23 days remaining (computed from the 30-day interpretation). The corrected model answers CANNOT_DETERMINE with the evidence separated. Principle restated: never let independently maintained interpretations of the same policy determine the same user-facing result.
5. Derivation is a pure function of (event log, policy snapshot, asOf). Audit writes are idempotent, keyed by event/deadline instance + policy version. The 17-entry count survives only as an explained fixture ledger, each entry listed with its trigger.
6. C1 compares exact rationals (5 x applications >= 4 x requests); the denominator is an UNCONFIRMED_INTERPRETATION, and an indeterminate denominator routes to CANNOT_DETERMINE.
7. R1/R2 leave the checklist entirely: a separate "Reported conditions not present in the published list" evidence section.
8. C5 and C6 stay UNRESOLVED (no authoritative MET/MISSED): C5 may show as a product progress indicator, never equated with the promise requirement; C6 has no authoritative event definition.
9. C8 snapshots the full policy at activation: version, exact conditions, fee, currency, timestamp, market.
10. Boundary tests required: reply at deadline minus 1s and plus 1s, duplicate deadline delivery must not double-transition, out-of-order events, timezone change.

## Framing for the pitch
Three separate claims: what Sittsy published / what the prototype assumes / what the event history establishes. Never position as a correction to Sittsy's policy; an exploration of making a multi-condition promise transparent, traceable and internally consistent.
