// Data for the Sitter Activation Clarity prototype: the policy snapshot, the
// interpretations register, the demo event script, the naive-mode script and
// the published demand figures. Facts come only from the Phase 1 claims sheet
// (17 Nov 2026). No number appears here that is not in that sheet.

import { T } from './model';
import type {
  InterpretationRecord,
  PolicySnapshot,
  SimEvent,
} from './model';

export const TRUSTPILOT_PAGE2 = 'https://www.trustpilot.com/review/sittsy.com?page=2';
export const TRUSTPILOT_MAIN = 'https://www.trustpilot.com/review/sittsy.com';

// ---------------------------------------------------------------------------
// Interpretations register (spec section 2). Labels marked verbatim in the
// spec are used exactly as written.
// ---------------------------------------------------------------------------

export const INTERPRETATIONS: InterpretationRecord[] = [
  {
    id: 'I1',
    statement:
      'The 30-day period is the half-open interval [activation timestamp, activation timestamp + 30 days). An event exactly at the end instant is outside the period. Whether Sittsy starts the clock at payment, at activation completion, or at a calendar boundary is not published. This interval is a prototype convention.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'Your 30 days are counted here as the interval from activation to the same time 30 days later. Sittsy has not published the exact start moment or whether the end moment itself counts.',
  },
  {
    id: 'I2',
    statement:
      'The C1 denominator is all request_received events with timestamps inside the period, wherever the owner is located. Sittsy has not published whether requests outside the sitter\u2019s area count toward the 80%.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'This tracker counts every request received in your first 30 days toward the 80%. Sittsy has not published whether requests outside your area count.',
  },
  {
    id: 'I3',
    statement:
      'C1 is evaluated by exact rational comparison at period end: met iff 5 x applications >= 4 x requests. No rounding rule is published; no float is ever compared.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'Sittsy has not published how the 80% is rounded. This tracker compares exact counts at day 30: 5 x your applications against 4 x your requests.',
  },
  {
    id: 'I4',
    statement:
      'Zero-request case: if no requests are received in the period, C1 and C2 have no determinate status. Not published.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'Sittsy has not published what happens if you receive no requests. This tracker will show Cannot determine rather than guess.',
  },
  {
    id: 'I5',
    statement:
      'C3 counts cumulative open day-buckets: any 24 of the 30. Consecutiveness is not confirmed.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'Counted here as any 24 days out of the 30. Sittsy has not published whether the days must be consecutive.',
  },
  {
    id: 'I6',
    statement:
      'C4\u2019s count is assessed at period end, and reaching 5 mid-period is shown as met because no published rule removes an approved testimonial. Whether testimonials approved before activation count is not published; this model counts only approvals inside the period.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'This tracker counts testimonials approved during your first 30 days. Sittsy has not published whether testimonials you already had count.',
  },
  {
    id: 'I7',
    statement:
      'Profile complete has no published field list. Completeness is a boolean reported by the account. Whether a mid-period gap that is later fixed matters is not published. This is why C5 is unresolved.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'Sittsy has not published which fields make a profile complete. This tracker shows completeness as reported by the account, and cannot treat it as an authoritative pass or fail.',
  },
  {
    id: 'I8',
    statement:
      'Booking has no published event definition. Any booking_created event inside the period is recorded as a fact; no authoritative status is derived from it. This is why C6 is unresolved.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'Sittsy has not published exactly what counts as a booking for this condition. This tracker records booking events as facts and cannot treat them as an authoritative pass or fail.',
  },
  {
    id: 'I9',
    statement:
      'C7\u2019s published statement does not say whether filing a claim inside the period is a timing matter or voids the Promise.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'Sittsy states there is no refund during the 30 days. It has not published whether claiming early affects eligibility, so this tracker records the claim and marks the result Cannot determine on this point.',
  },
  {
    id: 'I10',
    statement:
      'A reply for C2 is any sitter message event on the request. Whether Sittsy requires a substantive response is not published.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label: null,
  },
  {
    id: 'I11',
    statement:
      'Requests posted or accepted before activation do not count toward C1/C2.',
    evidence_class: 'PUBLISHED',
    on_screen_label: null,
  },
  {
    id: 'I12',
    statement:
      'Account restrictions do not pause any clock in this model. Whether a restriction pauses anything is not published; the model invents no pause.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label: null,
  },
  {
    id: 'I13',
    statement:
      'Applying has no published deadline (unlike replying). An application counts at its event timestamp, any time inside the period.',
    evidence_class: 'PUBLISHED',
    on_screen_label: null,
  },
  {
    id: 'I14',
    statement:
      'Day-buckets for C3 are anchored to the period start instant (bucket k = [start + k x 24h, start + (k+1) x 24h)), not to calendar days in any timezone. Device timezone changes affect only display formatting.',
    evidence_class: 'UNCONFIRMED_INTERPRETATION',
    on_screen_label:
      'Days are counted from the activation time, in 24-hour blocks starting at that time, not by calendar date.',
  },
];

