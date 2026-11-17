# Sitter Activation Clarity - Phase 2 Model Spec v2 (build-ready)

Prototype: a phone-frame web demo of a pre-activation transparency layer for Sittsy sitters. Two views of one state ("Before you pay" and "Your first 30 days"), an event simulator, and an audit trail.

This v2 supersedes `phase2-model.md` (v1). It applies every P0 fix from `chatgpt-teardown-phase2.md`. Facts come only from `claims-sheet.md` (Phase 1 research, 17 Nov 2026). Where Sittsy's published text does not settle a question, this spec says so, classifies the gap, and defines a display behaviour that decides nothing on Sittsy's behalf.

The framing, fixed for the whole prototype: three separate claims, never merged.
1. What Sittsy published.
2. What this prototype assumes (labelled, on screen).
3. What the event history establishes.

This prototype is an exploration of making a multi-condition promise transparent, traceable and internally consistent. It is never positioned as a correction to Sittsy's policy.

---

## 0. What changed from v1 (summary)

| # | v1 | v2 |
|---|---|---|
| 1 | Evidence classes were display labels on conditions only. | Three evidence classes are in the DATA MODEL (section 1). Every condition AND every interpretation carries one; policy facts and prototype assumptions are stored, rendered and audited differently. |
| 2 | C7: an in-period claim set UNKNOWN and was described as having "no effect" on anything else. | C7 redesigned (section 3.7). The claim event is always recorded; inside the period it produces the state CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED plus an unresolved flag. It never derives MISSED, and it is never described as changing nothing: the flag feeds the period-end result. |
| 3 | Overall labels included "All tracked conditions met (published list)" and a mid-period "Not met". | ELIGIBLE and its cognates are banned everywhere. States: PRE_ACTIVATION, NO_PROMISE, IN_PROGRESS, REQUIREMENT_MISSED, and at period end TRACKED_PUBLISHED_CONDITIONS_MET / TRACKED_REQUIREMENTS_NOT_MET / CANNOT_DETERMINE, resolved by the explicit precedence truth table in section 5.3. |
| 4 | R1/R2 sat in the condition list as records C-adjacent to the checklist. | R1/R2 are out of the checklist entirely: a separate evidence section, "Reported conditions not present in the published list" (section 3.9). They are not conditions, not cards in the checklist, and not inputs to derivation. |
| 5 | C5 derived MET/MISSED; C6 derived MET/MISSED. | C5 and C6 are UNRESOLVED conditions (section 3.5, 3.6). They render progress and facts, never an authoritative MET or MISSED. Their unresolved status feeds CANNOT_DETERMINE at period end unless a confirmed miss already decides the result. Consequence, stated plainly: with the evidence available on 17 Nov 2026, TRACKED_PUBLISHED_CONDITIONS_MET is not reachable, because C5 and C6 have no authoritative definitions. The reachable end states are TRACKED_REQUIREMENTS_NOT_MET and CANNOT_DETERMINE. |
| 6 | C1 compared X/Y >= 0.80 as a float at period end; the denominator was a modelling choice mentioned in a note. | C1 compares exact rationals: MET iff 5 x applications >= 4 x requests (section 3.1). The denominator definition is an UNCONFIRMED_INTERPRETATION shown on screen. An indeterminate denominator (zero requests) routes the result to CANNOT_DETERMINE. C2 has an explicit event contract (section 4.2): receipt-timestamp clocks, reply = sitter message event, corrections as audited events, withdrawn requests as a listed unresolved case. |
| 7 | Contradiction demo: a countdown widget vs a status flag, two different rule texts, neither labelled as the same quantity. | Redesigned (section 7). BOTH naive widgets are labelled "Refund eligibility". One computes EXPIRED from the reported 7-day rule; the other computes "23 days remaining" from the 30-day interpretation. The corrected panel answers CANNOT_DETERMINE for the same history, with published and reported evidence separated. |
| 8 | Derivation was `derive(eventLog, policy, now)`; audit entries were written on observed change with a hand-counted 17-entry expectation. | Derivation is a pure function `derive(eventLog, policySnapshot, asOf)` (section 5.1). Audit writes are idempotent, keyed by (instance id, policy version) (section 6.1). The demo fixture's ledger is listed entry by entry with its trigger in section 6.2: 23 entries. |
| 9 | C8 read one boolean from the activation payload. | C8 stores a full policy snapshot at activation (section 3.8): version string, the conditions exactly as shown, fee, currency, snapshot timestamp, market. The sitter is tracked against the snapshot they were shown, never against a silently updated live policy. |
| 10 | Demo: claim filed after period end (audit NOTE only); no boundary tests. | Demo revised (section 9): the refund claim moves INSIDE the period (Day 29) so CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED is exercised; explicit timestamps on every step; boundary events included: a reply 1 second before a deadline (R4), a reply 1 second after a deadline (R6), and a duplicate deadline delivery that must not double-transition (step 13). End state follows the truth table. |
| 11 | Demand panel as researched. | Unchanged (section 8). Verified published figures only; Jaipur no-data state kept verbatim. |

---

## 1. Evidence classes (data model)

Every condition record and every interpretation record carries exactly one evidence class. The class is a field in the data, not a rendering decision: it controls whether the item may be evaluated, what vocabulary its status may use, and how it appears in the audit trail.

| Class | Meaning | May be evaluated? | Status vocabulary |
|---|---|---|---|
| PUBLISHED | The item appears in Sittsy's own published enumeration or published company statements, with a source URL recorded in the record. | Yes, as a rule, subject to its interpretations. | Full vocabulary (section 5.2). |
| REPORTED_ENFORCEMENT | The item does not appear in any published text found, but a sitter reports it was enforced against them in a refund denial. Source recorded. | Never. Display only. | NOT_EVALUATED, permanently. |
| UNCONFIRMED_INTERPRETATION | A reading of a published item (or a prototype convention) that the published text does not settle: a rounding rule, a denominator scope, a clock start, an interval convention. | It is not itself evaluated; it constrains how a PUBLISHED condition is computed, and it is shown on screen wherever it affects a number. | n/a (it labels a computation, not a condition). |

Rules that follow from the classes:

1. A condition whose DEFINITION is unpublished (what counts as complete, what counts as a booking) cannot produce an authoritative MET or MISSED even though the condition itself is PUBLISHED. Such a condition is marked UNRESOLVED (C5, C6) and its status vocabulary is restricted (section 5.2).
2. An UNCONFIRMED_INTERPRETATION that makes a denominator, a deadline or a result indeterminate routes the overall result to CANNOT_DETERMINE at period end (section 5.3). It never silently resolves in the sitter's favour or against them.
3. The three classes are visually distinct everywhere they appear: PUBLISHED items carry their source; REPORTED_ENFORCEMENT items sit in their own section (section 3.9); UNCONFIRMED_INTERPRETATION items carry their verbatim on-screen label (section 2).

---

## 2. Interpretations register

Each interpretation below is a record: { id, statement, evidence_class, on-screen label }. Labels marked "verbatim" must be used exactly as written. Most interpretations are UNCONFIRMED_INTERPRETATION; that is the honest state of the published evidence.

