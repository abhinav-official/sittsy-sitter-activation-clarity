# Sitter Activation Clarity

A working prototype exploring one moment in the sitter journey: **what a new sitter can know before paying the activation fee, and whether the Money Back Promise conditions they are shown can ever contradict each other.**

Live demo: https://sittsy-sitter-activation-clarity.pages.dev/

Built by Abhinav Jha as a pitch piece alongside his application for the Founding Engineer role at Sittsy. It is an independent exploration based on Sittsy's public pages and public review replies. It is not affiliated with or endorsed by Sittsy, and it uses a scripted scenario, not live account data.

## The problem, from the public record

Sittsy charges new sitters a one-time activation fee. The fee amount is not published on sittsy.com; it appears on the in-app payment button. Company replies describe what it covers: "It starts identity verification, quality and safety checks and profile review."

Attached to some activations is a Money Back Promise: meet a set of conditions in the first 30 days, get no booking, and the fee comes back. There is no standalone Promise terms page on sittsy.com. The fullest published condition list appears in the company's own replies on Trustpilot: apply to at least 80% of requests, reply to every request within 24 hours, keep the calendar open at least 24 of 30 days, collect 5 approved testimonials, keep a complete profile, receive no booking in the first 30 days, and a statement that there is no refund during those 30 days. Whether filing a claim during the 30 days itself counts against eligibility is not stated in any published source; the prototype records a claim and marks that point Cannot determine rather than guessing.

The review record shows where this breaks down in practice. In the best documented case (Trustpilot, Padua), a sitter screenshotted the conditions shown in her app, met them as displayed, and was refused over a 7-day testimonial deadline that appears in no published condition list. Her app also showed her eligibility as expired and still counting down at the same time. Other sitters describe paying and then learning conditions they had never seen. None of this requires bad intent on anyone's part: it is what happens when the same promise is maintained in several places, as text, as in-app state and as support judgement, with no single derivation behind it.

The full evidence base is in [research/claims-sheet.md](research/claims-sheet.md). Every claim in it is a verbatim quote with a source, and the sheet separates what Sittsy published from what sitters reported.

## What the prototype does

One state machine, shown twice: a "Before you pay" screen a sitter sees pre-activation, and a "Your first 30 days" tracker after it. Both render the same derived state, so the two views cannot disagree.

1. **Conditions carry their evidence class.** Every condition and every interpretation is labelled Published (with its source), Reported enforcement, or Unconfirmed interpretation. The reported 7-day testimonial deadline is displayed in a separate evidence section and is never encoded as a rule. The 20-day testimonial-presence rule, seen only in one sitter's in-app terms, is classified as an Unconfirmed interpretation for the same reason: reported is not published. Unknown is a state, never shown as failed.
2. **One derivation.** The result is a pure function of a timestamped event log and a versioned policy snapshot taken at activation: derive(eventLog, policySnapshot, asOf). Every transition writes an audit entry with its reason, keyed so a duplicated event cannot double-count. The overall result is derived, never stored, and the vocabulary avoids legal claims: a confirmed miss reads "Requirement missed", a clean finish reads "All tracked published conditions met", and when the evidence cannot settle it, the answer is "Cannot determine".
3. **The contradiction, reproduced and answered.** A naive mode rebuilds the documented failure: two widgets, both labelled "Refund eligibility", one expiring the sitter at day 7 under the reported rule while the other shows 23 days remaining under the 30-day reading. The corrected model, given the same history, answers "Cannot determine" and shows the published and reported evidence side by side.
4. **Demand in context, honestly.** A market panel shows only figures Sittsy itself publishes, each labelled "owner requests, last 30 days, as published by Sittsy": 109 requests across the UK with a 12-city table, 4 requests in New Zealand against 24 sitters there. Where Sittsy publishes nothing, the panel says so, in words: the Jaipur view is an explicit no-data state, not an estimate.

## What the checks say

The prototype ships with a verifier (`npm run report` in `app/`) that replays the full scripted scenario and the boundary cases against the model:

- **98 of 98 checks pass.** Every step of the 47-row scenario matches on every condition, and the audit ledger holds exactly the 23 entries the model specifies, each with its trigger and reason.
- The scenario (a London sitter) ends as **Tracked requirements not met**: a reply deadline missed on day 4 stays the primary result to day 30, even with testimonials complete on day 13 and the calendar target reached on day 25. A confirmed miss is never washed out by later progress.
- Boundary behaviour is tested, not assumed: a reply one second before its deadline satisfies it, one second after misses it, a duplicated deadline event adds no audit entry, an out-of-order event log derives the identical state, and a withdrawn request routes the result to "Cannot determine" rather than guessing.
- In naive mode the two widgets reach "Expired" and "23 days remaining" at the same simulated moment. In the corrected model that state is unreachable by construction.

## The model

The full build-ready model is [research/phase2-model-v2.md](research/phase2-model-v2.md). Conditions C1 to C8 carry their mechanics (period measures, per-request deadlines, counters, gates) and their evidence classes; interpretations I1 to I14 are listed with the exact label the interface shows for each, because a disclosure cannot turn an assumption into an authorised rule.

Two design decisions worth naming: the fee is shown as "not published" rather than as an invented figure (the GBP 30 in the demo is labelled scenario data, from a sitter report), and two published conditions, profile completeness and no booking, stay formally Unresolved because no public source defines them precisely enough to judge. On current evidence the prototype would rather say "Cannot determine" than pretend otherwise.

## Process

Research first, build second, which the commit history mirrors:

1. Claims sheet from Sittsy's own pages and its public review replies, with the complaint corpus documented case by case.
2. A first model, then two structured teardown passes (an external reviewer model instructed to attack the concept, the evidence handling and the result vocabulary). The teardowns split the demand dashboard out of the core concept, banned eligibility language, rebuilt the contradiction demo so both widgets claim the same thing, and forced the evidence classes into the data model. Digests: [research/chatgpt-teardown-phase1.md](research/chatgpt-teardown-phase1.md) and [research/chatgpt-teardown-phase2.md](research/chatgpt-teardown-phase2.md).
3. The corrected model (v2), then this prototype and its verifier.

## Run it

```bash
cd app
npm install
npm run dev
```

Production build: `npm run build`. Model verifier: `npm run report`. The demo is the production build, served from the `docs/` folder of this repo.

## Limits

Scripted scenario with authored events, not a live Sittsy account; the policy snapshot reflects public sources read on 17 November 2026 and would need Sittsy's authoritative terms in production; two conditions remain Unresolved for lack of a published definition; nothing here interprets anyone's legal rights, and the prototype says so where it matters.