export function interpretationLabel(id: string): string | null {
  const rec = INTERPRETATIONS.find((i) => i.id === id);
  return rec ? rec.on_screen_label : null;
}

// ---------------------------------------------------------------------------
// The policy snapshot, as captured on the demo activation event. The same
// object is the published list shown before payment.
// ---------------------------------------------------------------------------

export const POLICY_SNAPSHOT: PolicySnapshot = {
  version: 'published-list-2026-11-17',
  captured_at: T(0, 10, 0, 0),
  market: 'UK - London',
  fee_amount_shown: '30',
  fee_currency: 'GBP',
  conditions_as_shown: [
    {
      id: 'C1',
      sitter_facing_text:
        'Apply to at least 80% of the booking requests you receive in your first 30 days.',
      published_wording: 'applying to at least 80% of booking requests received',
      source_url: TRUSTPILOT_PAGE2,
      evidence_class: 'PUBLISHED',
    },
    {
      id: 'C2',
      sitter_facing_text:
        'Reply to every booking request within 24 hours of receiving it.',
      published_wording: 'replying to every request within 24 hours',
      source_url: TRUSTPILOT_PAGE2,
      evidence_class: 'PUBLISHED',
    },
    {
      id: 'C3',
      sitter_facing_text:
        'Keep your calendar open on at least 24 of your first 30 days.',
      published_wording: 'keeping the calendar open for at least 24 of the 30 days',
      source_url: TRUSTPILOT_PAGE2,
      evidence_class: 'PUBLISHED',
    },
    {
      id: 'C4',
      sitter_facing_text:
        'Have 5 approved testimonials on your profile. Testimonials can come from previous clients; they do not need to book or pay anything.',
      published_wording: 'having 5 approved testimonials',
      source_url: TRUSTPILOT_PAGE2,
      evidence_class: 'PUBLISHED',
    },
    {
      id: 'C5',
      sitter_facing_text: 'Keep your profile complete.',
      published_wording: 'keeping the profile complete',
      source_url: TRUSTPILOT_PAGE2,
      evidence_class: 'PUBLISHED',
    },
    {
      id: 'C6',
      sitter_facing_text:
        'The Promise applies only if you receive no booking in your first 30 days.',
      published_wording:
        'you meet all applicable conditions and receive no booking within 30 days',
      source_url: TRUSTPILOT_PAGE2,
      evidence_class: 'PUBLISHED',
    },
    {
      id: 'C7',
      sitter_facing_text:
        'There is no refund during the first 30 days. Claims are made in the app after day 30.',
      published_wording: 'There is no refund during those 30 days.',
      source_url: TRUSTPILOT_PAGE2,
      evidence_class: 'PUBLISHED',
    },
    {
      id: 'C8',
      sitter_facing_text:
        'Activations without the Money Back Promise are final and non-refundable, and the payment screen states this before paying.',
      published_wording:
        'A plan without the Money Back Promise is final and non-refundable, and the payment screen states this before paying.',
      source_url: TRUSTPILOT_PAGE2,
      evidence_class: 'PUBLISHED',
    },
  ],
  reported_items_as_shown: [
    {
      id: 'R1',
      display_text:
        'Reported but not published: one sitter was refused a refund over a 7-day deadline for collecting testimonials. This deadline appears in no published Sittsy condition list we could find.',
      source_url: TRUSTPILOT_MAIN,
      evidence_class: 'REPORTED_ENFORCEMENT',
    },
    {
      id: 'R2',
      display_text:
        'Not in the published list: one sitter\u2019s in-app terms reportedly required five approved testimonials to remain on the profile for at least 20 of the 30 days. Those in-app terms are not published policy, so this tracker classifies the rule as an unconfirmed interpretation and does not evaluate it.',
      source_url: TRUSTPILOT_MAIN,
      evidence_class: 'UNCONFIRMED_INTERPRETATION',
    },
  ],
  interpretations_in_force: INTERPRETATIONS,
};