| # | Statement | Class | On-screen label (verbatim where given) |
|---|---|---|---|
| I1 | The 30-day period is the half-open interval [activation timestamp, activation timestamp + 30 days). An event exactly at the end instant is outside the period. Whether Sittsy starts the clock at payment, at activation completion, or at a calendar boundary is not published. This interval is a prototype convention. | UNCONFIRMED_INTERPRETATION | "Your 30 days are counted here as the interval from activation to the same time 30 days later. Sittsy has not published the exact start moment or whether the end moment itself counts." |
| I2 | C1 denominator = all `request_received` events with timestamps inside the period, wherever the owner is located. Sittsy has not published whether requests outside the sitter's area count toward the 80%; a company reply ("You are not required to accept a request that is too far away") answers a different question (acceptance, not counting). | UNCONFIRMED_INTERPRETATION | "This tracker counts every request received in your first 30 days toward the 80%. Sittsy has not published whether requests outside your area count." |
| I3 | C1 is evaluated by exact rational comparison at period end: met iff 5 x applications >= 4 x requests. No rounding rule is published; no float is ever compared. | UNCONFIRMED_INTERPRETATION (the comparison method is the prototype's exact-arithmetic choice; the 80% figure itself is PUBLISHED) | "Sittsy has not published how the 80% is rounded. This tracker compares exact counts at day 30: 5 x your applications against 4 x your requests." |
| I4 | Zero-request case: if no requests are received in the period, C1 and C2 have no determinate status. Not published. | UNCONFIRMED_INTERPRETATION | "Sittsy has not published what happens if you receive no requests. This tracker will show Cannot determine rather than guess." |
| I5 | C3 counts cumulative open day-buckets: any 24 of the 30. The published wording ("at least 24 of the 30 days") reads cumulative, but consecutiveness is not confirmed. | UNCONFIRMED_INTERPRETATION | "Counted here as any 24 days out of the 30. Sittsy has not published whether the days must be consecutive." |
| I6 | C4's count is assessed at period end, and reaching 5 mid-period is shown as met because no published rule removes an approved testimonial. Whether testimonials approved BEFORE activation count is not published; this model counts only approvals inside the period. | UNCONFIRMED_INTERPRETATION | "This tracker counts testimonials approved during your first 30 days. Sittsy has not published whether testimonials you already had count." |
| I7 | "Profile complete" has no published field list. Completeness is a boolean reported by the account (activation payload, then profile events). Whether a mid-period gap that is later fixed matters is not published. | UNCONFIRMED_INTERPRETATION (this is why C5 is UNRESOLVED) | "Sittsy has not published which fields make a profile complete. This tracker shows completeness as reported by the account, and cannot treat it as an authoritative pass or fail." |
| I8 | "Booking" has no published event definition (created, accepted, completed, cancelled?). Any `booking_created` event inside the period is recorded as a fact; no authoritative status is derived from it. | UNCONFIRMED_INTERPRETATION (this is why C6 is UNRESOLVED) | "Sittsy has not published exactly what counts as a booking for this condition. This tracker records booking events as facts and cannot treat them as an authoritative pass or fail." |
| I9 | C7's published statement ("There is no refund during those 30 days", claims in-app "after at least 30 days") does not say whether filing a claim inside the period is a timing matter or voids the Promise. | UNCONFIRMED_INTERPRETATION | "Sittsy states there is no refund during the 30 days. It has not published whether claiming early affects eligibility, so this tracker records the claim and marks the result Cannot determine on this point." |
| I10 | A "reply" for C2 is any sitter message event on the request. Whether Sittsy requires a substantive response is not published. | UNCONFIRMED_INTERPRETATION | (No separate label; stated in the C2 contract, section 4.2, and in the C2 card's source note.) |
| I11 | Requests posted or accepted before activation do not count toward C1/C2. | PUBLISHED ("requests posted or accepted before activation would not establish a booking after activation", company reply) | (Stated in the C1/C2 source notes.) |
| I12 | Account restrictions (a sitter reports a 7-day restriction inside the window, claims sheet case 3) do not pause any clock in this model. Whether a restriction pauses anything is not published; the model invents no pause. | UNCONFIRMED_INTERPRETATION | (Not labelled in UI; recorded here so the builder does not invent a pause feature.) |
| I13 | Applying has no published deadline (unlike replying). An application counts at its event timestamp, any time inside the period. | PUBLISHED by omission in the enumeration (the enumeration deadlines only the reply) - treated as a rule input, flagged here for honesty | (No label.) |
| I14 | Day-buckets for C3 are anchored to the period start instant (bucket k = [start + k x 24h, start + (k+1) x 24h)), not to calendar days in any timezone. Device timezone changes affect only display formatting. | UNCONFIRMED_INTERPRETATION (prototype convention, follows from I1) | (Stated in the tracker header next to I1's label.) |

Legal note (applies to I1, I9 and all C7 copy): the published EU/UK withdrawal waiver is quoted as published wording (section 10.2). Nothing in this prototype states or implies that a sitter loses any statutory right. The tracker takes no position on statutory rights, and no copy may suggest otherwise.

---

## 3. Policy model

### 3.0 Condition table (final)

| ID | Condition (short name) | Mechanic | Evidence class | Evaluated? | Status vocabulary |
|---|---|---|---|---|---|
| C1 | Apply to at least 80% of requests | Period measure (exact rational, at period end) | PUBLISHED | Yes | NOT_STARTED, IN_PROGRESS, MET, MISSED, UNKNOWN |
| C2 | Reply to every request within 24 hours | Per-request deadline instances | PUBLISHED | Yes | NOT_STARTED, IN_PROGRESS, MET, MISSED, UNKNOWN |
| C3 | Calendar open at least 24 of 30 days | Period measure (day-bucket counter) | PUBLISHED | Yes | NOT_STARTED, IN_PROGRESS, MET, MISSED |
| C4 | 5 approved testimonials | Counter | PUBLISHED | Yes | NOT_STARTED, IN_PROGRESS, MET, MISSED |
| C5 | Profile complete | Boolean fact (reported by account) | PUBLISHED condition, UNRESOLVED definition (I7) | Facts only | NOT_STARTED, IN_PROGRESS, UNRESOLVED |
| C6 | No booking in the period | Event fact | PUBLISHED condition, UNRESOLVED definition (I8) | Facts only | NOT_STARTED, IN_PROGRESS, UNRESOLVED |
| C7 | No refund claim during the period | Claim event + interpretation flag | PUBLISHED statement, UNCONFIRMED_INTERPRETATION semantics (I9) | Event always recorded; status restricted | NOT_STARTED, IN_PROGRESS, CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED, MET |
| C8 | Promise included in the activation | Precondition + policy snapshot | PUBLISHED | Once, at activation | (Drives NO_PROMISE; stores the snapshot, section 3.8) |
| R1 | Testimonial collection deadline, 7 days | None | REPORTED_ENFORCEMENT | Never | NOT_EVALUATED |
| R2 | Testimonials present 20 of 30 days | None | UNCONFIRMED_INTERPRETATION (a reported formulation conflicting with the published list; research could not establish which version applies) | Never | NOT_EVALUATED |

R1 and R2 are not conditions. They appear only in the evidence section specified in section 3.9. They have no status in the derivation, no clock, no audit entries, and no effect on any result.

Not conditions (recorded so the builder does not add them):
- Chargeback consequence ("initiating a payment dispute or chargeback may result in permanent suspension from the platform", company reply). A platform consequence, not a Promise condition. Appears nowhere in the tracker UI.
- Demand level. Published: "Eligibility for the guarantee is based on the stated terms and conditions, not on the number of sitters in your town." Demand is context (section 8), never an input to derivation.

### 3.1 C1 - Apply rate

- Sitter-facing text: "Apply to at least 80% of the booking requests you receive in your first 30 days."
- Published wording: "applying to at least 80% of booking requests received" (Sittsy company reply, Trustpilot). Source: https://www.trustpilot.com/review/sittsy.com?page=2
- Mechanic: period measure. Evidence class: PUBLISHED. Interpretations in force: I2 (denominator), I3 (exact comparison), I4 (zero requests), I11, I13.
- Counts: denominator R = `request_received` events with timestamp inside the period [start, end) (I1, I2). Numerator A = requests in the denominator for which a `request_applied` event exists inside the period.
- Status derivation:
  - Before activation: NOT_STARTED.
  - During the period: IN_PROGRESS. Display shows counts only ("Applied to A of R requests so far"), never a live pass/fail. If R = 0: "No requests received yet". C1 can never be MISSED mid-period: future requests can always change the ratio.
  - At period end: if R = 0, UNKNOWN (I4) and the result routes per section 5.3. If R > 0: MET iff 5A >= 4R (exact integer arithmetic, I3); otherwise MISSED.
- Withdrawn requests: see the C2 event contract (section 4.2). A withdrawn request is NOT removed from R by invention: whether it counts is unpublished, so its presence makes the denominator indeterminate. Rule, fixed: if any in-period request was withdrawn, C1 derives UNKNOWN at period end (never a computed MET or MISSED on an invented denominator). The demo contains no withdrawal, so this rule is specified but not exercised by the fixture.

### 3.2 C2 - Reply within 24 hours

- Sitter-facing text: "Reply to every booking request within 24 hours of receiving it."
- Published wording: "replying to every request within 24 hours" (company reply enumeration, same source as C1).
- Mechanic: per-request deadline instances. Evidence class: PUBLISHED. Interpretations in force: I4, I10, I11. The full event contract is section 4.2 and is part of this condition's definition.
- Instance derivation (per request received inside the period): deadline = received_at + 24h exactly, computed from the receipt timestamp recorded in the event log. SATISFIED iff a sitter-message (reply) event for that request exists with timestamp <= deadline (a reply exactly at the deadline satisfies; a reply after it is recorded as a fact and does not satisfy). MISSED from the first derivation where asOf > deadline and no satisfying reply exists. WITHDRAWN_UNRESOLVED if a `request_withdrawn` event exists for the request (section 4.2): the instance is listed as an unresolved case and is neither SATISFIED nor MISSED.
- Condition status derivation:
  - Before activation: NOT_STARTED.
  - During the period: IN_PROGRESS while no instance is MISSED; MISSED from the moment any instance becomes MISSED. MISSED is sticky: "every request" can no longer be true, and no later event reverses it (a correction event may change an instance, section 4.2; if a correction removes the only missed instance, the condition re-derives from the corrected log - corrections are how history is amended, never silent edits).
  - At period end: MISSED if any instance is MISSED. Else UNKNOWN if R = 0 (I4) or if any instance is WITHDRAWN_UNRESOLVED. Else MET (R > 0 and every instance SATISFIED).

### 3.3 C3 - Calendar open 24 of 30 days

- Sitter-facing text: "Keep your calendar open on at least 24 of your first 30 days."
- Published wording: "keeping the calendar open for at least 24 of the 30 days" (same source as C1).
- Mechanic: period measure (day-bucket counter). Evidence class: PUBLISHED. Interpretations in force: I1, I5, I14.
- A `calendar_day_open` event marks one bucket open. Counter = distinct buckets inside the period with an open event. Elapsed buckets at asOf = buckets whose end <= asOf. Remaining = 30 - elapsed.
- Status derivation:
  - Before activation: NOT_STARTED.
  - MET as soon as counter >= 24 (under I5's cumulative reading; the count cannot fall, buckets are historical facts).
  - MISSED as soon as counter + remaining < 24 (arithmetically unreachable), even mid-period.
  - Otherwise IN_PROGRESS during the period. At period end: MET if counter >= 24, else MISSED (unless already set).

### 3.4 C4 - Five approved testimonials

- Sitter-facing text: "Have 5 approved testimonials on your profile. Testimonials can come from previous clients; they do not need to book or pay anything." (Second sentence PUBLISHED: "Testimonials can be provided by previous clients without requiring them to make a new booking or purchase a sitter account", company reply.)
- Published wording: "having 5 approved testimonials" (same source as C1).
- Mechanic: counter. Evidence class: PUBLISHED. Interpretations in force: I6.
- Counter = `testimonial_approved` events inside the period. MET as soon as counter >= 5. At period end, MISSED if counter < 5. Otherwise IN_PROGRESS. No clock of its own: the only testimonial deadlines anywhere in the evidence are R1/R2, which are never evaluated.

### 3.5 C5 - Profile complete (UNRESOLVED)

- Sitter-facing text: "Keep your profile complete."
- Published wording: "keeping the profile complete" (same source as C1).
- Mechanic: boolean fact reported by the account: `profile_complete` on the activation payload, then `profile_completed` / `profile_incomplete` events.
- Evidence class: the condition is PUBLISHED; its definition is UNRESOLVED (I7: no published field list exists in any source read).
- Status derivation (restricted vocabulary - C5 never produces MET or MISSED):
  - Before activation: NOT_STARTED.
  - During the period: IN_PROGRESS. The card renders the fact: "Profile reported complete" or "Profile reported not complete", with the current value and its history of changes. It is a product progress indicator only; it is never equated with the Promise requirement, and its copy says so (I7 label).
  - At period end: UNRESOLVED, in all cases, whatever the boolean shows. The fact at period end is displayed next to the status ("Profile reported complete at day 30 - definition unresolved").
- Effect on the result: UNRESOLVED is an unknown-class status (section 5.2) and feeds CANNOT_DETERMINE at period end unless a confirmed miss already decides the result (section 5.3).

### 3.6 C6 - No booking in the period (UNRESOLVED)

- Sitter-facing text: "The Promise applies only if you receive no booking in your first 30 days."
- Published wording: "you meet all applicable conditions and receive no booking within 30 days" (company reply, same source as C1).
- Mechanic: event fact. Evidence class: the condition is PUBLISHED; its definition is UNRESOLVED (I8: no published definition of what counts as a booking).
- Status derivation (restricted vocabulary - C6 never produces MET or MISSED):
  - Before activation: NOT_STARTED.
  - During the period: IN_PROGRESS. The card renders facts: "No booking event recorded so far in this period" or "A booking event was recorded on Day N (booking_id)". No authoritative pass or fail is attached to either fact.
  - At period end: UNRESOLVED, in all cases. The end-state fact is displayed ("No booking event was recorded during the 30 days - definition unresolved" or the booking fact).
- Effect on the result: as C5 (unknown-class; feeds CANNOT_DETERMINE unless a confirmed miss decides).

### 3.7 C7 - No refund claim during the period (redesigned)

- Sitter-facing text: "There is no refund during the first 30 days. Claims are made in the app after day 30."
- Published wording: "There is no refund during those 30 days." and "you can request a refund directly in the app after at least 30 days, provided all applicable conditions have been met." (company replies, same source as C1).
- Mechanic: claim event + interpretation flag. Evidence class: the statement is PUBLISHED; its semantics are UNCONFIRMED_INTERPRETATION (I9).
- The period is the interval in I1, [activation, activation + 30 days), labelled on screen as a prototype convention (I1's verbatim label appears in the tracker header and on the C7 card).
- Event handling, fixed and exhaustive:
  - A `refund_claim_filed` event is ALWAYS recorded in the event log, at its timestamp, whatever the period state. It is never dropped, never ignored, and never described as changing nothing.
  - Claim timestamp inside the period: C7 status becomes CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED at that moment, and an unresolved flag is set on the result (visible from that moment on, and decisive at period end per section 5.3). The card shows: the claim's timestamp, I9's verbatim label, and the line "Your claim is recorded. What it means for the Promise is not published, so this tracker does not decide it."
  - Claim timestamp at or after period end: the published route. C7's finalised status does not change; the claim is recorded and shown on the card as a fact ("Claim filed on Day N, after the period ended, through the in-app route. Recorded; this tracker does not decide claims."). An audit NOTE entry records it (section 6.1).
- Status derivation:
  - Before activation: NOT_STARTED.
  - During the period, no claim yet: IN_PROGRESS.
  - During the period, claim filed: CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED (sticky for status purposes; a second claim changes no status and writes no duplicate entry - idempotency key, section 6.1).
  - At period end: MET if no claim was filed inside the period (the tracked published statement was complied with as a fact of the log). If a claim was filed inside the period, the status REMAINS CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED at and after period end; it never resolves to MET or MISSED inside this prototype.
- C7 never derives MISSED, in any circumstance. The unresolved flag from an in-period claim is unknown-class (section 5.2) and feeds CANNOT_DETERMINE at period end unless a confirmed miss already decides the result.
- Legal note (binding on all C7 copy): nothing on the C7 card or anywhere else states or implies that filing a claim, or the passage of the 30 days, affects any statutory right. The published withdrawal waiver is quoted only in the "Before you pay" view, labelled as published wording shown before paying (section 10.2).

### 3.8 C8 - Promise included, and the policy snapshot

- Sitter-facing text: "Your activation must include the Money Back Promise. Activations without it are final and non-refundable, and the payment screen states this before paying."
- Published wording: "If your activation includes it..." and "A plan without the Money Back Promise is final and non-refundable, and the payment screen states this before paying." (company replies, same source as C1).
- Mechanic: binary precondition, evaluated once at activation, PLUS the snapshot store below.
- Derivation: read `plan_includes_promise` from the `activation_completed` payload. If false, the overall state is NO_PROMISE (terminal, section 5.3); C1 to C7 are displayed for information with status NOT_APPLICABLE, and no end-state label ever appears, because there is no promise to evaluate.
- **Policy snapshot.** The `activation_completed` event stores, immutably, a full snapshot of the policy as presented to this sitter at activation:
  ```
  policySnapshot = {
    version: "published-list-2026-11-17",       // version string for the published list as read on that date
    captured_at: <activation timestamp>,
    market: "UK - London",                       // the sitter's market as selected in the scenario
    fee_amount_shown: "30",                      // string or null; the amount on this sitter's Pay button, as data
    fee_currency: "GBP",                         // or null when fee_amount_shown is null
    conditions_as_shown: [                       // C1..C8, exactly as rendered before payment
      { id, sitter_facing_text, published_wording, source_url, evidence_class }
    ],
    reported_items_as_shown: [                   // R1, R2 display texts (section 3.9)
      { id, display_text, source_url, evidence_class }
    ],
    interpretations_in_force: [                  // I1..I14 records that constrain any computation
      { id, statement, evidence_class, on_screen_label }
    ]
  }
  ```
- Derivation (section 5.1) takes THIS snapshot, not a live policy object. If the published list is re-read later and changes, the version string changes for future activations; an in-flight sitter continues to be derived against the snapshot they were shown. Derivations under different versions are never mixed, and every audit entry records the snapshot's version (section 6.1).
- Fee rule (unchanged from v1 governing rule 7): no fee amount is hardcoded anywhere. An amount renders only from `fee_amount_shown` in the snapshot. Provenance note for the demo fixture: GBP 30 is scenario data supplied on the activation event, as the real amount would arrive from the Pay button; in the claims sheet, GBP 30 is evidenced only as a sitter report (case 3), while company-evidenced amounts are EUR 50 / 29 / 75. The UI labels the demo amount "the amount on this sitter's Pay button (simulated)".

### 3.9 Reported items section (R1, R2) - outside the checklist

The "Before you pay" view and the tracker view both contain a section AFTER the condition list, headed verbatim: "Reported conditions not present in the published list". Intro line, verbatim: "Sitters have reported being judged on conditions that do not appear in Sittsy's published list. They are shown here, with their sources, so nothing is a surprise. This tracker does not evaluate them, because Sittsy has not published them."

**R1 - Testimonial collection deadline, 7 days**
- Display text: "Reported but not published: one sitter was refused a refund over a 7-day deadline for collecting testimonials. This deadline appears in no published Sittsy condition list we could find."
- Evidence class: REPORTED_ENFORCEMENT. Source: sitter's account of her denial, Padua case, https://www.trustpilot.com/review/sittsy.com (review dated 2 Nov 2026).
- Status: NOT_EVALUATED at all times. No clock runs. If the demo timeline passes the reported 7-day date, nothing changes and no audit entry is written; the demo script (section 9) annotates the moment so a viewer can see the non-event.

**R2 - Testimonial presence, 20 of 30 days**
- Display text: "Reported but not published: one sitter's in-app terms reportedly required five approved testimonials to remain on the profile for at least 20 of the 30 days. The published list contains no presence requirement."
- Evidence class: UNCONFIRMED_INTERPRETATION (a reported formulation conflicting with the published enumeration; which version applies could not be established). Source: Padua case, same source as R1.
- Status: NOT_EVALUATED at all times.

---

## 4. Event model

### 4.1 Event catalogue

All events are timestamped, append-only, and immutable once written. Derivation reads the log; nothing ever edits or deletes a log entry (corrections are new events, section 4.2).

| Event | Payload | Notes |
|---|---|---|
| `activation_completed` | `plan_includes_promise` (bool), `profile_complete` (bool), plus the full `policySnapshot` (section 3.8) | Starts the period (I1). The snapshot is part of the event, not a separate store. |
| `request_received` | `request_id` | Counts toward C1/C2 only if its timestamp is inside the period (I11). Its timestamp is the C2 clock start (section 4.2). |
| `request_applied` | `request_id` | Counts for C1 if inside the period. No deadline (I13). |
| `request_replied` | `request_id` | A sitter message event (I10). Satisfies the C2 instance iff timestamp <= deadline. A later reply is still logged and shown as a fact. |
| `request_withdrawn` | `request_id` | Marks the instance WITHDRAWN_UNRESOLVED (section 4.2). Never deletes the request from any count by invention. |
| `reply_corrected` | `request_id`, `corrected_reply_at` (timestamp), `reason` (string) | An explicit, audited correction: asserts that the sitter's reply to this request actually occurred at `corrected_reply_at`. Re-derivation uses the corrected timestamp for that instance. The original `request_replied` event stays in the log; the correction is a new event, never a silent edit (section 4.2). |
| `calendar_day_open` | `bucket_index` (0 to 29) | Marks one day-bucket open for C3. |
| `testimonial_approved` | `testimonial_id` | Increments C4 if inside the period (I6). |
| `profile_completed` / `profile_incomplete` | none | Updates the C5 fact. Changes no authoritative status (C5 is UNRESOLVED). |
| `booking_created` | `booking_id` | Recorded as a C6 fact if inside the period (I8). Changes no authoritative status. |
| `refund_claim_filed` | none | Always recorded. Handling per section 3.7 (inside period: C7 state + unresolved flag; at/after end: fact + audit NOTE). |
| `time_advanced` | `to` (timestamp) | Simulator clock event; sets the derivation's asOf. Deadline and period-end transitions are observed at the first derivation whose asOf passes the relevant threshold. |

`period_ended` is NOT an event: it is a derived fact (asOf >= period end). Finalisation is a derivation step, not a button and not a stored event.

Clock semantics: period start = the `activation_completed` timestamp; period end = start + 30 days (720 hours); the period is [start, end) (I1). Day-buckets: bucket k = [start + k x 24h, start + (k+1) x 24h), k = 0..29 (I14). C2 deadlines are computed from event timestamps, never from buckets. All timestamps are absolute instants; derivation filters and compares by timestamp, so events arriving out of order in the log produce identical state, and a device timezone change alters only display formatting, never derivation.

### 4.2 C2 event contract (and the C1 denominator)

This contract is part of the published conditions' implementation and is shown, in plain language, in the C2 card's source note.

1. **Clock start.** A request's 24-hour clock starts at the receipt timestamp recorded on its `request_received` event in the log. Not at display time, not at notification time: at the logged receipt instant.
2. **What a reply is.** A reply is a sitter message event (`request_replied`) on that request (I10). The instance is satisfied iff the reply's timestamp is <= received_at + 24h. A reply exactly at the deadline satisfies it. A reply after the deadline is recorded and displayed ("Replied N after the deadline; this does not satisfy the condition as published") and does not satisfy the instance.
3. **Corrections are explicit audited events.** If a recorded reply time (or a missing reply) is wrong, the fix is a `reply_corrected` event carrying the corrected timestamp and a reason. Derivation then re-runs over the corrected log. Any status that changes as a result transitions through the audit trail like any other, keyed as usual (section 6.1), with the correction event named as the trigger. No event is ever edited, backdated silently, or deleted; there are no silent reversals.
4. **Withdrawn requests are an unresolved case, listed, not resolved.** A `request_withdrawn` event moves the instance to WITHDRAWN_UNRESOLVED. The instance remains visible in the C2 list, badged "Withdrawn - treatment unpublished". It is neither satisfied nor missed. Consequences, fixed and not invented beyond this: C2 cannot derive MET at period end while a WITHDRAWN_UNRESOLVED instance exists (it derives UNKNOWN instead, unless already MISSED); C1 derives UNKNOWN at period end (section 3.1). The prototype does not decide whether withdrawn requests should count; it shows the case and routes the result to CANNOT_DETERMINE.
5. **Duplicate delivery.** The same event (same type, same id, same timestamp) delivered twice is one event. Derivation is over the log as a set of facts; audit writes are idempotent (section 6.1), so a duplicate delivery produces no duplicate transition and no duplicate audit entry. The demo exercises this at step 13.

---

## 5. Derivation and overall result

### 5.1 The derivation function

```
derive(eventLog, policySnapshot, asOf) -> state
```

- Pure: the same (eventLog, policySnapshot, asOf) always returns the same state. No component keeps its own eligibility logic, its own clock, or its own copy of a rule. Both phone views, the simulator readouts, and every number on screen render values from the one returned state object.
- Inputs are exactly: the append-only event log, the policy snapshot stored on the activation event (section 3.8), and asOf. There is no live policy lookup and no wall-clock read inside derive.
- The returned state contains: every condition's status and display values, every C2 instance's status, the unresolved flags, the overall result (section 5.3), and the fee/market/version display data from the snapshot.

### 5.2 Status vocabulary

Condition statuses:
- Evaluated conditions (C1, C2, C3, C4): NOT_STARTED, IN_PROGRESS, MET, MISSED, UNKNOWN.
- UNRESOLVED conditions (C5, C6): NOT_STARTED, IN_PROGRESS, UNRESOLVED. Never MET, never MISSED.
- C7: NOT_STARTED, IN_PROGRESS, CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED, MET (MET only at period end with no in-period claim, section 3.7).
- C2 instances: PENDING, SATISFIED, MISSED, WITHDRAWN_UNRESOLVED.
- Reported items (R1, R2): NOT_EVALUATED, permanently. They are not conditions and hold no status in the state object beyond their display records.

Unknown-class statuses (the "unknowns" of the truth table): UNKNOWN (C1/C2), UNRESOLVED (C5/C6), and the unresolved flag carried by CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED (C7). A confirmed miss = MISSED on any of C1, C2, C3, C4. (C5, C6, C7 can never be a confirmed miss.)

Banned vocabulary: the words "eligible", "eligibility", "you qualify", "refund approved" and "refund denied" appear nowhere in the UI, in any state, label, reason string or README claim for this prototype. (They may appear inside verbatim quotes from sources, clearly marked as quotes, and in the naive-mode reconstruction in section 7 where the widget text is the documented symptom being demonstrated, labelled as such.)

### 5.3 Overall states and the precedence truth table

Overall states: PRE_ACTIVATION, NO_PROMISE, IN_PROGRESS, REQUIREMENT_MISSED (mid-period only), and at period end exactly one of TRACKED_PUBLISHED_CONDITIONS_MET, TRACKED_REQUIREMENTS_NOT_MET, CANNOT_DETERMINE.

UI labels (verbatim):
- PRE_ACTIVATION: no result label. Header text: "Before you pay: what the Money Back Promise actually requires."
- NO_PROMISE: "No Money Back Promise on this activation"
- IN_PROGRESS: "In progress: no tracked published condition missed yet"
- REQUIREMENT_MISSED: "A tracked published requirement has been missed" (sub-line: "Determined on Day N at HH:MM by [condition name]. The remaining conditions are still tracked below. Whether this ends the Promise is Sittsy's decision; confirm with Sittsy.")
- TRACKED_PUBLISHED_CONDITIONS_MET: "All tracked published conditions met" (sub-line: "This tracks the published list in the policy snapshot. It is not a refund decision; Sittsy decides claims.")
- TRACKED_REQUIREMENTS_NOT_MET: "Not met" (sub-line naming the determining condition and when it was determined, as for REQUIREMENT_MISSED.)
- CANNOT_DETERMINE: "Cannot determine" (sub-line naming each unknown-class status that blocks determination and why, e.g. "Profile completeness has no published definition (C5). No authoritative definition of a booking exists (C6).")

Precedence truth table. Variables: MISS = at least one confirmed miss among C1 to C4; UNK = at least one unknown-class status or flag among C1 to C7; END = asOf >= period end. (PRE_ACTIVATION and NO_PROMISE are decided before this table: no activation -> PRE_ACTIVATION; activation with plan_includes_promise = false -> NO_PROMISE.)

| MISS | UNK | END | Overall result |
|---|---|---|---|
| No | No | No | IN_PROGRESS |
| No | Yes | No | IN_PROGRESS (flags shown; determination is a period-end act) |
| Yes | No | No | REQUIREMENT_MISSED |
| Yes | Yes | No | REQUIREMENT_MISSED (the confirmed miss is primary; unknowns are shown alongside) |
| Yes | No | Yes | TRACKED_REQUIREMENTS_NOT_MET |
| Yes | Yes | Yes | TRACKED_REQUIREMENTS_NOT_MET (the confirmed miss stays primary even when unknowns coexist) |
| No | Yes | Yes | CANNOT_DETERMINE |
| No | No | Yes | TRACKED_PUBLISHED_CONDITIONS_MET |

Notes on the table:
- A confirmed miss is sticky and primary: once any of C1 to C4 is MISSED, no unknown, flag or later event can move the result away from the NOT_MET column. Mid-period it shows as REQUIREMENT_MISSED; the same determination finalises as TRACKED_REQUIREMENTS_NOT_MET.
- Unknowns block MET: TRACKED_PUBLISHED_CONDITIONS_MET requires MISS = No AND UNK = No at period end. Because C5 and C6 are UNRESOLVED by design (section 3.5, 3.6), UNK is Yes in every real run on current evidence, so MET is unreachable until Sittsy publishes authoritative definitions for C5 and C6. This is a property of the evidence, stated openly in the README, not a defect of the model.
- Mid-period, unknowns never produce CANNOT_DETERMINE: determination happens at period end. Flags are displayed as they arise (notably C7's claim flag).

### 5.4 Condition status machines (consolidated)

- C1: NOT_STARTED -> IN_PROGRESS (activation) -> at period end only: MET / MISSED / UNKNOWN per section 3.1.
- C2: NOT_STARTED -> IN_PROGRESS -> MISSED (first missed instance, any time) -> at period end: MET / UNKNOWN if not MISSED, per section 3.2.
- C3: NOT_STARTED -> IN_PROGRESS -> MET (counter reaches 24) or MISSED (target unreachable), either possibly mid-period; finalised at period end if still IN_PROGRESS.
- C4: NOT_STARTED -> IN_PROGRESS -> MET (counter reaches 5, possibly mid-period); at period end MISSED if counter < 5.
- C5: NOT_STARTED -> IN_PROGRESS -> UNRESOLVED (at period end, always).
- C6: NOT_STARTED -> IN_PROGRESS -> UNRESOLVED (at period end, always).
- C7: NOT_STARTED -> IN_PROGRESS -> CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED (in-period claim, sticky) or, at period end with no in-period claim, MET.
- Reported items: NOT_EVALUATED throughout; no machine.

---

## 6. Audit trail

### 6.1 Idempotent audit writes

The audit trail is the append-only record of what the single derivation produced: when a status changed, at what asOf, triggered by which event, and why. It is what makes "the state changed exactly once, and here is why" a checkable claim.

Entry format:

```
{ seq, key, at, scope, trigger, from, to, reason, policy_version, kind }
```

- `key`: the idempotency key, `(instance_id, policy_version, to_status)`, rendered as a string, e.g. "C2:R2@published-list-2026-11-17->MISSED". Instance ids: "C1".."C7" for conditions, "C2:<request_id>" for C2 deadline instances, "OVERALL" for the result.
- Idempotency rule: an entry is written iff no entry with the same key already exists in the trail. Re-deriving the same state, re-delivering the same event, or re-observing the same deadline writes nothing. A genuinely new transition (a status an instance has never held under this policy version) has a new key and writes exactly one entry.
- `at`: the asOf at which the transition was first derived (for deadline transitions, the first asOf past the deadline; the reason states the deadline itself).
- `trigger`: the event that caused the re-derivation (type plus id where applicable, e.g. "time_advanced to Day 4, 18:30:01", "testimonial_approved T5", "refund_claim_filed").
- `from` / `to`: previous and new status of the instance.
- `reason`: a human sentence naming the rule, the evidence class where relevant, and the numbers.
- `policy_version`: the snapshot's version string.
- `kind`: TRANSITION, or NOTE. NOTE entries record facts that change no status but must be on the record: a refund claim filed at/after period end (section 3.7). NOTE entries use from == to and are also keyed (a post-period claim's key is "C7@<version>->CLAIM_FILED_AFTER_PERIOD"; a second post-period claim is a new fact with its own timestamped key suffix and does write - it is a new event, not a duplicate).
- Activation writes the initial transitions: each of C1 to C7 from NOT_STARTED to its first derived status, then OVERALL from PRE_ACTIVATION to IN_PROGRESS (or NO_PROMISE).
- Reported items never write entries: they never transition.
- C5/C6 fact changes (profile toggles, booking events) write no entries: they change facts, not statuses. The facts are visible on the cards; the audit trail records status determinations only, plus the NOTE facts named above.

### 6.2 Demo fixture ledger (23 entries)

For the demo run in section 9, a correct implementation produces exactly these 23 entries, in this order. Each entry lists its trigger. No other entries may appear; in particular there is no entry at Day 7 for R1, no entry for the duplicate delivery at step 13, and no second OVERALL entry after the Day 4 determination until finalisation.

| Seq | At | Scope (key instance) | From -> To | Trigger | Reason (substance) |
|---|---|---|---|---|---|
| 1 | Day 0, 10:00:00 | C1 | NOT_STARTED -> IN_PROGRESS | activation_completed | Activation with the Money Back Promise. Tracking begins against snapshot published-list-2026-11-17. |
| 2 | Day 0, 10:00:00 | C2 | NOT_STARTED -> IN_PROGRESS | activation_completed | As seq 1. |
| 3 | Day 0, 10:00:00 | C3 | NOT_STARTED -> IN_PROGRESS | activation_completed | As seq 1. |
| 4 | Day 0, 10:00:00 | C4 | NOT_STARTED -> IN_PROGRESS | activation_completed | As seq 1. |
| 5 | Day 0, 10:00:00 | C5 | NOT_STARTED -> IN_PROGRESS | activation_completed | Profile reported complete at activation. Fact recorded; C5 carries no authoritative pass/fail (definition unresolved, I7). |
| 6 | Day 0, 10:00:00 | C6 | NOT_STARTED -> IN_PROGRESS | activation_completed | No booking event recorded. Fact recorded; C6 carries no authoritative pass/fail (definition unresolved, I8). |
| 7 | Day 0, 10:00:00 | C7 | NOT_STARTED -> IN_PROGRESS | activation_completed | No refund claim filed. |
| 8 | Day 0, 10:00:00 | OVERALL | PRE_ACTIVATION -> IN_PROGRESS | activation_completed | Activation includes the Money Back Promise. Tracking the published conditions in the snapshot. |
| 9 | Day 2, 16:05 | C2:R1 | PENDING -> SATISFIED | request_replied R1 | Reply 6h 50m after receipt (Day 2, 09:15), inside the 24-hour deadline (Day 3, 09:15). |
| 10 | Day 4, 18:30:01 | C2:R2 | PENDING -> MISSED | time_advanced to Day 4, 18:30:01 | Request R2 (received Day 3, 18:30) had no reply by its 24-hour deadline (Day 4, 18:30:00). |
| 11 | Day 4, 18:30:01 | C2 | IN_PROGRESS -> MISSED | time_advanced to Day 4, 18:30:01 | Instance R2 missed. Replying to every request within 24 hours can no longer be met. |
| 12 | Day 4, 18:30:01 | OVERALL | IN_PROGRESS -> REQUIREMENT_MISSED | time_advanced to Day 4, 18:30:01 | Confirmed miss on C2. The remaining conditions continue to be tracked. |
| 13 | Day 8, 20:45 | C2:R3 | PENDING -> SATISFIED | request_replied R3 | Reply 7h 35m after receipt (Day 8, 13:10), inside the deadline (Day 9, 13:10). |
| 14 | Day 13, 13:30 | C4 | IN_PROGRESS -> MET | testimonial_approved T5 | 5th approved testimonial received. Published target of 5 reached. |
| 15 | Day 16, 08:19:59 | C2:R4 | PENDING -> SATISFIED | request_replied R4 | Reply at Day 16, 08:19:59, one second before the deadline (Day 16, 08:20:00). A reply at or before the deadline satisfies the instance (boundary case). |
| 16 | Day 22, 10:30 | C2:R5 | PENDING -> SATISFIED | request_replied R5 | Reply 14h 50m after receipt (Day 21, 19:40), inside the deadline (Day 22, 19:40). |
| 17 | Day 25, 09:00:01 | C2:R6 | PENDING -> MISSED | request_replied R6 (arriving after the deadline) | Reply at Day 25, 09:00:01, one second after the deadline (Day 25, 09:00:00). The reply is recorded; it does not satisfy the instance (boundary case). C2 is already MISSED, so no condition entry follows. |
| 18 | Day 25, 10:00 | C3 | IN_PROGRESS -> MET | calendar_day_open, bucket 25 | Calendar open on 24 of the first 30 days. Published target reached (cumulative counting, I5). |
| 19 | Day 29, 11:00 | C7 | IN_PROGRESS -> CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED | refund_claim_filed | Claim filed inside the period [Day 0, 10:00, Day 30, 10:00). The event is recorded. Whether an early claim affects the Promise is not published (I9); the status records the event and the unresolved interpretation, and derives no miss. |
| 20 | Day 30, 10:00:00 | C1 | IN_PROGRESS -> MET | time_advanced to period end (finalisation) | Period ended. Applied to 5 of 6 requests received. Exact comparison: 5 x 5 = 25 >= 4 x 6 = 24 (I3), on the denominator as defined in I2. |
| 21 | Day 30, 10:00:00 | C5 | IN_PROGRESS -> UNRESOLVED | time_advanced to period end (finalisation) | Period ended. Profile completeness has no published definition (I7), so no authoritative pass or fail exists. Fact at period end: profile reported complete throughout. |
| 22 | Day 30, 10:00:00 | C6 | IN_PROGRESS -> UNRESOLVED | time_advanced to period end (finalisation) | Period ended. "Booking" has no published definition (I8), so no authoritative pass or fail exists. Fact at period end: no booking event was recorded during the 30 days. |
| 23 | Day 30, 10:00:00 | OVERALL | REQUIREMENT_MISSED -> TRACKED_REQUIREMENTS_NOT_MET | time_advanced to period end (finalisation) | Period ended. The confirmed miss on C2 (Day 4) is primary and decides the result. Unknowns coexist (C5 UNRESOLVED, C6 UNRESOLVED, C7 claim interpretation unconfirmed) and are recorded; per the precedence table they do not displace a confirmed miss. |

Count check: 8 activation entries (seq 1-8) + 4 instance satisfactions (seq 9, 13, 15, 16) + 2 instance misses (seq 10, 17) + 2 condition transitions from the Day 4 miss (seq 11, 12) + 2 mid-period condition METs (seq 14, 18) + 1 claim entry (seq 19) + 4 finalisation entries (seq 20-23) = 23.

---

## 7. Contradiction demo ("naive mode"), redesigned

### 7.1 The documented failure

From the Padua case (claims sheet, complaint case 1): the sitter reports that "while one notification stated that my refund eligibility had expired, another section still displayed an active countdown for the same task." Two parts of one app, describing the same quantity - the sitter's refund position - held two contradictory states at the same moment.

### 7.2 The fairness fix

In v1 the two naive widgets displayed different things (a countdown and a status flag), so a sceptic could say they were never measuring the same quantity. In v2 both widgets are labelled, identically, **"Refund eligibility"**. Each independently computes that one user-facing quantity from a different interpretation of the policy:

- **Widget A** computes from the REPORTED 7-day testimonial collection deadline (R1, REPORTED_ENFORCEMENT): eligibility expires at activation + 7 days if fewer than 5 testimonials are collected by then. It latches: once expired, it never updates again.
- **Widget B** computes from the 30-day interpretation of the promise period: eligibility runs to activation + 30 days, and it renders the remaining time. It knows nothing about any collection deadline.

Both widgets are plausible implementations a team could ship. Neither consults the other. That is the whole design: the contradiction is not a bug added on top, it is what two independently maintained interpretations of the same policy naturally produce when they are both allowed to determine the same user-facing result. Naive mode is a reconstruction of the documented symptom, not a claim about Sittsy's actual code.

### 7.3 Exact scripted steps (naive timeline)

A separate, short event sequence drives naive mode. Times relative to a naive activation at Day 0, 10:00.

| Step | Time | Event | Widget A - "Refund eligibility" (7-day reported rule) | Widget B - "Refund eligibility" (30-day interpretation) |
|---|---|---|---|---|
| N0 | Day 0, 10:00 | activation | "Active. 7 days to collect 5 testimonials." (0 of 5) | "Active. 30 days remaining." |
| N1 | Day 2, 11:00 | testimonial approved (1) | "Active. 1 of 5 collected." | "Active. 28 days remaining." |
| N2 | Day 4, 09:30 | testimonial approved (2) | "Active. 2 of 5 collected." | "Active. 26 days remaining." |
| N3 | Day 7, 10:00 | clock passes the reported 7-day deadline at 2 of 5 | **"EXPIRED"** + notification "Your refund eligibility has expired." | **"Active. 23 days remaining."** |
| N4 | Day 8, 15:00 | testimonial approved (3) | "EXPIRED" (latched; the new testimonial changes nothing) | "Active. 22 days remaining." (3 of 5) |

At N3, one screen, one label, two answers: expired, and 23 days remaining. At N4 the widgets also disagree about whether further progress matters.

### 7.4 The corrected panel's answer to the same history

Below the naive screen, the prototype shows the corrected model over the identical event log (activation, 3 testimonials by Day 8):

- The testimonials condition (C4, PUBLISHED) shows: IN_PROGRESS, 3 of 5 approved testimonials. The published list sets no collection deadline.
- The 7-day deadline appears in the reported section (section 3.9), class REPORTED_ENFORCEMENT, status NOT_EVALUATED.
- The panel's answer to the question both naive widgets claimed to answer - "has refund eligibility expired over testimonials?" - is, verbatim: **"Cannot determine. The published conditions set no testimonial deadline. A 7-day deadline has been reported in a refund denial but does not appear in the published list. This prototype does not decide between them."** The published evidence and the reported evidence are shown side by side, each with its source.

Principle, stated on the panel: never let independently maintained interpretations of the same policy determine the same user-facing result. One derivation produces one answer; where the evidence does not settle the question, the answer is CANNOT_DETERMINE, not two confident contradictions.

### 7.5 Presentation

Naive mode is a toggle in the simulator panel. Turning it on switches the phone to the naive screen (the two widgets, both headed "Refund eligibility", under the heading "Naive mode: two independent interpretations, no shared state") and loads steps N0 to N4. The audit panel is replaced by the note: "Naive mode keeps no audit trail. Two parts of the screen answer the same question differently, and nothing records why. That is the problem this prototype demonstrates." Turning it off returns to the single-source model and the main demo script. The two modes never share state.

---

## 8. Demand panel data (unchanged from v1)

### 8.1 The only figures the panel may show

All figures below are from Sittsy's own published country pages, read on 17 November 2026. Each figure is displayed with its geography, its period ("last 30 days", as published) and the line "As published by Sittsy, read 17 November 2026." No other demand number may appear anywhere in the prototype.

**Global (shown on every become-a-sitter page read):**
- 12,619 sitters active. Source: https://uk.sittsy.com/become-a-sitter and https://nz.sittsy.com/become-a-sitter

**United Kingdom** (source: https://uk.sittsy.com/become-a-sitter, read 17 Nov 2026):
- Country total: 109 owner requests reached the country in the last 30 days. (A search-index crawl one day earlier showed 111; the figure moves. The panel footnote states: "Sittsy updates these figures; the UK total changed between two reads a day apart.")

| City | Sitters | Owner requests, last 30 days |
|---|---|---|
| London | 126 | 36 |
| Croydon | 7 | 31 |
| Liverpool | 12 | 8 |
| Manchester | 10 | 6 |
| Leeds | 7 | 5 |
| Nottingham | 8 | 5 |
| Leicester | 8 | 3 |
| Cambridge | 7 | 3 |
| Glasgow | 7 | 3 |
| Bristol | 17 | 2 |
| Birmingham | 8 | 2 |
| Brighton | 6 | 0 (published as "none") |

**New Zealand** (source: https://nz.sittsy.com/become-a-sitter, read 17 Nov 2026):
- Country total: 4 owner requests reached the country in the last 30 days.
- Auckland: 8 sitters, 3 requests. (The only city row published for the whole country.)

### 8.2 Labelling rules

- The panel heading is: "Owner requests in the last 30 days, as published by Sittsy". The word "requests" is used in every row and label; the published framing line may be quoted: "how many owner requests reached the city in the last 30 days".
- Requests are never converted into bookings, earnings, or probabilities. No sitters-per-request ratio, no ranking labelled "best city", no recommendation. The two published numbers sit side by side and speak for themselves.
- The panel is a market-context section inside the "Before you pay" view, placed after the condition list and after the reported-conditions section (demand never leads).
- The city selector offers exactly: the 12 UK cities above, Auckland, and "Jaipur, India". No other geography may be added without a published figure behind it.

### 8.3 The no-data state (India / Jaipur)

Selecting Jaipur shows the no-data state, verbatim copy:

> "No published data. Sittsy publishes no demand figures for India, and no India page was found. There is no number to show here, and this prototype will not invent one."

This state is a designed part of the demo, not an error: it is the honest answer for the market the viewer is standing in.

---

## 9. Demo script (main timeline)

One sitter, one coherent run. The sitter is in London (demand context in the "Before you pay" view is the published London row: 126 sitters, 36 owner requests in the last 30 days, labelled as published data, section 8). Activation is Day 0, 10:00:00; the period is [Day 0 10:00:00, Day 30 10:00:00) (I1). The activation snapshot (section 3.8) records: version "published-list-2026-11-17", market "UK - London", fee_amount_shown "30", fee_currency "GBP", plan_includes_promise = true, profile_complete = true.

The story in one paragraph: she activates with the Promise on her plan and a complete profile. Request R1 is applied to and answered inside a day. Request R2 is never answered; at Day 4, 18:30:01 its deadline is observed passed, C2 becomes MISSED exactly once, the result becomes REQUIREMENT_MISSED exactly once, and a duplicate delivery of the same observation changes nothing. Boundary cases follow: R4 is answered one second before its deadline (satisfied), R6 one second after its deadline (recorded, not satisfied). She reaches 5 testimonials (Day 13) and 24 open calendar days (Day 25). On Day 29, inside the period, she files a refund claim: it is recorded, C7 takes its unconfirmed-interpretation state, and the result does not move, because the confirmed miss is primary. At period end the apply rate is 5 of 6, which passes the exact comparison, but C5 and C6 finalise as UNRESOLVED and C7's flag stands. Final result, per the truth table (MISS = Yes, UNK = Yes, END = Yes): TRACKED_REQUIREMENTS_NOT_MET, determined by C2 on Day 4.

Standing values: C5 = IN_PROGRESS on every row (fact throughout: profile reported complete; it never changes and is never authoritatively passed or failed). C6 = IN_PROGRESS on every row (fact throughout: no booking event recorded). R1 and R2 (reported items) = NOT_EVALUATED on every row and do not appear in the table.

Legend: IP = IN_PROGRESS. C1 shows applied/received. C2 shows the condition status plus instance notes. C3 shows open day-buckets. C4 shows approved testimonials. C7 shows IP until step 46.

| # | Time | Event | C1 | C2 | C3 | C4 | C5 | C6 | C7 | Overall |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Day 0, 10:00:00 | activation_completed (promise: yes; profile_complete: true; snapshot captured) + calendar_day_open, bucket 0 | IP, 0/0 | IP, no requests | IP, 1 | IP, 0 | IP | IP | IP | IN_PROGRESS |
| 2 | Day 0, 14:20 | testimonial_approved T1 | IP, 0/0 | IP | IP, 1 | IP, 1 | IP | IP | IP | IN_PROGRESS |
| 3 | Day 1, 10:00 | calendar_day_open, bucket 1 | IP, 0/0 | IP | IP, 2 | IP, 1 | IP | IP | IP | IN_PROGRESS |
| 4 | Day 2, 09:15 | request_received R1 (deadline Day 3, 09:15:00) | IP, 0/1 | IP, R1 PENDING | IP, 2 | IP, 1 | IP | IP | IP | IN_PROGRESS |
| 5 | Day 2, 10:00 | calendar_day_open, bucket 2 | IP, 0/1 | IP, R1 PENDING | IP, 3 | IP, 1 | IP | IP | IP | IN_PROGRESS |
| 6 | Day 2, 11:40 | request_applied R1 | IP, 1/1 | IP, R1 PENDING | IP, 3 | IP, 1 | IP | IP | IP | IN_PROGRESS |
| 7 | Day 2, 16:05 | request_replied R1 (6h 50m after receipt; satisfies) | IP, 1/1 | IP, R1 SATISFIED | IP, 3 | IP, 1 | IP | IP | IP | IN_PROGRESS |
| 8 | Day 3, 10:00 | calendar_day_open, bucket 3 | IP, 1/1 | IP | IP, 4 | IP, 1 | IP | IP | IP | IN_PROGRESS |
| 9 | Day 3, 15:45 | testimonial_approved T2 | IP, 1/1 | IP | IP, 4 | IP, 2 | IP | IP | IP | IN_PROGRESS |
| 10 | Day 3, 18:30 | request_received R2 (deadline Day 4, 18:30:00) | IP, 1/2 | IP, R2 PENDING | IP, 4 | IP, 2 | IP | IP | IP | IN_PROGRESS |
| 11 | Day 4, 10:00 | calendar_day_open, bucket 4 | IP, 1/2 | IP, R2 PENDING | IP, 5 | IP, 2 | IP | IP | IP | IN_PROGRESS |
| 12 | Day 4, 18:30:01 | time_advanced to 1 second past R2's deadline; no reply exists | IP, 1/2 | **MISSED** (R2 MISSED) | IP, 5 | IP, 2 | IP | IP | IP | **REQUIREMENT_MISSED** |
| 13 | Day 4, 18:30:01 | DUPLICATE DELIVERY: the same time_advanced / deadline observation delivered a second time | IP, 1/2 | MISSED (unchanged) | IP, 5 | IP, 2 | IP | IP | IP | REQUIREMENT_MISSED (unchanged; no new audit entries - idempotency, section 6.1) |
| 14 | Day 5, 10:00 | time_advanced (day rollover; bucket 5 is closed, no event) | IP, 1/2 | MISSED | IP, 5 | IP, 2 | IP | IP | IP | REQUIREMENT_MISSED |
| 15 | Day 6, 10:00 | calendar_day_open, bucket 6 | IP, 1/2 | MISSED | IP, 6 | IP, 2 | IP | IP | IP | REQUIREMENT_MISSED |
| 16 | Day 6, 12:00 | testimonial_approved T3 | IP, 1/2 | MISSED | IP, 6 | IP, 3 | IP | IP | IP | REQUIREMENT_MISSED |
| 17 | Day 7, 10:00 | calendar_day_open, bucket 7. ANNOTATION (no event): the reported 7-day testimonial date (R1 item) passes now, with testimonials at 3 of 5. Nothing changes; no audit entry is written. | IP, 1/2 | MISSED | IP, 7 | IP, 3 | IP | IP | IP | REQUIREMENT_MISSED |
| 18 | Day 8, 10:00 | calendar_day_open, bucket 8 | IP, 1/2 | MISSED | IP, 8 | IP, 3 | IP | IP | IP | REQUIREMENT_MISSED |
| 19 | Day 8, 13:10 | request_received R3 (deadline Day 9, 13:10) | IP, 1/3 | MISSED, R3 PENDING | IP, 8 | IP, 3 | IP | IP | IP | REQUIREMENT_MISSED |
| 20 | Day 8, 15:00 | request_applied R3 | IP, 2/3 | MISSED, R3 PENDING | IP, 8 | IP, 3 | IP | IP | IP | REQUIREMENT_MISSED |
| 21 | Day 8, 20:45 | request_replied R3 (7h 35m; satisfies) | IP, 2/3 | MISSED, R3 SATISFIED | IP, 8 | IP, 3 | IP | IP | IP | REQUIREMENT_MISSED |
| 22 | Day 9, 10:00 | calendar_day_open, bucket 9 | IP, 2/3 | MISSED | IP, 9 | IP, 3 | IP | IP | IP | REQUIREMENT_MISSED |
| 23 | Day 9, 17:20 | testimonial_approved T4 | IP, 2/3 | MISSED | IP, 9 | IP, 4 | IP | IP | IP | REQUIREMENT_MISSED |
| 24 | Day 10 and 11, 10:00 | calendar_day_open, buckets 10 and 11 | IP, 2/3 | MISSED | IP, 11 | IP, 4 | IP | IP | IP | REQUIREMENT_MISSED |
| 25 | Day 12, 10:00 | time_advanced (day rollover; bucket 12 is closed, no event) | IP, 2/3 | MISSED | IP, 11 | IP, 4 | IP | IP | IP | REQUIREMENT_MISSED |
| 26 | Day 13, 10:00 | calendar_day_open, bucket 13 | IP, 2/3 | MISSED | IP, 12 | IP, 4 | IP | IP | IP | REQUIREMENT_MISSED |
| 27 | Day 13, 13:30 | testimonial_approved T5 | IP, 2/3 | MISSED | IP, 12 | **MET, 5** | IP | IP | IP | REQUIREMENT_MISSED |
| 28 | Day 14, 10:00 | calendar_day_open, bucket 14 | IP, 2/3 | MISSED | IP, 13 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 29 | Day 15, 08:20:00 | request_received R4 (deadline Day 16, 08:20:00) | IP, 2/4 | MISSED, R4 PENDING | IP, 13 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 30 | Day 15, 09:10 | request_applied R4 | IP, 3/4 | MISSED, R4 PENDING | IP, 13 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 31 | Day 15, 10:00 | calendar_day_open, bucket 15 | IP, 3/4 | MISSED, R4 PENDING | IP, 14 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 32 | Day 16, 08:19:59 | request_replied R4 - BOUNDARY: 1 second before the deadline; satisfies | IP, 3/4 | MISSED, R4 SATISFIED | IP, 14 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 33 | Day 16 to 20, 10:00 daily | calendar_day_open, buckets 16 to 20 (5 events) | IP, 3/4 | MISSED | IP, 19 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 34 | Day 21, 10:00 | calendar_day_open, bucket 21 | IP, 3/4 | MISSED | IP, 20 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 35 | Day 21, 19:40 | request_received R5 (deadline Day 22, 19:40) | IP, 3/5 | MISSED, R5 PENDING | IP, 20 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 36 | Day 21, 20:15 | request_applied R5 | IP, 4/5 | MISSED, R5 PENDING | IP, 20 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 37 | Day 22, 10:00 | calendar_day_open, bucket 22 | IP, 4/5 | MISSED, R5 PENDING | IP, 21 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 38 | Day 22, 10:30 | request_replied R5 (14h 50m; satisfies) | IP, 4/5 | MISSED, R5 SATISFIED | IP, 21 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 39 | Day 23, 10:00 | calendar_day_open, bucket 23 | IP, 4/5 | MISSED | IP, 22 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 40 | Day 24, 09:00:00 | request_received R6 (deadline Day 25, 09:00:00) | IP, 4/6 | MISSED, R6 PENDING | IP, 22 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 41 | Day 24, 09:30 | request_applied R6 | IP, 5/6 | MISSED, R6 PENDING | IP, 22 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 42 | Day 24, 10:00 | calendar_day_open, bucket 24 | IP, 5/6 | MISSED, R6 PENDING | IP, 23 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 43 | Day 25, 09:00:01 | request_replied R6 - BOUNDARY: 1 second after the deadline; recorded, does not satisfy; instance becomes MISSED (C2 already MISSED, so no condition transition) | IP, 5/6 | MISSED, R6 MISSED | IP, 23 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 44 | Day 25, 10:00 | calendar_day_open, bucket 25 (24th open day) | IP, 5/6 | MISSED | **MET, 24** | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 45 | Day 26 to 29, 10:00 daily | calendar_day_open, buckets 26 to 29 (4 events) | IP, 5/6 | MISSED | MET, 28 | MET, 5 | IP | IP | IP | REQUIREMENT_MISSED |
| 46 | Day 29, 11:00 | refund_claim_filed - INSIDE the period. The event is recorded; C7 takes its unconfirmed-interpretation state and sets the unresolved flag. The overall result does not move: the confirmed miss is primary. | IP, 5/6 | MISSED | MET, 28 | MET, 5 | IP | IP | **CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED** | REQUIREMENT_MISSED (unchanged) |
| 47 | Day 30, 10:00:00 | time_advanced to period_end: finalisation | **MET, 5/6 (25 >= 24)** | MISSED | MET, 28 | MET, 5 | **UNRESOLVED** | **UNRESOLVED** | CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED (unchanged) | **TRACKED_REQUIREMENTS_NOT_MET** |

Notes on the table:
- Rows 24, 33 and 45 compress consecutive calendar_day_open events; each compressed row states the bucket range and the resulting counter, and the intermediate states differ only in that counter, increasing by 1 per bucket. In the simulator each bucket is its own step (section 10.3).
- Buckets 5 and 12 are the only closed days: 28 open buckets in total, and the 24th open bucket is bucket 25, which is why C3 reaches MET at step 44 and not before.
- Step 13 is a test step, not a story event: it delivers step 12's observation again. The expected behaviour is total stillness - same state, zero new audit entries.
- The expected audit trail for this run is section 6.2: exactly 23 entries.

---

## 10. Boundary tests, layout, implementation

### 10.1 Boundary tests (required)

The builder must implement, and the verifier must check, each of these:

| # | Test | Expected behaviour | Where exercised |
|---|---|---|---|
| B1 | Reply 1 second before a deadline | Instance SATISFIED | Demo step 32 (R4) |
| B2 | Reply 1 second after a deadline | Reply recorded; instance MISSED; no satisfaction | Demo step 43 (R6) |
| B3 | Reply exactly at the deadline | Instance SATISFIED (timestamp <= deadline) | Unit test (contract, section 4.2) |
| B4 | Duplicate deadline delivery | No double transition, no duplicate audit entry | Demo step 13 |
| B5 | Duplicate event delivery (any type) | Treated as one event; no duplicate audit entry | Unit test (idempotency keys, section 6.1) |
| B6 | Out-of-order event arrival | Identical derived state: derivation filters and compares by event timestamp, not arrival order | Unit test |
| B7 | Device timezone change mid-period | No change to any derived status: buckets and deadlines are anchored to absolute instants (I14) | Unit test |
| B8 | Event exactly at period end | Outside the period (half-open interval, I1): a request received at Day 30, 10:00:00 counts for nothing | Unit test |
| B9 | Correction flow (`reply_corrected`) | Re-derivation over the corrected log; any changed status transitions through the audit with the correction named as trigger; the original event remains in the log | Unit test (specified in section 4.2; not in the demo fixture) |
| B10 | Withdrawn request (`request_withdrawn`) | Instance WITHDRAWN_UNRESOLVED, listed; C1 and C2 derive UNKNOWN at period end (unless C2 already MISSED); result routes per the truth table | Unit test (specified in section 4.2; not in the demo fixture) |
| B11 | Zero requests in the whole period | C1 and C2 UNKNOWN at period end; result CANNOT_DETERMINE (given no confirmed miss) | Unit test (I4) |
| B12 | Activation without the Promise | NO_PROMISE from activation; C1 to C7 NOT_APPLICABLE; no end-state label ever appears | Unit test (section 3.8) |

### 10.2 Layout

Page structure, phone views, simulator and audit panel follow v1 section 6, with these v2 changes (where this section and v1 differ, this section wins):

- **Header strip** (unchanged in substance): title "Sitter Activation Clarity"; sub-line "A prototype: the Money Back Promise, shown before you pay and tracked from one source of truth."; small print "Working prototype. Not affiliated with Sittsy. All Sittsy wording is quoted from public sources, cited on screen."
- **"Before you pay" view, in order:**
  1. The fee, stated plainly. Standing text: "Sittsy does not publish the activation fee on its website. The amount appears only on the Pay button in the app, and it varies by region and demand." If the scenario's snapshot carries an amount: "On this sitter's Pay button (simulated): GBP 30." Then the published description of what the fee covers, quoted: "It starts identity verification, quality and safety checks and profile review." Then the published EU/UK waiver, quoted and labelled as published wording shown before paying: "By tapping Pay, you request immediate activation of your account and acknowledge that you lose your right of withdrawal." (The source quote names a EUR 50 button; it is presented as wording, not as this sitter's amount. No copy anywhere states or implies any statutory right is lost; the quote is labelled as Sittsy's published wording, and the prototype takes no position on it.)
  2. The C8 card: "The Promise must be part of your activation. A plan without the Money Back Promise is final and non-refundable."
  3. THE CHECKLIST: one card per condition C1 to C7, and nothing else. Each card: sitter-facing text; an evidence badge ("Published" with source for C1 to C4 and C7; "Published - definition unresolved" for C5 and C6); one plain line on the mechanic; the verbatim interpretation labels from section 2 wherever they apply, in smaller text. C5 and C6 cards are visually marked as fact panels, not pass/fail panels. C7's card carries I1's interval label and I9's label.
  4. The reported-conditions section (section 3.9), headed "Reported conditions not present in the published list", visually distinct from the checklist (dashed borders, muted). It is not part of the checklist and is never counted with it.
  5. Market context: the demand panel of section 8.
  6. Footer: "Policy snapshot: published-list-2026-11-17, captured at activation. Market: UK - London. This prototype tracks the published conditions in the snapshot. It does not decide refunds."
- **"Your first 30 days" view:**
  1. Overall banner: the current overall label verbatim from section 5.3 with its sub-line; "Day N of 30"; the period line with I1's and I14's labels.
  2. Condition cards C1 to C7 in order, each with a status chip carrying the status word in text (not colour alone) and the live values:
     - C1: "Applied to A of R requests so far." (or "No requests received yet"), plus I2 and I3 labels in small text.
     - C2: the instance list: id, received time, and per-instance state ("Replied after 6h 50m", "Waiting; deadline Day 9, 13:10", "Deadline passed without a reply, Day 4, 18:30", "Replied 1 second after the deadline; does not satisfy the condition as published", "Withdrawn - treatment unpublished").
     - C3: "Calendar open on N of the first 30 days. Target 24." plus, while in progress, "M more open days needed; K days remain." plus I5's label.
     - C4: "N of 5 approved testimonials." plus I6's label.
     - C5: the fact ("Profile reported complete" / "Profile reported not complete", with change history) plus I7's label and the UNRESOLVED chip after period end. Never a tick or a cross.
     - C6: the fact ("No booking event recorded so far in this period" / "A booking event was recorded on Day N") plus I8's label and the UNRESOLVED chip after period end. Never a tick or a cross.
     - C7: "No refund claim filed in this period." or, after an in-period claim, the claim timestamp, I9's label, and "Your claim is recorded. What it means for the Promise is not published, so this tracker does not decide it." After a post-period claim, the fact line from section 3.7.
  3. The reported-conditions section, identical to the "Before you pay" view, rendered from the same state (always NOT_EVALUATED).
  4. Claim area. During the period: a plain text block, "Claims open after Day 30, in the app. There is no refund during the 30 days." After period end: the overall label repeated, and nothing else; the prototype offers no claim button, because it does not decide claims.
  - Before activation, this view renders with every condition NOT_STARTED and the banner text: "Not started. This is the tracker you would see from the moment you activate; it is the same list you just read, tracked live."
- **Simulator panel:** scenario title "Demo: a London sitter's first 30 days"; current simulated time, large and plain; controls "Run next event", "Run all", "Reset" (Reset restores the empty log and clears the audit trail); the section 9 script as a step list (compressed rows expanded to one row per calendar_day_open event; step 13 labelled "Duplicate delivery (test)"); the naive-mode toggle of section 7.5.
- **Audit panel:** a plain table: columns Seq, Time, Scope, Change, Reason. In the main mode it must match section 6.2 exactly for the demo run: 23 entries.
- **Styling:** as v1 section 6.6 (plain, text-forward, one CSS file, system font, status chips always paired with the status word in text). Chip colours: grey NOT_STARTED / IN_PROGRESS, green MET, red MISSED, amber UNKNOWN / UNRESOLVED / CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED, pale grey dashed for the reported section.

### 10.3 Implementation notes for the builder

- The demo script (section 9) and the naive script (section 7.3) are data: arrays of event objects in the exact order given. "Run next event" appends one event to the log, sets asOf to that event's time, re-derives, and appends any new audit entries per section 6.1.
- Derivation must be the pure function of section 5.1. The audit writer compares the newly derived statuses (conditions, C2 instances, overall) against the last audited statuses and writes one entry per difference whose key is not already present, in this order: C2 instance transitions (by request receipt order), condition transitions C1 to C7, OVERALL.
- Nothing in the UI may hardcode a status, a counter, or an outcome from sections 6.2 or 9; those tables are the test oracle, not inputs. If the implementation's output differs from section 9 or section 6.2, the implementation is wrong.
- The policy snapshot is data on the activation event. A second scenario (e.g. activation without the Promise, B12) is a second activation event payload, not a code path.

---

## 11. Open items the spec deliberately does not settle

These are properties of the published evidence on 17 Nov 2026, not gaps in this document. Each is surfaced in the UI as specified, and none is resolved by invention:

1. No authoritative definition of "profile complete" (C5 UNRESOLVED) or of "booking" (C6 UNRESOLVED). Together they make TRACKED_PUBLISHED_CONDITIONS_MET unreachable on current evidence (section 5.3).
2. Whether an in-period refund claim is a timing matter or voids the Promise (C7's flag, I9).
3. Whether withdrawn or out-of-area requests count toward the 80% (I2, section 4.2).
4. Whether the 7-day testimonial deadline (R1) or the 20-of-30-days presence formulation (R2) forms part of the policy. They are displayed as reported evidence only.
5. The exact start instant of the 30 days (I1's convention is labelled as the prototype's own).
