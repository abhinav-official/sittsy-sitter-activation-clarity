# ChatGPT teardown, Phase 1 (Sittsy), 17 Nov 2026
Full text: ChatGPT conversation "Pitch Teardown Summary" (chatgpt.com/c/6afc1afc-2aa4-83ee-930c-1d7e64fd0a98)

## Verdict
Split the concept. The checklist + single eligibility state machine is the product; the demand dashboard is not. Rename: "Sitter Activation Clarity", a pre-activation transparency layer. Measurable claim: "Zero hidden eligibility conditions. Zero contradictory states."

## Accepted changes
1. Demand data demoted to a qualified market-context section: city-level only where Sittsy publishes it, period and geography labelled, requests never equated with bookings or earnings, "No published data" shown where missing (India/Jaipur). Never lead the pitch with demand figures; raw demand before payment likely hurts activation conversion in thin markets.
2. Conditions typed by evidence class: Published (company's own enumeration, with source) / Reported enforcement (seen only in a denial) / Unresolved. The 7-day testimonial deadline is NEVER encoded as a rule; it is flagged as reported-but-unpublished. Unknown is a state, never shown as failed.
3. Conditions have different mechanics, not all countdowns: counters (5 approved testimonials), per-request deadlines (reply within 24h), period measures (calendar open 24 of 30 days), binary gates (no booking, no refund claim during the period; exact semantics flagged unconfirmed).
4. One authoritative eligibility result derived from timestamped events + a versioned policy; every transition carries an audit reason. Terminal states are honest: "all tracked conditions met per the published list" / "not met" / "cannot determine, unresolved conditions exist". Never "eligible" as a legal claim.
5. Checklist lives BEFORE payment and persists after as the tracker: two views of the same state, not two interpretations.
6. The fee is shown as what it is: not published on sittsy.com; amounts appear only in-app. The absence is itself a finding; never display an invented fee.
7. Demo story: one event-driven run (activate, requests arrive, apply/reply, a deadline passes, state changes exactly once, audit trail explains why), plus the centrepiece: a naive-mode toggle that reproduces the documented expired-and-counting-down contradiction, next to proof the single-state model cannot produce it.
8. Pitch traps with this founder (replies personally, legalistic): never "hidden policy", "cheated", "I fixed your refunds", "your demand is weak", or any conversion claim. Frame: one moment in the sitter journey, explored. Research shows gaps between publicly communicated conditions and sitter experience; no claim about which version is legally authoritative.