// ---------------------------------------------------------------------------
// Condition card metadata: badges, mechanic lines, which interpretation
// labels each card carries.
// ---------------------------------------------------------------------------

export interface ConditionMeta {
  id: string;
  badge: string;
  mechanic: string;
  interpretationIds: string[];
  factPanel: boolean;
}

export const CONDITION_META: Record<string, ConditionMeta> = {
  C1: {
    id: 'C1',
    badge: 'Published',
    mechanic:
      'Counted over the whole 30 days and compared once, at the end, with exact counts. It cannot be failed part-way through: later requests can always change the balance.',
    interpretationIds: ['I2', 'I3', 'I4'],
    factPanel: false,
  },
  C2: {
    id: 'C2',
    badge: 'Published',
    mechanic:
      'Each request starts its own 24-hour clock at the moment it is received. One request answered late cannot be repaired by answering others.',
    interpretationIds: [],
    factPanel: false,
  },
  C3: {
    id: 'C3',
    badge: 'Published',
    mechanic:
      'A counter of open days. It is met the moment the count reaches 24, and failed the moment 24 becomes unreachable.',
    interpretationIds: ['I5'],
    factPanel: false,
  },
  C4: {
    id: 'C4',
    badge: 'Published',
    mechanic:
      'A counter. It is met the moment the fifth testimonial is approved. No published rule sets a deadline for collecting them.',
    interpretationIds: ['I6'],
    factPanel: false,
  },
  C5: {
    id: 'C5',
    badge: 'Published - definition unresolved',
    mechanic:
      'Shown as a fact reported by the account, not as a pass or fail. This panel never shows a tick or a cross.',
    interpretationIds: ['I7'],
    factPanel: true,
  },
  C6: {
    id: 'C6',
    badge: 'Published - definition unresolved',
    mechanic:
      'Shown as facts recorded in the period, not as a pass or fail. This panel never shows a tick or a cross.',
    interpretationIds: ['I8'],
    factPanel: true,
  },
  C7: {
    id: 'C7',
    badge: 'Published',
    mechanic:
      'A claim filed at any time is recorded, with its time. What an early claim means is shown below, not decided here.',
    interpretationIds: ['I1', 'I9'],
    factPanel: false,
  },
  C8: {
    id: 'C8',
    badge: 'Published',
    mechanic:
      'Checked once, at activation, from the plan you actually bought.',
    interpretationIds: [],
    factPanel: false,
  },
};

// Plain-language statement of the C2 event contract, shown in the C2 card's
// source note (spec section 4.2).
export const C2_CONTRACT_NOTE =
  'How the 24 hours is counted here: the clock starts at the moment the request is received, as recorded in the log. A reply is a message you send on that request; a reply at or before the deadline counts, a later reply is recorded and shown but does not count. If a recorded time is wrong, the fix is a correction entry with a reason, never a silent edit. A withdrawn request is shown as an unresolved case: Sittsy has not published how it is treated.';

// ---------------------------------------------------------------------------
// Verbatim blocks
// ---------------------------------------------------------------------------

export const REPORTED_HEADING = 'Reported conditions not present in the published list';
export const REPORTED_INTRO =
  'Sitters have reported being judged on conditions that do not appear in Sittsy\u2019s published list. They are shown here, with their sources, so nothing is a surprise. This tracker does not evaluate them, because Sittsy has not published them.';

export const FEE_STANDING_TEXT =
  'Sittsy does not publish the activation fee on its website. The amount appears only on the Pay button in the app, and it varies by region and demand.';
export const FEE_COVERS_QUOTE =
  'It starts identity verification, quality and safety checks and profile review.';
export const WAIVER_QUOTE =
  'By tapping Pay, you request immediate activation of your account and acknowledge that you lose your right of withdrawal.';

