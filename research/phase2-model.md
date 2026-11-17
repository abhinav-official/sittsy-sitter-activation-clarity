# Sitter Activation Clarity - Phase 2 Model Spec (build-ready)

Prototype: a phone-frame web demo of a pre-activation transparency layer for Sittsy sitters. Two views of one state ("Before you pay" and "Your first 30 days"), an event simulator, and an audit trail.

Sources for every fact in this spec:
- `claims-sheet.md` (Phase 1 research, 17 Nov 2026): verbatim company wording, demand figures, complaint cases.
- `chatgpt-teardown-phase1.md`: the accepted design constraints. This spec follows them exactly. Where the teardown and this spec use a label, the wording is fixed here and the builder must not paraphrase it.

This spec invents no policy. Where Sittsy's published text does not settle a question, the spec says so, names the semantics UNCONFIRMED, and defines a display behaviour that decides nothing on Sittsy's behalf.

---

## 0. Governing rules (apply everywhere)

1. **Single source of truth.** Every displayed status, counter and countdown is produced by one derivation function: `derive(eventLog, policy, now) -> state`. Both phone views, and every number on screen, render values from that one returned state object. No component keeps its own eligibility logic, its own clock, or its own copy of a rule.
2. **Unknown is a state, never a failure.** A condition whose status cannot be derived from published rules plus recorded events shows UNKNOWN. It is never rendered as missed, red, or failed.
3. **No legal-eligibility language.** The UI never says "eligible", "you qualify", "refund approved" or "refund denied". The only overall outcome labels are the three fixed in section 2.4, plus the no-promise label. The tracker tracks published conditions; it does not adjudicate refunds.
4. **Evidence classes are visible.** Every condition carries its evidence class (section 1.1) in the UI, with its source. Reported items are displayed but never evaluated (rule 5).
5. **Reported items are never rules.** The 7-day testimonial deadline and the 20-of-30-days testimonial-presence variant exist in the UI as disclosures only. They produce no status, no countdown that affects anything, no audit transition, and no effect on the overall result.
6. **Requests are requests.** Demand figures are labelled "owner requests". The words bookings, earnings, income and jobs-you-will-get never appear next to a demand figure. No derived ratio (sitters per request, expected bookings) is computed or shown.
7. **The fee is never invented.** No fee amount is hardcoded anywhere. A fee amount may be displayed only when it arrives as data on the activation event (in the real product: the amount on the sitter's own Pay button). The standing disclosure text in section 6.2 is shown regardless.
8. **Determinism.** Given the same event log, policy version and `now`, derivation always returns the same state. A status transition is recorded in the audit trail exactly once: the first derivation in which the new status differs from the last audited status.

---

## 1. Policy model

### 1.1 Evidence classes

| Class | Meaning | Effect on derivation |
|---|---|---|
| Published | The condition appears in Sittsy's own published enumeration or published company statements (source cited per condition). | Evaluated as a rule. |
| Reported enforcement | The condition does not appear in any published text found, but a sitter reports it was enforced against them in a refund denial. | Displayed only. Never evaluated. |
| Unresolved | A reported formulation that conflicts with, or is absent from, the published list, where research could not establish which version applies. | Displayed only. Never evaluated. |

### 1.2 Unconfirmed semantics register

These are questions the published text does not answer. Each one is flagged in the UI with the label given here. The builder must use these label texts verbatim.

| # | Question | What the model does | UI label (verbatim) |
|---|---|---|---|
| U1 | How is "at least 80%" rounded for small counts (e.g. 3 of 4 = 75%, 4 of 5 = 80%)? No rounding rule is published. | Compares the exact ratio applied/received against 0.80, and only at period end. Mid-period it shows counts, not a pass/fail. | "Sittsy has not published how the 80% is rounded. This tracker compares the exact count at day 30." |
| U2 | Zero-request case: if a sitter receives no requests in 30 days, are the request-based conditions met, not met, or not applicable? Not published. | If received = 0 at period end, C1 and C2 derive UNKNOWN, which drives the overall result to "Cannot determine". Mid-period they show "No requests received yet", never 0% and never failed. | "Sittsy has not published what happens if you receive no requests. This tracker will show Cannot determine rather than guess." |
| U3 | Calendar: must the 24 open days be consecutive, or any 24 of the 30? The published wording ("at least 24 of the 30 days") reads cumulative, but this is not confirmed. | Counts cumulative open day-buckets (section 2.2). The assumption is disclosed, not hidden. | "Counted here as any 24 days out of the 30. Sittsy has not published whether the days must be consecutive." |
| U4 | Booking gate: what counts as a "booking" (created, accepted, completed, cancelled)? Not published. | Any `booking_created` event inside the period trips C6. The prototype records the event; it does not interpret cancellations, because no cancellation event or rule is published. | "Sittsy has not published exactly what counts as a booking for this condition." |
| U5 | Claim gate: is "no refund during those 30 days" a timing rule (claims open at day 30) or an eligibility gate (claiming early voids the Promise)? Not published. | A claim filed inside the period sets C7 to UNKNOWN plus an unresolved flag. It is never shown as missed. A claim filed after period end is the published route and changes nothing. | "Sittsy states there is no refund during the 30 days. It has not published whether claiming early affects eligibility, so this tracker records the claim and marks this condition Cannot determine." |
| U6 | Denominator scope: do requests outside the sitter's catchment area count toward the 80%? A sitter reports being counted on far-away requests; the company replied "You are not required to accept a request that is too far away" without saying whether such requests count. Not published. | Every `request_received` event inside the period counts. The simulator has no catchment field, because none is published. | "Sittsy has not published whether requests outside your area count toward the 80%." |
| U7 | What counts as a "reply" (any message, or a substantive response)? Not published. | Any `request_replied` event counts, at its timestamp. | (No separate label; covered by the C2 source note.) |
| U8 | Testimonial timing: the published list gives testimonials no clock of their own. Must the 5 be approved by period end? The promise is assessed after day 30 ("provided all applicable conditions have been met"), so this model evaluates the count at period end. The timing rule itself is not separately published. | Counter evaluated at period end; reaching 5 mid-period shows MET (a count cannot fall in this model, because no published removal rule exists). | (Covered by the R1/R2 disclosure; no separate label.) |
| U9 | "Profile complete": Sittsy does not publish the field list that makes a profile complete, in any source read. | Profile completeness is a single boolean input (activation payload, then `profile_completed` / `profile_incomplete` events). The model never inspects profile fields. | "Sittsy has not published which fields make a profile complete. This tracker takes completeness as reported by the account." |
| U10 | Period start instant: the model starts the 30 days at the `activation_completed` timestamp. Whether Sittsy starts the clock at payment, at activation completion, or at a calendar boundary is not published. | Period = [activation timestamp, activation timestamp + 30 days). Disclosed in the tracker header. | "Your 30 days are counted from activation. Sittsy has not published the exact start moment." |
| U11 | Account restrictions: a sitter reports a 7-day account restriction inside the window (claims sheet case 3). Whether a restriction pauses any clock is not published. | No restriction event exists in the model. Clocks never pause. | (Not labelled in UI; noted here so the builder does not invent a pause feature.) |
| U12 | Apply timing: the published text sets no deadline for applying (unlike replying). | An application counts at its event time, any time inside the period. | (No label.) |

### 1.3 Condition records

Status vocabulary for every condition: `NOT_STARTED`, `IN_PROGRESS`, `MET`, `MISSED`, `UNKNOWN`. Reported items use `NOT_EVALUATED` instead and never leave it.

---

**C1 - Apply rate**
- Sitter-facing text: "Apply to at least 80% of the booking requests you receive in your first 30 days."
- Published wording: "applying to at least 80% of booking requests received" (Sittsy company reply, Trustpilot).
- Mechanic type: period measure (ratio of counters, evaluated at period end).
- Evidence class: Published. Source: company reply enumeration, https://www.trustpilot.com/review/sittsy.com?page=2
- Start event: `activation_completed`. Clock: the 30-day period (section 2.2).
- Counts: denominator = `request_received` events with timestamp inside the period. Requests posted or accepted before activation do not count (published: "requests posted or accepted before activation would not establish a booking after activation", company reply, same source). Numerator = requests in the denominator for which a `request_applied` event exists inside the period.
- Status derivation:
  - Before activation: NOT_STARTED.
  - During period: IN_PROGRESS. Display shows counts only ("Applied to X of Y requests so far"), never a live pass/fail. If Y = 0, display "No requests received yet".
  - It can never become MISSED mid-period: future requests can always change the ratio, so no mid-period state is final.
  - At period end: MET if Y > 0 and X/Y >= 0.80 (exact comparison, U1). MISSED if Y > 0 and X/Y < 0.80. UNKNOWN if Y = 0 (U2).
- Unconfirmed: U1, U2, U6, U12.

**C2 - Reply within 24 hours**
- Sitter-facing text: "Reply to every booking request within 24 hours of receiving it."
- Published wording: "replying to every request within 24 hours" (company reply enumeration, same source as C1).
- Mechanic type: per-request deadline. Each request inside the period spawns one deadline instance.
- Evidence class: Published. Source: as C1.
- Start event: each `request_received` (instance clock starts at that request's timestamp). Deadline = received_at + 24 hours.
- Instance derivation: PENDING while now <= deadline and no reply; SATISFIED if a `request_replied` event for that request exists with timestamp <= deadline (a reply after the deadline is recorded but does not satisfy the instance); MISSED the first moment now > deadline with no satisfying reply.
- Condition status derivation:
  - Before activation: NOT_STARTED.
  - During period: IN_PROGRESS while no instance is MISSED. MISSED from the moment any instance becomes MISSED. MISSED is sticky: later satisfied instances never reverse it, because "every request" can no longer be true.
  - At period end: MET if at least one request was received and every instance is SATISFIED. MISSED if any instance is MISSED (already set). UNKNOWN if zero requests were received (U2).
- Unconfirmed: U2, U7.

**C3 - Calendar open 24 of 30 days**
- Sitter-facing text: "Keep your calendar open on at least 24 of your first 30 days."
- Published wording: "keeping the calendar open for at least 24 of the 30 days" (company reply enumeration, same source as C1).
- Mechanic type: period measure (day counter).
- Evidence class: Published. Source: as C1.
- Start event: `activation_completed`. Clock: day-buckets (section 2.2). A `calendar_day_open` event marks one bucket open.
- Status derivation (counter = distinct buckets inside the period with an open event; elapsed = buckets fully ended; remaining = 30 - elapsed):
  - Before activation: NOT_STARTED.
  - MET as soon as counter >= 24 (under the cumulative reading, U3; the count cannot fall, because buckets are historical facts).
  - MISSED as soon as counter + remaining < 24 (the target is arithmetically unreachable), even mid-period.
  - Otherwise IN_PROGRESS during the period.
  - At period end: MET if counter >= 24, else MISSED (unless already set).
- Unconfirmed: U3, U10 (bucket boundaries follow the period start).

**C4 - Five approved testimonials**
- Sitter-facing text: "Have 5 approved testimonials on your profile. Testimonials can come from previous clients; they do not need to book or pay anything." (Second sentence published: "Testimonials can be provided by previous clients without requiring them to make a new booking or purchase a sitter account", company reply, Trustpilot.)
- Published wording: "having 5 approved testimonials" (company reply enumeration, same source as C1).
- Mechanic type: counter.
- Evidence class: Published. Source: as C1.
- Start event: `activation_completed`. No clock of its own (U8).
- Status derivation: counter = `testimonial_approved` events inside the period. MET as soon as counter >= 5. At period end, MISSED if counter < 5. Otherwise IN_PROGRESS. (Testimonials approved before activation: the published list does not say whether pre-existing testimonials count. The model counts only approvals inside the period and labels this in the UI: "This tracker counts testimonials approved during your first 30 days." This is a modelling choice forced by silence in the source, flagged here, not a published rule.)
- Unconfirmed: U8.

**C5 - Profile complete**
- Sitter-facing text: "Keep your profile complete."
- Published wording: "keeping the profile complete" (company reply enumeration, same source as C1).
- Mechanic type: profile gate (boolean).
- Evidence class: Published. Source: as C1.
- Start event: `activation_completed`, whose payload carries `profile_complete` (boolean). Later changes arrive as `profile_completed` / `profile_incomplete` events.
- Status derivation: MET while the boolean is true. During the period, IN_PROGRESS with display text "Profile is not complete" while false. At period end, MISSED if false at period end. (Whether a mid-period gap that is later fixed counts against the sitter is not published; the model evaluates the state at period end and labels this: "Sittsy has not published whether a gap in profile completeness during the 30 days matters if it is fixed before day 30. This tracker checks the state at day 30.")
- Unconfirmed: U9.

**C6 - No booking in the period**
- Sitter-facing text: "The Promise applies only if you receive no booking in your first 30 days."
- Published wording: "you meet all applicable conditions and receive no booking within 30 days" (company reply, same source as C1).
- Mechanic type: binary gate.
- Evidence class: Published. Source: as C1.
- Start event: `activation_completed`.
- Status derivation: IN_PROGRESS during the period while no `booking_created` event exists inside the period. MISSED the moment one occurs (sticky). MET at period end if none occurred.
- Unconfirmed: U4.

**C7 - No refund claim during the period**
- Sitter-facing text: "You cannot claim during the first 30 days. Claims are made in the app after day 30."
- Published wording: "There is no refund during those 30 days." and "you can request a refund directly in the app after at least 30 days, provided all applicable conditions have been met." (company replies, same source as C1).
- Mechanic type: binary gate (semantics unconfirmed, U5).
- Evidence class: Published (the statement is published; its exact legal effect is not).
- Start event: `activation_completed`.
- Status derivation: IN_PROGRESS during the period while no `refund_claim_filed` event exists inside the period. A claim inside the period sets UNKNOWN plus an unresolved flag (never MISSED, per U5). At period end: MET if no claim was filed inside the period; UNKNOWN if one was. A claim filed at or after period end is recorded as a note and changes no status.
- Unconfirmed: U5.

**C8 - Promise included in the activation (precondition)**
- Sitter-facing text: "Your activation must include the Money Back Promise. Activations without it are final and non-refundable, and the payment screen states this before paying."
- Published wording: "If your activation includes it..." and "A plan without the Money Back Promise is final and non-refundable, and the payment screen states this before paying." (company replies, same source as C1).
- Mechanic type: binary gate, evaluated once, at activation.
- Evidence class: Published. Source: as C1.
- Derivation: read from the `activation_completed` payload field `plan_includes_promise`. If false, the tracker enters the NO_PROMISE overall state (section 2.4) and C1 to C7 are displayed for information with status NOT_APPLICABLE. The three outcome labels never appear for a no-promise activation, because there is no promise to evaluate.

**R1 - Testimonial collection deadline, 7 days (REPORTED, never evaluated)**
- Display text: "Reported but not published: one sitter was refused a refund over a 7-day deadline for collecting testimonials. This deadline appears in no published Sittsy condition list we could find."
- Mechanic type: none. Display record only.
- Evidence class: Reported enforcement. Source: sitter's account of her denial, Padua case, https://www.trustpilot.com/review/sittsy.com (review dated 2 Nov 2026).
- Status: NOT_EVALUATED at all times. No clock runs. If the demo timeline passes the reported 7-day date, nothing changes and no audit entry is written; an annotation in the demo script (section 5) marks the moment so a viewer can see the non-event.

**R2 - Testimonial presence, 20 of 30 days (REPORTED, never evaluated)**
- Display text: "Reported but not published: one sitter's in-app terms reportedly required five approved testimonials to remain on the profile for at least 20 of the 30 days. The published list contains no presence requirement."
- Mechanic type: none. Display record only.
- Evidence class: Unresolved (a sitter's account of terms shown to her, conflicting with the published enumeration). Source: Padua case, same source as R1.
- Status: NOT_EVALUATED at all times.

**Not conditions (recorded here so the builder does not add them):**
- Chargeback consequence ("initiating a payment dispute or chargeback may result in permanent suspension from the platform", company reply). A platform consequence, not a Promise condition. It appears nowhere in the tracker UI.
- Demand level. Published: "Eligibility for the guarantee is based on the stated terms and conditions, not on the number of sitters in your town." Demand is context (section 4), never an input to derivation.

---

## 2. Event model and state machine

### 2.1 Event catalogue

All events are timestamped, append-only, and carry the simulated clock time at which they occur. The event log is the only input to derivation, together with the policy version and `now`.

| Event | Payload | Notes |
|---|---|---|
| `activation_completed` | `plan_includes_promise` (bool), `profile_complete` (bool), `fee_amount_shown` (string or null) | Starts the period. `fee_amount_shown` is the amount on this sitter's Pay button, supplied as data; null means "not shown" and the UI prints no amount (rule 7). |
| `request_received` | `request_id` | Counts toward C1/C2 only if its timestamp is inside the period (pre-activation requests never enter the log in this prototype; in a real feed they would be filtered by the period test). |
| `request_applied` | `request_id` | Counts for C1 if inside the period. No deadline (U12). |
| `request_replied` | `request_id` | Satisfies the C2 instance only if timestamp <= received_at + 24h. A later reply is still logged. |
| `calendar_day_open` | `bucket_index` (0 to 29) | Marks one day-bucket open for C3. |
| `testimonial_approved` | `testimonial_id` | Increments C4 if inside the period. |
| `profile_completed` / `profile_incomplete` | none | Sets the C5 boolean. |
| `booking_created` | `booking_id` | Trips C6 if inside the period (U4). |
| `refund_claim_filed` | none | Inside the period: C7 to UNKNOWN (U5). At/after period end: audit note only. |
| `time_advanced` | `to` (timestamp) | Simulator clock event. Sets `now`. Deadline and period-end transitions are observed at the first `time_advanced` (or any later event) whose time passes the relevant threshold. |
| `period_ended` | none | Not a stored event: it is derived when `now >= period_end`. The simulator emits it implicitly by advancing time past period end. Listed here so the builder implements finalisation as a derivation step, not a button. |

Policy object: `{ version: "published-list-2026-11-17", conditions: [C1..C8], reported: [R1, R2] }`. The version string is shown in the tracker footer and recorded in every audit entry. If the published list is ever re-read and changes, the version changes; derivations under different versions are never mixed.

### 2.2 Clock semantics

- `period_start` = timestamp of `activation_completed`. `period_end` = `period_start` + 30 days (720 hours). The period is the half-open interval [period_start, period_end). An event exactly at period_end is outside the period.
- Day-buckets for C3: bucket k covers [period_start + k*24h, period_start + (k+1)*24h), k = 0..29. "Elapsed buckets" at time `now` = number of buckets whose end is <= now.
- C2 deadlines are computed from event timestamps, not buckets: deadline = received_at + 24h exactly.
- All demo times are expressed relative to activation: "Day N HH:MM" means period_start + N days + (HH:MM minus the activation time of day). In the demo script, activation is Day 0, 10:00, so "Day 4 18:30" is unambiguous.
- Time only moves when the simulator applies an event or a `time_advanced`. Derivation is always evaluated at the current `now`.

### 2.3 Condition status machine

Every evaluated condition moves through: NOT_STARTED (before activation) -> IN_PROGRESS (at activation) -> one of MET / MISSED / UNKNOWN. MET and MISSED may be reached mid-period only where section 1.3 says the state is already determined (C2 instance miss, C3 target reached or unreachable, C4 target reached, C6 booking). All other final values are set at period finalisation. MISSED is always sticky. UNKNOWN is set only where section 1.3 defines it (C1/C2 zero-request at period end, C7 early claim). At finalisation, any evaluated condition still IN_PROGRESS resolves per its section 1.3 rule.

### 2.4 Overall states and labels

The overall result is derived from the statuses of C1 to C7 plus unresolved flags. It is never stored independently of them.

| State | When | UI label (verbatim) |
|---|---|---|
| PRE_ACTIVATION | No `activation_completed` yet. The "Before you pay" view; no result exists. | (No result label. Header text: "Before you pay: what the Money Back Promise actually requires.") |
| NO_PROMISE | Activation with `plan_includes_promise = false`. Terminal. | "No Money Back Promise on this activation" |
| IN_PROGRESS | Period running, no evaluated condition MISSED, no early determination. | "In progress: no tracked condition missed yet" |
| NOT_MET (early) | Any evaluated condition becomes MISSED mid-period. The clock keeps running and other conditions keep tracking; the result does not change again. | "Not met" (with a sub-line: "Determined on Day N at HH:MM by [condition name]. The remaining conditions are still tracked below.") |
| ENDED_MET | Period ended; C1 to C7 all MET. | "All tracked conditions met (published list)" |
| ENDED_NOT_MET | Period ended; any of C1 to C7 MISSED (whether determined early or at finalisation). | "Not met" |
| ENDED_UNKNOWN | Period ended; none MISSED, but at least one UNKNOWN (zero-request case or early-claim case). | "Cannot determine" (with a sub-line naming the condition(s) whose status is unknown and why) |

Derivation order at any `now`: (1) if no activation, PRE_ACTIVATION. (2) If activation without promise, NO_PROMISE. (3) If any condition MISSED: NOT_MET (early if now < period_end, else ENDED_NOT_MET). (4) If now < period_end: IN_PROGRESS. (5) At/after period end: any UNKNOWN gives ENDED_UNKNOWN; otherwise ENDED_MET.

Standing disclosure: R1 and R2 unresolved flags are displayed next to every overall label from activation onward, as a separate section ("Reported, not in the published list"). They do not alter the result, because the ENDED_MET label is explicitly scoped to the published list. The flags that do alter the result are the UNKNOWN statuses defined in section 1.3, and each such flag names its unconfirmed-semantics entry (U2 or U5).

### 2.5 Audit trail

Every condition transition and every overall transition writes exactly one audit entry, at the moment a derivation first produces the new status (rule 8). Entry format:

```
{ seq, at, scope, trigger, from, to, reason, policy_version }
```

- `seq`: 1-based, in write order.
- `at`: the `now` at which the transition was observed (for deadline transitions, the time of the `time_advanced` or event that first passed the deadline; the reason states the deadline itself).
- `scope`: a condition id (C1..C7) or OVERALL.
- `trigger`: the event that caused the re-derivation (type plus id where applicable, e.g. "time_advanced to Day 4 18:30", "testimonial_approved T5").
- `from` / `to`: previous and new status. NOTE entries (finalisation confirmation, post-period claim) use from == to and kind NOTE; they record facts, not transitions.
- `reason`: a human sentence naming the rule and the numbers, e.g. "Request R2 (received Day 3, 18:30) had no reply by its 24-hour deadline (Day 4, 18:30). Replying to every request within 24 hours can no longer be met."
- `policy_version`: "published-list-2026-11-17".

Activation writes the initial transitions: each of C1 to C7 from NOT_STARTED to its first derived status, and OVERALL from PRE_ACTIVATION to IN_PROGRESS (or NO_PROMISE). Reported items never write audit entries, because they never transition.

The audit panel shows entries in seq order and is never edited, filtered or re-derived: it is the append-only record of what the single derivation produced, which is what makes "the state changed exactly once, and here is why" a checkable claim.

---

## 3. Contradiction demo ("naive mode")

### 3.1 The documented failure

From the Padua case (claims sheet, complaint case 1): the sitter reports that "while one notification stated that my refund eligibility had expired, another section still displayed an active countdown for the same task." Two parts of the same app, describing the same task (testimonials), held two contradictory states at the same moment: expired, and still counting down.

### 3.2 Naive mode design

Naive mode is a deliberate reconstruction of that symptom. It is not a claim about Sittsy's actual code; it is the smallest implementation that produces the documented behaviour, built so a viewer can watch it happen. It has two independent computations over the testimonials task, sharing nothing:

- **Widget A, the countdown.** Its own rule text: testimonials must remain present for 20 of the 30 days (the R2 formulation). It computes remaining time from its own start timestamp: `remaining = period_end - now`, and renders "N days left" plus the approved count. It knows nothing about any deadline for collecting the testimonials.
- **Widget B, the status flag.** Its own rule text: testimonials must be collected within 7 days (the R1 formulation). It computes `collected >= 5 OR now <= activation + 7 days`, and latches a boolean: the moment now passes activation + 7 days with fewer than 5 approved, it sets status = EXPIRED and posts a notification, "Your refund eligibility has expired." It never looks at the countdown, and once latched it never updates again.

Each widget reads a different rule from a different source, keeps its own state, and renders independently. That is the whole design; the contradiction is not a bug added on top, it is what two unsynchronised rule implementations naturally produce.

### 3.3 Exact scripted sequence (naive timeline)

A separate, short event sequence drives naive mode. Times relative to a naive activation at Day 0, 10:00.

| Step | Time | Event | Widget A (countdown) shows | Widget B (status flag) shows |
|---|---|---|---|---|
| N0 | Day 0, 10:00 | activation | "30 days left", testimonials 0 of 5 | ACTIVE, deadline Day 7, 10:00 |
| N1 | Day 2, 11:00 | testimonial approved (1) | "28 days left", 1 of 5 | ACTIVE, 1 of 5 |
| N2 | Day 4, 09:30 | testimonial approved (2) | "26 days left", 2 of 5 | ACTIVE, 2 of 5 |
| N3 | Day 7, 10:00 | clock passes the 7-day collection deadline at 2 of 5 | "23 days left", 2 of 5 | **EXPIRED** + notification "Your refund eligibility has expired." |
| N4 | Day 8, 15:00 | testimonial approved (3) | "22 days left", 3 of 5 | EXPIRED (latched; the new testimonial changes nothing) |

At N3 the screen shows, for one and the same task: EXPIRED, and a live countdown with 23 days left. At N4 the widgets also disagree about whether progress is still possible. This is the documented Padua symptom, reproduced from a script.

### 3.4 Why the single-source model cannot produce it

In the real model (sections 1 and 2) there is exactly one status for the testimonials condition, produced by one function from the event log, the policy and `now`. Both phone views render that same value; there is no second computation to disagree with it. The two rules that collided in naive mode are handled as follows:

- The published rule (5 approved testimonials, a counter) is C4, the only testimonial rule that is evaluated.
- The 7-day deadline (R1) and the 20-of-30-days presence rule (R2) are displayed as reported items with status NOT_EVALUATED. They own no clock, no flag and no rendering path that could contradict C4.

Formally: every displayed state is `f(eventLog, policy, now)` for a single `f`. Two renderings of one value cannot disagree, and a rule that is never evaluated cannot expire anything. The audit trail (section 2.5) is the positive counterpart: when a status does change, it changes once, at a derivable moment, with the reason written down.

### 3.5 Presentation

Naive mode is a toggle in the simulator panel (section 6). Turning it on switches the phone to the naive screen (the two widgets, visually plain, labelled "Naive mode: two independent rules, as reported by sitters") and loads the N0 to N4 script into the simulator. Turning it off returns to the single-source model and the main demo script. The two modes never share state.

---

## 4. Demand panel data

### 4.1 The only figures the panel may show

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

### 4.2 Labelling rules

- The panel heading is: "Owner requests in the last 30 days, as published by Sittsy". The word "requests" is used in every row and label; the published framing line may be quoted: "how many owner requests reached the city in the last 30 days".
- Requests are never converted into bookings, earnings, or probabilities. No sitters-per-request ratio, no ranking labelled "best city", no recommendation. The two published numbers sit side by side and speak for themselves.
- The panel is a market-context section inside the "Before you pay" view, placed after the condition list (teardown constraint: demand never leads).
- The city selector offers exactly: the 12 UK cities above, Auckland, and "Jaipur, India". No other geography may be added without a published figure behind it.

### 4.3 The no-data state (India / Jaipur)

Selecting Jaipur shows the no-data state, verbatim copy:

> "No published data. Sittsy publishes no demand figures for India, and no India page was found. There is no number to show here, and this prototype will not invent one."

This state is a designed part of the demo, not an error: it is the honest answer for the market the viewer is standing in, and it demonstrates rule: where Sittsy publishes nothing, the screen says so.

---

## 5. Demo script (main timeline)

One sitter, one coherent run. The sitter is in London (demand context shown in the "Before you pay" view is the published London row: 126 sitters, 36 owner requests in the last 30 days, labelled as published data, section 4). Activation is Day 0, 10:00; the period ends Day 30, 10:00.

The story in one paragraph: she activates with the Promise on her plan and a complete profile. Two testimonials arrive in the first days. Request R1 is applied to and answered inside a day. Request R2 is never answered; at Day 4, 18:30 its 24-hour deadline passes, C2 becomes MISSED exactly once, the overall result becomes "Not met" exactly once, and the audit trail says why. She keeps going regardless: testimonials reach 5 (Day 13), the calendar reaches 24 open days (Day 25), three more requests are all applied to and answered in time, and at period end the apply rate lands on exactly 80%. Final result: "Not met", determined on Day 4 by the reply condition, with every other published condition met. The reported 7-day testimonial date passes on Day 7 and changes nothing, which is the point of it.

Standing values on every row: C5 = MET (profile complete from activation, never changes). R1 and R2 = NOT_EVALUATED on every row. The fee shown in the demo activation is "£30": see the note under the table.

Legend: IP = IN_PROGRESS. C1 shows applied/received. C3 shows open days. C4 shows approved testimonials. C2 instance detail is in the Event column.

| # | Time | Event | C1 | C2 | C3 | C4 | C6 | C7 | Overall |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Day 0, 10:00 | activation_completed (promise: yes; profile_complete: true; fee_amount_shown: "£30") + calendar_day_open, bucket 0 | IP, 0 received | IP, no requests | IP, 1 | IP, 0 | IP | IP | IN_PROGRESS |
| 2 | Day 0, 14:20 | testimonial_approved T1 | IP, 0 | IP | IP, 1 | IP, 1 | IP | IP | IN_PROGRESS |
| 3 | Day 1, 10:00 | calendar_day_open, bucket 1 | IP, 0 | IP | IP, 2 | IP, 1 | IP | IP | IN_PROGRESS |
| 4 | Day 2, 09:15 | request_received R1 (deadline Day 3, 09:15) | IP, 0/1 | IP, R1 pending | IP, 2 | IP, 1 | IP | IP | IN_PROGRESS |
| 5 | Day 2, 10:00 | calendar_day_open, bucket 2 | IP, 0/1 | IP, R1 pending | IP, 3 | IP, 1 | IP | IP | IN_PROGRESS |
| 6 | Day 2, 11:40 | request_applied R1 | IP, 1/1 | IP, R1 pending | IP, 3 | IP, 1 | IP | IP | IN_PROGRESS |
| 7 | Day 2, 16:05 | request_replied R1 (6h 50m after receipt) | IP, 1/1 | IP, R1 satisfied | IP, 3 | IP, 1 | IP | IP | IN_PROGRESS |
| 8 | Day 3, 10:00 | calendar_day_open, bucket 3 | IP, 1/1 | IP | IP, 4 | IP, 1 | IP | IP | IN_PROGRESS |
| 9 | Day 3, 15:45 | testimonial_approved T2 | IP, 1/1 | IP | IP, 4 | IP, 2 | IP | IP | IN_PROGRESS |
| 10 | Day 3, 18:30 | request_received R2 (deadline Day 4, 18:30) | IP, 1/2 | IP, R2 pending | IP, 4 | IP, 2 | IP | IP | IN_PROGRESS |
| 11 | Day 4, 10:00 | calendar_day_open, bucket 4 | IP, 1/2 | IP, R2 pending | IP, 5 | IP, 2 | IP | IP | IN_PROGRESS |
| 12 | Day 4, 18:30 | time_advanced past R2's deadline; no reply exists | IP, 1/2 | **MISSED** | IP, 5 | IP, 2 | IP | IP | **NOT_MET (early, by C2)** |
| 13 | Day 5, 10:00 | Day rollover; bucket 5 is closed, no event | IP, 1/2 | MISSED | IP, 5 | IP, 2 | IP | IP | NOT_MET |
| 14 | Day 6, 10:00 | calendar_day_open, bucket 6 | IP, 1/2 | MISSED | IP, 6 | IP, 2 | IP | IP | NOT_MET |
| 15 | Day 6, 12:00 | testimonial_approved T3 | IP, 1/2 | MISSED | IP, 6 | IP, 3 | IP | IP | NOT_MET |
| 16 | Day 7, 10:00 | calendar_day_open, bucket 7. ANNOTATION (no event): the reported 7-day testimonial date (R1) passes now, with testimonials at 3 of 5. Nothing changes; no audit entry is written. | IP, 1/2 | MISSED | IP, 7 | IP, 3 | IP | IP | NOT_MET |
| 17 | Day 8, 10:00 | calendar_day_open, bucket 8 | IP, 1/2 | MISSED | IP, 8 | IP, 3 | IP | IP | NOT_MET |
| 18 | Day 8, 13:10 | request_received R3 (deadline Day 9, 13:10) | IP, 1/3 | MISSED, R3 pending | IP, 8 | IP, 3 | IP | IP | NOT_MET |
| 19 | Day 8, 15:00 | request_applied R3 | IP, 2/3 | MISSED, R3 pending | IP, 8 | IP, 3 | IP | IP | NOT_MET |
| 20 | Day 8, 20:45 | request_replied R3 (7h 35m) | IP, 2/3 | MISSED, R3 satisfied | IP, 8 | IP, 3 | IP | IP | NOT_MET |
| 21 | Day 9, 10:00 | calendar_day_open, bucket 9 | IP, 2/3 | MISSED | IP, 9 | IP, 3 | IP | IP | NOT_MET |
| 22 | Day 9, 17:20 | testimonial_approved T4 | IP, 2/3 | MISSED | IP, 9 | IP, 4 | IP | IP | NOT_MET |
| 23 | Day 10 and 11, 10:00 | calendar_day_open, buckets 10 and 11 | IP, 2/3 | MISSED | IP, 11 | IP, 4 | IP | IP | NOT_MET |
| 24 | Day 12, 10:00 | Day rollover; bucket 12 is closed, no event | IP, 2/3 | MISSED | IP, 11 | IP, 4 | IP | IP | NOT_MET |
| 25 | Day 13, 10:00 | calendar_day_open, bucket 13 | IP, 2/3 | MISSED | IP, 12 | IP, 4 | IP | IP | NOT_MET |
| 26 | Day 13, 13:30 | testimonial_approved T5 | IP, 2/3 | MISSED | IP, 12 | **MET, 5** | IP | IP | NOT_MET |
| 27 | Day 14, 10:00 | calendar_day_open, bucket 14 | IP, 2/3 | MISSED | IP, 13 | MET, 5 | IP | IP | NOT_MET |
| 28 | Day 15, 08:20 | request_received R4 (deadline Day 16, 08:20) | IP, 2/4 | MISSED, R4 pending | IP, 13 | MET, 5 | IP | IP | NOT_MET |
| 29 | Day 15, 09:05 | request_replied R4 (45m) | IP, 2/4 | MISSED, R4 satisfied | IP, 13 | MET, 5 | IP | IP | NOT_MET |
| 30 | Day 15, 09:10 | request_applied R4 | IP, 3/4 | MISSED, R4 satisfied | IP, 13 | MET, 5 | IP | IP | NOT_MET |
| 31 | Day 15, 10:00 | calendar_day_open, bucket 15 | IP, 3/4 | MISSED | IP, 14 | MET, 5 | IP | IP | NOT_MET |
| 32 | Day 16 to 20, 10:00 daily | calendar_day_open, buckets 16 to 20 (5 events) | IP, 3/4 | MISSED | IP, 19 | MET, 5 | IP | IP | NOT_MET |
| 33 | Day 21, 10:00 | calendar_day_open, bucket 21 | IP, 3/4 | MISSED | IP, 20 | MET, 5 | IP | IP | NOT_MET |
| 34 | Day 21, 19:40 | request_received R5 (deadline Day 22, 19:40) | IP, 3/5 | MISSED, R5 pending | IP, 20 | MET, 5 | IP | IP | NOT_MET |
| 35 | Day 21, 20:15 | request_applied R5 | IP, 4/5 | MISSED, R5 pending | IP, 20 | MET, 5 | IP | IP | NOT_MET |
| 36 | Day 22, 10:00 | calendar_day_open, bucket 22 | IP, 4/5 | MISSED, R5 pending | IP, 21 | MET, 5 | IP | IP | NOT_MET |
| 37 | Day 22, 10:30 | request_replied R5 (14h 50m) | IP, 4/5 | MISSED, R5 satisfied | IP, 21 | MET, 5 | IP | IP | NOT_MET |
| 38 | Day 23 and 24, 10:00 | calendar_day_open, buckets 23 and 24 | IP, 4/5 | MISSED | IP, 23 | MET, 5 | IP | IP | NOT_MET |
| 39 | Day 25, 10:00 | calendar_day_open, bucket 25 | IP, 4/5 | MISSED | **MET, 24** | MET, 5 | IP | IP | NOT_MET |
| 40 | Day 26 to 29, 10:00 daily | calendar_day_open, buckets 26 to 29 (4 events) | IP, 4/5 | MISSED | MET, 28 | MET, 5 | IP | IP | NOT_MET |
| 41 | Day 30, 10:00 | time_advanced to period_end: finalisation | **MET, 4/5 = 80%** | MISSED | MET, 28 | MET, 5 | **MET** | **MET** | **NOT_MET (final)** |
| 42 | Day 30, 12:00 | refund_claim_filed (after period end, the published route) | MET | MISSED | MET | MET | MET | MET | NOT_MET (unchanged; audit NOTE only) |

Notes on the table:
- C5 is MET on every row and is omitted from the columns to keep the table readable; a verifier should confirm it never moves.
- Rows 23, 32, 38 and 40 compress consecutive calendar_day_open events; each compressed row states the bucket range and the resulting counter, and the intermediate states differ only in that counter, increasing by 1 per bucket.
- Fee note: the demo activation carries fee_amount_shown "£30". Provenance: £30 is the amount a UK sitter reports paying (claims sheet, complaint case 3); company-evidenced amounts in the sources are in EUR (€50, €29, €75). The demo value is scenario data supplied on the activation event, exactly as the real amount would arrive from the Pay button; it is labelled in the UI as "the amount on this sitter's Pay button (simulated)". No amount is hardcoded in code (rule 7).

### 5.1 Expected audit trail for the demo run

A correct implementation produces exactly these 17 entries, in this order:

| Seq | At | Scope | From -> To | Reason (substance) |
|---|---|---|---|---|
| 1 to 7 | Day 0, 10:00 | C1, C2, C3, C4, C5, C6, C7 | NOT_STARTED -> IN_PROGRESS (C5 -> MET) | Activation. C5: "Profile reported complete at activation." |
| 8 | Day 0, 10:00 | OVERALL | PRE_ACTIVATION -> IN_PROGRESS | "Activation includes the Money Back Promise. Tracking the published conditions." |
| 9 | Day 4, 18:30 | C2 | IN_PROGRESS -> MISSED | "Request R2 (received Day 3, 18:30) had no reply by its 24-hour deadline (Day 4, 18:30). Replying to every request within 24 hours can no longer be met." |
| 10 | Day 4, 18:30 | OVERALL | IN_PROGRESS -> NOT_MET | "Condition C2 (reply to every request within 24 hours) was missed. The result is determined before the period ends; the remaining conditions continue to be tracked." |
| 11 | Day 13, 13:30 | C4 | IN_PROGRESS -> MET | "5th approved testimonial received (T5). Target of 5 reached." |
| 12 | Day 25, 10:00 | C3 | IN_PROGRESS -> MET | "Calendar open on 24 of the first 30 days (Day 25). Target reached." |
| 13 | Day 30, 10:00 | C1 | IN_PROGRESS -> MET | "Period ended. Applied to 4 of 5 requests received = 80%. Target met." |
| 14 | Day 30, 10:00 | C6 | IN_PROGRESS -> MET | "Period ended with no booking created." |
| 15 | Day 30, 10:00 | C7 | IN_PROGRESS -> MET | "Period ended with no refund claim filed during the 30 days." |
| 16 | Day 30, 10:00 | OVERALL | NOTE (NOT_MET -> NOT_MET) | "Period ended. Result confirmed: Not met, determined on Day 4, 18:30 by C2." |
| 17 | Day 30, 12:00 | OVERALL | NOTE | "Refund claim filed after the period ended, through the in-app route. Recorded; it changes no tracked status. This prototype does not decide the claim." |

No other entries may appear. In particular: no entry at Day 7 for R1, no entry for any satisfied C2 instance (satisfaction is not a condition transition), and no second OVERALL transition after seq 10.

---

## 6. Layout

### 6.1 Page structure

A single web page, two columns on desktop (stacked, phone first, below about 900px):

- **Header strip** (full width, one line each): title "Sitter Activation Clarity"; sub-line "A prototype: the Money Back Promise, shown before you pay and tracked from one source of truth."; small print "Working prototype. Not affiliated with Sittsy. All Sittsy wording is quoted from public sources, cited on screen."
- **Left column: the phone.** A phone frame (about 380px wide, bordered, rounded corners) containing the tracker. A two-tab switcher at the top of the screen: "Before you pay" / "Your first 30 days". Switching tabs changes only what is rendered; both tabs render the same derived state object.
- **Right column: simulator panel on top, audit trail below it.**

### 6.2 Phone, view A: "Before you pay"

Sections in this order:

1. **The fee, stated plainly.** Standing text: "Sittsy does not publish the activation fee on its website. The amount appears only on the Pay button in the app, and it varies by region and demand." If the scenario's activation data carries an amount, it is shown as: "On this sitter's Pay button (simulated): £30." Then the published description of what the fee covers, quoted: "It starts identity verification, quality and safety checks and profile review." Then the published waiver, quoted and labelled as shown before paying in the EU/UK: "By tapping Pay, you request immediate activation of your account and acknowledge that you lose your right of withdrawal." (The source quote names a €50 button; the quote is presented as wording, not as this sitter's amount.)
2. **What the Money Back Promise requires.** First the C8 card: "The Promise must be part of your activation. A plan without the Money Back Promise is final and non-refundable." Then one card per condition C1 to C7: the sitter-facing text from section 1.3; a badge "Published" with the source ("Sittsy's published condition list, in its Trustpilot replies"); one plain line on the mechanic ("Counted at day 30 from the requests you receive", "A separate 24-hour clock for every request", and so on); and the unconfirmed-semantics labels from section 1.2 wherever they apply, in smaller text.
3. **Reported, but not in the published list.** R1 and R2 cards, visually muted (dashed border), badged "Reported - not evaluated". One line above them: "Sitters have reported being judged on conditions that do not appear in the published list. They are shown here so nothing is a surprise. This tracker does not evaluate them, because Sittsy has not published them."
4. **Market context.** The demand panel of section 4, with its city selector and its no-data state.
5. **Footer.** "Policy version: published-list-2026-11-17. This prototype tracks the published conditions. It does not decide refunds."

Before activation, this is the default view.

### 6.3 Phone, view B: "Your first 30 days"

1. **Overall banner.** The current overall label, verbatim from section 2.4, with its sub-line where one is defined. Plus "Day N of 30" and the period line: "Your 30 days run from activation, Day 0, 10:00, to Day 30, 10:00." plus label U10.
2. **Condition cards, C1 to C7,** in order. Each card: sitter-facing text; a status chip carrying the status word in text (not colour alone); the live values:
   - C1: "Applied to X of Y requests so far." (or "No requests received yet"), plus label U1, and U6 in small text.
   - C2: a list of requests: id, received time, and per-instance state: "Replied after 6h 50m", "Waiting; deadline Day 9, 13:10", or "Deadline passed without a reply, Day 4, 18:30".
   - C3: "Calendar open on N of the first 30 days. Target 24." plus, while in progress, "M more open days needed; K days remain." plus label U3.
   - C4: "N of 5 approved testimonials."
   - C5: "Profile complete." or "Profile is not complete." plus label U9.
   - C6: "No booking so far in this period." or "A booking was created on Day N." plus label U4.
   - C7: "No refund claim filed in this period." or, in the early-claim case, the U5 label text. After a post-period claim: "Claim filed on Day 30, after the period ended. Recorded; this tracker does not decide it."
3. **Reported section.** Identical R1/R2 cards as view A, rendered from the same state (always NOT_EVALUATED).
4. **Claim area.** During the period: a plain text block, "Claims open after Day 30, in the app. There is no refund during the 30 days." After period end: the overall label repeated, and nothing else; the prototype offers no claim button, because it does not decide claims.

Before activation, view B renders with every condition NOT_STARTED and the banner text: "Not started. This is the tracker you would see from the moment you activate; it is the same list you just read, tracked live."

### 6.4 Simulator panel

- Scenario title: "Demo: a London sitter's first 30 days". Current simulated time, large and plain: "Day 4, 18:30".
- Controls: "Run next event", "Run all", "Reset". Reset restores the empty event log and clears the audit trail.
- The script (section 5, steps 1 to 42) as a list: each row shows step number, time and event name; applied steps are ticked. Rows 23, 32, 38 and 40 expand to one row per calendar_day_open event in the simulator (the compression exists only in this document).
- **Naive mode toggle.** Switching it on: the phone swaps to the naive screen (the two widgets of section 3.2, headed "Naive mode: two independent rules, no shared state"), the simulator loads steps N0 to N4, and the audit panel is replaced by the note: "Naive mode keeps no audit trail. Two parts of the screen disagree, and nothing records why. That is the problem this prototype demonstrates." Switching off restores the main script and state exactly as left (the two modes keep separate logs).

### 6.5 Audit panel

A plain table under the simulator: columns Seq, Time, Scope, Change, Reason. Entries appear in seq order as they are written and the panel scrolls to the newest. Nothing in the panel is editable. In the main mode it must match section 5.1 exactly for the demo run: 17 entries.

### 6.6 Styling

Plain, text-forward, working-prototype styling; not a marketing page. One CSS file. System font stack. White background, near-black text, 1px solid borders, small corner radius on cards (the phone frame itself is the only strongly rounded element). No gradients, no images, no illustrations, no hero section, no promotional copy anywhere. Colour is used only on status chips, always together with the status word in text: grey for NOT_STARTED and IN_PROGRESS, green for MET, red for MISSED, amber for UNKNOWN, pale grey with a dashed border for the reported items. Every number on screen carries a text label saying what it counts and over what period.

### 6.7 Implementation notes for the builder

- The demo script (section 5) and the naive script (section 3.3) are data: arrays of event objects in the exact order given. "Run next event" appends one event to the log, sets `now` to that event's time, re-derives, and appends any new audit entries.
- `time_advanced` steps (12 and 41) are script rows like any other; step 41's timestamp is period_end, which triggers finalisation inside derivation.
- Derivation must be a pure function of (event log, policy, now). The audit writer compares the newly derived statuses with the last audited statuses and writes one entry per difference, in condition order C1 to C7, then OVERALL.
- Nothing in the UI may hardcode a status, a counter, or an outcome from section 5; those tables are the test oracle, not inputs. If the implementation's output differs from section 5 or 5.1, the implementation is wrong.