export const CORRECTED_PANEL_ANSWER =
  'Cannot determine. The published conditions set no testimonial deadline. A 7-day deadline has been reported in a refund denial but does not appear in the published list. This prototype does not decide between them.';

export const NAIVE_AUDIT_NOTE =
  'Naive mode keeps no audit trail. Two parts of the screen answer the same question differently, and nothing records why. That is the problem this prototype demonstrates.';

export const JAIPUR_NO_DATA =
  'No published data. Sittsy publishes no demand figures for India, and no India page was found. There is no number to show here, and this prototype will not invent one.';

// ---------------------------------------------------------------------------
// Demand panel (spec section 8). Verified published figures only.
// ---------------------------------------------------------------------------

export interface DemandCity {
  name: string;
  country: string;
  sitters: number;
  requests: number;
  countryTotal: number;
  source: string;
}

export const DEMAND_GLOBAL_SITTERS = '12,619 sitters active';
export const DEMAND_GLOBAL_SOURCE = 'https://uk.sittsy.com/become-a-sitter';
export const DEMAND_UK_SOURCE = 'https://uk.sittsy.com/become-a-sitter';
export const DEMAND_NZ_SOURCE = 'https://nz.sittsy.com/become-a-sitter';
export const DEMAND_UK_FOOTNOTE =
  'Sittsy updates these figures; the UK total changed between two reads a day apart.';
export const DEMAND_READ_LINE = 'As published by Sittsy, read 17 November 2026.';

export const DEMAND_CITIES: DemandCity[] = [
  { name: 'London', country: 'United Kingdom', sitters: 126, requests: 36, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Croydon', country: 'United Kingdom', sitters: 7, requests: 31, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Liverpool', country: 'United Kingdom', sitters: 12, requests: 8, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Manchester', country: 'United Kingdom', sitters: 10, requests: 6, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Leeds', country: 'United Kingdom', sitters: 7, requests: 5, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Nottingham', country: 'United Kingdom', sitters: 8, requests: 5, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Leicester', country: 'United Kingdom', sitters: 8, requests: 3, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Cambridge', country: 'United Kingdom', sitters: 7, requests: 3, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Glasgow', country: 'United Kingdom', sitters: 7, requests: 3, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Bristol', country: 'United Kingdom', sitters: 17, requests: 2, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Birmingham', country: 'United Kingdom', sitters: 8, requests: 2, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Brighton', country: 'United Kingdom', sitters: 6, requests: 0, countryTotal: 109, source: DEMAND_UK_SOURCE },
  { name: 'Auckland', country: 'New Zealand', sitters: 8, requests: 3, countryTotal: 4, source: DEMAND_NZ_SOURCE },
];

export const JAIPUR_OPTION = 'Jaipur, India';

// ---------------------------------------------------------------------------
// Demo script (spec section 9). One step per row; compressed table rows are
// expanded to one step per calendar_day_open event. Each step appends its
// events, sets the simulated time, and re-derives.
// ---------------------------------------------------------------------------

export interface DemoStep {
  label: string;
  at: number;
  events: SimEvent[];
  auditTrigger: string;
  annotation?: string;
}

function cal(bucket: number, day: number): SimEvent {
  return { type: 'calendar_day_open', at: T(day, 10, 0, 0), bucket_index: bucket };
}

export const DEMO_STEPS: DemoStep[] = [
  {
    label: 'Activation: plan includes the Money Back Promise, profile complete, policy snapshot captured. Calendar open, day bucket 0.',
    at: T(0, 10, 0, 0),
    events: [
      {
        type: 'activation_completed',
        at: T(0, 10, 0, 0),
        plan_includes_promise: true,
        profile_complete: true,
        snapshot: POLICY_SNAPSHOT,
      },
      cal(0, 0),
    ],
    auditTrigger: 'activation_completed',
  },
  { label: 'Testimonial T1 approved.', at: T(0, 14, 20), events: [{ type: 'testimonial_approved', at: T(0, 14, 20), testimonial_id: 'T1' }], auditTrigger: 'testimonial_approved T1' },
  { label: 'Calendar open, day bucket 1.', at: T(1, 10, 0), events: [cal(1, 1)], auditTrigger: 'calendar_day_open, bucket 1' },
  { label: 'Request R1 received. Its 24-hour deadline is Day 3, 09:15.', at: T(2, 9, 15), events: [{ type: 'request_received', at: T(2, 9, 15), request_id: 'R1' }], auditTrigger: 'request_received R1' },
  { label: 'Calendar open, day bucket 2.', at: T(2, 10, 0), events: [cal(2, 2)], auditTrigger: 'calendar_day_open, bucket 2' },
  { label: 'Applied to request R1.', at: T(2, 11, 40), events: [{ type: 'request_applied', at: T(2, 11, 40), request_id: 'R1' }], auditTrigger: 'request_applied R1' },
  { label: 'Replied to request R1, 6h 50m after it arrived.', at: T(2, 16, 5), events: [{ type: 'request_replied', at: T(2, 16, 5), request_id: 'R1' }], auditTrigger: 'request_replied R1' },
  { label: 'Calendar open, day bucket 3.', at: T(3, 10, 0), events: [cal(3, 3)], auditTrigger: 'calendar_day_open, bucket 3' },
  { label: 'Testimonial T2 approved.', at: T(3, 15, 45), events: [{ type: 'testimonial_approved', at: T(3, 15, 45), testimonial_id: 'T2' }], auditTrigger: 'testimonial_approved T2' },
  { label: 'Request R2 received. Its 24-hour deadline is Day 4, 18:30.', at: T(3, 18, 30), events: [{ type: 'request_received', at: T(3, 18, 30), request_id: 'R2' }], auditTrigger: 'request_received R2' },
  { label: 'Calendar open, day bucket 4.', at: T(4, 10, 0), events: [cal(4, 4)], auditTrigger: 'calendar_day_open, bucket 4' },
  {
    label: 'Time passes. One second after R2\u2019s deadline, with no reply sent.',
    at: T(4, 18, 30, 1),
    events: [{ type: 'time_advanced', at: T(4, 18, 30, 1) }],
    auditTrigger: 'time_advanced to Day 4, 18:30:01',
  },
  {
    label: 'Duplicate delivery (test): the same observation is delivered a second time.',
    at: T(4, 18, 30, 1),
    events: [{ type: 'time_advanced', at: T(4, 18, 30, 1) }],
    auditTrigger: 'time_advanced to Day 4, 18:30:01',
  },
  { label: 'Time passes. Day bucket 5 stays closed.', at: T(5, 10, 0), events: [{ type: 'time_advanced', at: T(5, 10, 0) }], auditTrigger: 'time_advanced to Day 5, 10:00' },
  { label: 'Calendar open, day bucket 6.', at: T(6, 10, 0), events: [cal(6, 6)], auditTrigger: 'calendar_day_open, bucket 6' },
  { label: 'Testimonial T3 approved.', at: T(6, 12, 0), events: [{ type: 'testimonial_approved', at: T(6, 12, 0), testimonial_id: 'T3' }], auditTrigger: 'testimonial_approved T3' },
  {
    label: 'Calendar open, day bucket 7.',
    at: T(7, 10, 0),
    events: [cal(7, 7)],
    auditTrigger: 'calendar_day_open, bucket 7',
    annotation:
      'The reported 7-day testimonial date passes at this moment, with testimonials at 3 of 5. Nothing changes and no audit entry is written: the date is a reported item, not a tracked condition.',
  },
  { label: 'Calendar open, day bucket 8.', at: T(8, 10, 0), events: [cal(8, 8)], auditTrigger: 'calendar_day_open, bucket 8' },
  { label: 'Request R3 received. Its 24-hour deadline is Day 9, 13:10.', at: T(8, 13, 10), events: [{ type: 'request_received', at: T(8, 13, 10), request_id: 'R3' }], auditTrigger: 'request_received R3' },
  { label: 'Applied to request R3.', at: T(8, 15, 0), events: [{ type: 'request_applied', at: T(8, 15, 0), request_id: 'R3' }], auditTrigger: 'request_applied R3' },
  { label: 'Replied to request R3, 7h 35m after it arrived.', at: T(8, 20, 45), events: [{ type: 'request_replied', at: T(8, 20, 45), request_id: 'R3' }], auditTrigger: 'request_replied R3' },
  { label: 'Calendar open, day bucket 9.', at: T(9, 10, 0), events: [cal(9, 9)], auditTrigger: 'calendar_day_open, bucket 9' },
  { label: 'Testimonial T4 approved.', at: T(9, 17, 20), events: [{ type: 'testimonial_approved', at: T(9, 17, 20), testimonial_id: 'T4' }], auditTrigger: 'testimonial_approved T4' },
  { label: 'Calendar open, day bucket 10.', at: T(10, 10, 0), events: [cal(10, 10)], auditTrigger: 'calendar_day_open, bucket 10' },
  { label: 'Calendar open, day bucket 11.', at: T(11, 10, 0), events: [cal(11, 11)], auditTrigger: 'calendar_day_open, bucket 11' },
  { label: 'Time passes. Day bucket 12 stays closed.', at: T(12, 10, 0), events: [{ type: 'time_advanced', at: T(12, 10, 0) }], auditTrigger: 'time_advanced to Day 12, 10:00' },
  { label: 'Calendar open, day bucket 13.', at: T(13, 10, 0), events: [cal(13, 13)], auditTrigger: 'calendar_day_open, bucket 13' },
  { label: 'Testimonial T5 approved: the fifth.', at: T(13, 13, 30), events: [{ type: 'testimonial_approved', at: T(13, 13, 30), testimonial_id: 'T5' }], auditTrigger: 'testimonial_approved T5' },
  { label: 'Calendar open, day bucket 14.', at: T(14, 10, 0), events: [cal(14, 14)], auditTrigger: 'calendar_day_open, bucket 14' },
  { label: 'Request R4 received. Its 24-hour deadline is Day 16, 08:20.', at: T(15, 8, 20, 0), events: [{ type: 'request_received', at: T(15, 8, 20, 0), request_id: 'R4' }], auditTrigger: 'request_received R4' },
  { label: 'Applied to request R4.', at: T(15, 9, 10), events: [{ type: 'request_applied', at: T(15, 9, 10), request_id: 'R4' }], auditTrigger: 'request_applied R4' },
  { label: 'Calendar open, day bucket 15.', at: T(15, 10, 0), events: [cal(15, 15)], auditTrigger: 'calendar_day_open, bucket 15' },
  { label: 'Replied to request R4, one second before its deadline.', at: T(16, 8, 19, 59), events: [{ type: 'request_replied', at: T(16, 8, 19, 59), request_id: 'R4' }], auditTrigger: 'request_replied R4' },
  { label: 'Calendar open, day bucket 16.', at: T(16, 10, 0), events: [cal(16, 16)], auditTrigger: 'calendar_day_open, bucket 16' },
  { label: 'Calendar open, day bucket 17.', at: T(17, 10, 0), events: [cal(17, 17)], auditTrigger: 'calendar_day_open, bucket 17' },
  { label: 'Calendar open, day bucket 18.', at: T(18, 10, 0), events: [cal(18, 18)], auditTrigger: 'calendar_day_open, bucket 18' },
  { label: 'Calendar open, day bucket 19.', at: T(19, 10, 0), events: [cal(19, 19)], auditTrigger: 'calendar_day_open, bucket 19' },
  { label: 'Calendar open, day bucket 20.', at: T(20, 10, 0), events: [cal(20, 20)], auditTrigger: 'calendar_day_open, bucket 20' },
  { label: 'Calendar open, day bucket 21.', at: T(21, 10, 0), events: [cal(21, 21)], auditTrigger: 'calendar_day_open, bucket 21' },
  { label: 'Request R5 received. Its 24-hour deadline is Day 22, 19:40.', at: T(21, 19, 40), events: [{ type: 'request_received', at: T(21, 19, 40), request_id: 'R5' }], auditTrigger: 'request_received R5' },
  { label: 'Applied to request R5.', at: T(21, 20, 15), events: [{ type: 'request_applied', at: T(21, 20, 15), request_id: 'R5' }], auditTrigger: 'request_applied R5' },
  { label: 'Calendar open, day bucket 22.', at: T(22, 10, 0), events: [cal(22, 22)], auditTrigger: 'calendar_day_open, bucket 22' },
  { label: 'Replied to request R5, 14h 50m after it arrived.', at: T(22, 10, 30), events: [{ type: 'request_replied', at: T(22, 10, 30), request_id: 'R5' }], auditTrigger: 'request_replied R5' },
  { label: 'Calendar open, day bucket 23.', at: T(23, 10, 0), events: [cal(23, 23)], auditTrigger: 'calendar_day_open, bucket 23' },
  { label: 'Request R6 received. Its 24-hour deadline is Day 25, 09:00.', at: T(24, 9, 0, 0), events: [{ type: 'request_received', at: T(24, 9, 0, 0), request_id: 'R6' }], auditTrigger: 'request_received R6' },
  { label: 'Applied to request R6.', at: T(24, 9, 30), events: [{ type: 'request_applied', at: T(24, 9, 30), request_id: 'R6' }], auditTrigger: 'request_applied R6' },
  { label: 'Calendar open, day bucket 24.', at: T(24, 10, 0), events: [cal(24, 24)], auditTrigger: 'calendar_day_open, bucket 24' },
  { label: 'Replied to request R6, one second after its deadline.', at: T(25, 9, 0, 1), events: [{ type: 'request_replied', at: T(25, 9, 0, 1), request_id: 'R6' }], auditTrigger: 'request_replied R6 (arriving after the deadline)' },
  { label: 'Calendar open, day bucket 25: the 24th open day.', at: T(25, 10, 0), events: [cal(25, 25)], auditTrigger: 'calendar_day_open, bucket 25' },
  { label: 'Calendar open, day bucket 26.', at: T(26, 10, 0), events: [cal(26, 26)], auditTrigger: 'calendar_day_open, bucket 26' },
  { label: 'Calendar open, day bucket 27.', at: T(27, 10, 0), events: [cal(27, 27)], auditTrigger: 'calendar_day_open, bucket 27' },
  { label: 'Calendar open, day bucket 28.', at: T(28, 10, 0), events: [cal(28, 28)], auditTrigger: 'calendar_day_open, bucket 28' },
  { label: 'Calendar open, day bucket 29.', at: T(29, 10, 0), events: [cal(29, 29)], auditTrigger: 'calendar_day_open, bucket 29' },
  { label: 'Refund claim filed, inside the 30 days.', at: T(29, 11, 0), events: [{ type: 'refund_claim_filed', at: T(29, 11, 0) }], auditTrigger: 'refund_claim_filed' },
  {
    label: 'The 30 days end. Final derivation against the snapshot.',
    at: T(30, 10, 0, 0),
    events: [{ type: 'time_advanced', at: T(30, 10, 0, 0) }],
    auditTrigger: 'time_advanced to period end (finalisation)',
  },
];

// ---------------------------------------------------------------------------
// Naive-mode script (spec section 7.3). A separate short sequence.
// ---------------------------------------------------------------------------

export interface NaiveStep {
  label: string;
  at: number;
  events: SimEvent[];
  annotation?: string;
}

export const NAIVE_ACTIVATION: SimEvent = {
  type: 'activation_completed',
  at: T(0, 10, 0, 0),
  plan_includes_promise: true,
  profile_complete: true,
  snapshot: POLICY_SNAPSHOT,
};

export const NAIVE_STEPS: NaiveStep[] = [
  { label: 'N0: activation.', at: T(0, 10, 0, 0), events: [NAIVE_ACTIVATION] },
  { label: 'N1: testimonial approved (1).', at: T(2, 11, 0), events: [{ type: 'testimonial_approved', at: T(2, 11, 0), testimonial_id: 'NT1' }] },
  { label: 'N2: testimonial approved (2).', at: T(4, 9, 30), events: [{ type: 'testimonial_approved', at: T(4, 9, 30), testimonial_id: 'NT2' }] },
  { label: 'N3: the clock passes the reported 7-day deadline, at 2 of 5.', at: T(7, 10, 0, 0), events: [{ type: 'time_advanced', at: T(7, 10, 0, 0) }] },
  { label: 'N4: testimonial approved (3).', at: T(8, 15, 0), events: [{ type: 'testimonial_approved', at: T(8, 15, 0), testimonial_id: 'NT3' }] },
];
