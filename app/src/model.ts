// Sitter Activation Clarity: the single derivation.
//
// Everything on screen is a value returned by derive(eventLog, policySnapshot,
// asOf). No component keeps its own rule logic, its own clock, or its own copy
// of a condition. The audit trail is built by comparing successive derived
// states and writing one idempotent entry per genuinely new transition.

export type EvidenceClass =
  | 'PUBLISHED'
  | 'REPORTED_ENFORCEMENT'
  | 'UNCONFIRMED_INTERPRETATION';

export type ConditionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'MET'
  | 'MISSED'
  | 'UNKNOWN'
  | 'UNRESOLVED'
  | 'CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED'
  | 'NOT_APPLICABLE';

export type InstanceStatus =
  | 'PENDING'
  | 'SATISFIED'
  | 'MISSED'
  | 'WITHDRAWN_UNRESOLVED';

export type OverallResult =
  | 'PRE_ACTIVATION'
  | 'NO_PROMISE'
  | 'IN_PROGRESS'
  | 'REQUIREMENT_MISSED'
  | 'TRACKED_PUBLISHED_CONDITIONS_MET'
  | 'TRACKED_REQUIREMENTS_NOT_MET'
  | 'CANNOT_DETERMINE';

export interface ConditionAsShown {
  id: string;
  sitter_facing_text: string;
  published_wording: string;
  source_url: string;
  evidence_class: EvidenceClass;
}

export interface ReportedAsShown {
  id: string;
  display_text: string;
  source_url: string;
  evidence_class: EvidenceClass;
}

export interface InterpretationRecord {
  id: string;
  statement: string;
  evidence_class: EvidenceClass;
  on_screen_label: string | null;
}

export interface PolicySnapshot {
  version: string;
  captured_at: number;
  market: string;
  fee_amount_shown: string | null;
  fee_currency: string | null;
  conditions_as_shown: ConditionAsShown[];
  reported_items_as_shown: ReportedAsShown[];
  interpretations_in_force: InterpretationRecord[];
}

export type EventType =
  | 'activation_completed'
  | 'request_received'
  | 'request_applied'
  | 'request_replied'
  | 'request_withdrawn'
  | 'reply_corrected'
  | 'calendar_day_open'
  | 'testimonial_approved'
  | 'profile_completed'
  | 'profile_incomplete'
  | 'booking_created'
  | 'refund_claim_filed'
  | 'time_advanced';

export interface SimEvent {
  type: EventType;
  at: number; // absolute seconds since Day 0, 00:00:00
  request_id?: string;
  testimonial_id?: string;
  booking_id?: string;
  bucket_index?: number;
  corrected_reply_at?: number;
  correction_reason?: string;
  plan_includes_promise?: boolean;
  profile_complete?: boolean;
  snapshot?: PolicySnapshot;
}

// ---------------------------------------------------------------------------
// Time helpers. All timestamps are absolute seconds since Day 0, 00:00:00.
// Buckets and deadlines are anchored to absolute instants, never to a device
// timezone (interpretation I14).
// ---------------------------------------------------------------------------

export const DAY = 86400;

export function T(day: number, h: number, m: number, s = 0): number {
  return day * DAY + h * 3600 + m * 60 + s;
}

export function fmtTime(at: number): string {
  const day = Math.floor(at / DAY);
  const rem = at - day * DAY;
  const hh = Math.floor(rem / 3600);
  const mm = Math.floor((rem - hh * 3600) / 60);
  const ss = rem - hh * 3600 - mm * 60;
  const base = `Day ${day}, ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  return ss > 0 ? `${base}:${String(ss).padStart(2, '0')}` : base;
}

export function fmtDay(at: number): string {
  return `Day ${Math.floor(at / DAY)}`;
}

export function fmtClock(at: number): string {
  const rem = at - Math.floor(at / DAY) * DAY;
  const hh = Math.floor(rem / 3600);
  const mm = Math.floor((rem - hh * 3600) / 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// "6h 50m", "14h 50m", "23h 59m", "45m", "30s"
export function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s - h * 3600) / 60);
  const sec = s - h * 3600 - m * 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

export function fmtSecondsGap(seconds: number): string {
  if (seconds === 1) return '1 second';
  if (seconds < 60) return `${seconds} seconds`;
  return fmtDuration(seconds);
}

export function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

export const CONDITION_ORDER = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];

export const CONDITION_NAMES: Record<string, string> = {
  C1: 'Apply to at least 80% of requests',
  C2: 'Reply to every request within 24 hours',
  C3: 'Calendar open at least 24 of 30 days',
  C4: '5 approved testimonials',
  C5: 'Profile complete',
  C6: 'No booking in the period',
  C7: 'No refund claim during the period',
};

export interface C2Instance {
  request_id: string;
  received_at: number;
  deadline: number;
  status: InstanceStatus;
  reply_at: number | null; // effective reply time, after any correction
  raw_reply_at: number | null;
  applied: boolean;
  withdrawn: boolean;
}

export interface ConditionState {
  id: string;
  status: ConditionStatus;
  applied: number;
  received: number;
  instances: C2Instance[];
  openDays: number;
  elapsedBuckets: number;
  remainingBuckets: number;
  testimonials: number;
  profileComplete: boolean | null;
  profileHistory: { at: number; complete: boolean }[];
  bookings: { at: number; booking_id: string }[];
  claimInPeriodAt: number | null;
  claimsAfterPeriod: number[];
}

export interface DerivedState {
  activated: boolean;
  promiseIncluded: boolean;
  periodStart: number | null;
  periodEnd: number | null;
  ended: boolean;
  conditions: ConditionState[];
  overall: OverallResult;
  miss: { conditionId: string; conditionName: string; determinedAt: number } | null;
  unknownIds: string[];
  snapshot: PolicySnapshot | null;
}

function emptyCondition(id: string): ConditionState {
  return {
    id,
    status: 'NOT_STARTED',
    applied: 0,
    received: 0,
    instances: [],
    openDays: 0,
    elapsedBuckets: 0,
    remainingBuckets: 30,
    testimonials: 0,
    profileComplete: null,
    profileHistory: [],
    bookings: [],
    claimInPeriodAt: null,
    claimsAfterPeriod: [],
  };
}

function dedupeKey(e: SimEvent): string {
  return [
    e.type,
    e.at,
    e.request_id ?? '',
    e.testimonial_id ?? '',
    e.booking_id ?? '',
    e.bucket_index ?? '',
    e.corrected_reply_at ?? '',
  ].join('|');
}

// The events derivation may see: deduplicated, not after asOf, in time order.
// Derivation filters and compares by event timestamp, never by arrival order,
// so out-of-order delivery produces identical state.
function effectiveEvents(log: SimEvent[], asOf: number): SimEvent[] {
  const seen = new Set<string>();
  const out: SimEvent[] = [];
  for (const e of log) {
    if (e.at > asOf) continue;
    const k = dedupeKey(e);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  out.sort((a, b) => a.at - b.at);
  return out;
}

export function derive(
  eventLog: SimEvent[],
  policySnapshot: PolicySnapshot | null,
  asOf: number,
): DerivedState {
  const events = effectiveEvents(eventLog, asOf);
  const conditions = CONDITION_ORDER.map(emptyCondition);
  const byId: Record<string, ConditionState> = {};
  for (const c of conditions) byId[c.id] = c;

  const activation = events.find((e) => e.type === 'activation_completed');
  if (!activation) {
    return {
      activated: false,
      promiseIncluded: false,
      periodStart: null,
      periodEnd: null,
      ended: false,
      conditions,
      overall: 'PRE_ACTIVATION',
      miss: null,
      unknownIds: [],
      snapshot: policySnapshot,
    };
  }

  const snapshot = activation.snapshot ?? policySnapshot;
  const start = activation.at;
  const end = start + 30 * DAY;
  const ended = asOf >= end;
  const inPeriod = (e: SimEvent) => e.at >= start && e.at < end;

  if (!activation.plan_includes_promise) {
    for (const c of conditions) c.status = 'NOT_APPLICABLE';
    return {
      activated: true,
      promiseIncluded: false,
      periodStart: start,
      periodEnd: end,
      ended,
      conditions,
      overall: 'NO_PROMISE',
      miss: null,
      unknownIds: [],
      snapshot,
    };
  }

  // --- Requests (C1 denominator, C2 instances) ------------------------------
  const requestEvents = events.filter(
    (e) => e.type === 'request_received' && inPeriod(e),
  );
  const requests = new Map<string, SimEvent>();
  for (const e of requestEvents) {
    if (e.request_id && !requests.has(e.request_id)) {
      requests.set(e.request_id, e);
    }
  }
  const appliedIds = new Set<string>();
  for (const e of events) {
    if (e.type === 'request_applied' && e.request_id && inPeriod(e)) {
      appliedIds.add(e.request_id);
    }
  }
  const instances: C2Instance[] = [];
  let anyWithdrawn = false;
  for (const [id, req] of requests) {
    const received_at = req.at;
    const deadline = received_at + DAY;
    const replies = events
      .filter((e) => e.type === 'request_replied' && e.request_id === id)
      .map((e) => e.at);
    const raw_reply_at = replies.length > 0 ? Math.min(...replies) : null;
    const corrections = events.filter(
      (e) => e.type === 'reply_corrected' && e.request_id === id,
    );
    let reply_at = raw_reply_at;
    if (corrections.length > 0) {
      const latest = corrections[corrections.length - 1];
      if (latest.corrected_reply_at !== undefined) {
        reply_at = latest.corrected_reply_at;
      }
    }
    const withdrawn = events.some(
      (e) => e.type === 'request_withdrawn' && e.request_id === id,
    );
    if (withdrawn) anyWithdrawn = true;
    let status: InstanceStatus;
    if (withdrawn) {
      status = 'WITHDRAWN_UNRESOLVED';
    } else if (reply_at !== null && reply_at <= asOf && reply_at <= deadline) {
      status = 'SATISFIED';
    } else if (asOf > deadline) {
      status = 'MISSED';
    } else {
      status = 'PENDING';
    }
    instances.push({
      request_id: id,
      received_at,
      deadline,
      status,
      reply_at: reply_at !== null && reply_at <= asOf ? reply_at : null,
      raw_reply_at,
      applied: appliedIds.has(id),
      withdrawn,
    });
  }
  instances.sort((a, b) => a.received_at - b.received_at);

  // --- C1: apply rate --------------------------------------------------------
  const c1 = byId['C1'];
  c1.received = requests.size;
  c1.applied = instances.filter((i) => i.applied).length;
  if (!ended) {
    c1.status = 'IN_PROGRESS';
  } else if (c1.received === 0 || anyWithdrawn) {
    c1.status = 'UNKNOWN';
  } else {
    c1.status = 5 * c1.applied >= 4 * c1.received ? 'MET' : 'MISSED';
  }

  // --- C2: reply within 24 hours --------------------------------------------
  const c2 = byId['C2'];
  c2.instances = instances;
  c2.received = requests.size;
  const anyInstanceMissed = instances.some((i) => i.status === 'MISSED');
  if (anyInstanceMissed) {
    c2.status = 'MISSED';
  } else if (!ended) {
    c2.status = 'IN_PROGRESS';
  } else if (
    c2.received === 0 ||
    instances.some((i) => i.status === 'WITHDRAWN_UNRESOLVED')
  ) {
    c2.status = 'UNKNOWN';
  } else {
    c2.status = 'MET';
  }

  // --- C3: calendar open 24 of 30 day-buckets --------------------------------
  const c3 = byId['C3'];
  const openBuckets = new Set<number>();
  for (const e of events) {
    if (
      e.type === 'calendar_day_open' &&
      e.bucket_index !== undefined &&
      e.bucket_index >= 0 &&
      e.bucket_index <= 29 &&
      inPeriod(e)
    ) {
      openBuckets.add(e.bucket_index);
    }
  }
  c3.openDays = openBuckets.size;
  c3.elapsedBuckets = Math.min(
    30,
    Math.max(0, Math.floor((asOf - start) / DAY)),
  );
  c3.remainingBuckets = 30 - c3.elapsedBuckets;
  if (c3.openDays >= 24) {
    c3.status = 'MET';
  } else if (c3.openDays + c3.remainingBuckets < 24) {
    c3.status = 'MISSED';
  } else {
    c3.status = 'IN_PROGRESS';
  }

  // --- C4: five approved testimonials ----------------------------------------
  const c4 = byId['C4'];
  c4.testimonials = events.filter(
    (e) => e.type === 'testimonial_approved' && inPeriod(e),
  ).length;
  if (c4.testimonials >= 5) {
    c4.status = 'MET';
  } else if (ended) {
    c4.status = 'MISSED';
  } else {
    c4.status = 'IN_PROGRESS';
  }

  // --- C5: profile complete (fact only, definition unresolved) ---------------
  const c5 = byId['C5'];
  let profile = activation.profile_complete ?? null;
  const history: { at: number; complete: boolean }[] = [
    { at: start, complete: profile ?? false },
  ];
  for (const e of events) {
    if (e.type === 'profile_completed') {
      profile = true;
      history.push({ at: e.at, complete: true });
    } else if (e.type === 'profile_incomplete') {
      profile = false;
      history.push({ at: e.at, complete: false });
    }
  }
  c5.profileComplete = profile;
  c5.profileHistory = history;
  c5.status = ended ? 'UNRESOLVED' : 'IN_PROGRESS';

  // --- C6: booking events (fact only, definition unresolved) -----------------
  const c6 = byId['C6'];
  c6.bookings = events
    .filter((e) => e.type === 'booking_created' && inPeriod(e))
    .map((e) => ({ at: e.at, booking_id: e.booking_id ?? '' }));
  c6.status = ended ? 'UNRESOLVED' : 'IN_PROGRESS';

  // --- C7: refund claim during the period ------------------------------------
  const c7 = byId['C7'];
  const claims = events
    .filter((e) => e.type === 'refund_claim_filed')
    .map((e) => e.at);
  const inPeriodClaims = claims.filter((at) => at >= start && at < end);
  c7.claimInPeriodAt = inPeriodClaims.length > 0 ? Math.min(...inPeriodClaims) : null;
  c7.claimsAfterPeriod = claims.filter((at) => at >= end);
  if (c7.claimInPeriodAt !== null) {
    c7.status = 'CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED';
  } else if (ended) {
    c7.status = 'MET';
  } else {
    c7.status = 'IN_PROGRESS';
  }

  // --- Overall result, by the precedence truth table --------------------------
  const missedIds = ['C1', 'C2', 'C3', 'C4'].filter(
    (id) => byId[id].status === 'MISSED',
  );
  const unknownIds: string[] = [];
  for (const id of CONDITION_ORDER) {
    const s = byId[id].status;
    if (s === 'UNKNOWN' || s === 'UNRESOLVED') unknownIds.push(id);
  }
  if (c7.status === 'CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED') {
    unknownIds.push('C7');
  }
  const hasMiss = missedIds.length > 0;
  const hasUnknown = unknownIds.length > 0;

  let overall: OverallResult;
  if (!ended) {
    overall = hasMiss ? 'REQUIREMENT_MISSED' : 'IN_PROGRESS';
  } else if (hasMiss) {
    overall = 'TRACKED_REQUIREMENTS_NOT_MET';
  } else if (hasUnknown) {
    overall = 'CANNOT_DETERMINE';
  } else {
    overall = 'TRACKED_PUBLISHED_CONDITIONS_MET';
  }

  // First confirmed miss, for the result sub-line.
  let miss: DerivedState['miss'] = null;
  if (hasMiss) {
    const candidates: { conditionId: string; determinedAt: number }[] = [];
    for (const id of missedIds) {
      if (id === 'C2') {
        const missed = instances.filter((i) => i.status === 'MISSED');
        if (missed.length > 0) {
          candidates.push({
            conditionId: 'C2',
            determinedAt: Math.min(...missed.map((i) => i.deadline)),
          });
        }
      } else if (id === 'C3') {
        // First bucket end at which the target became arithmetically
        // unreachable: elapsed k with openDays(k) + (30 - k) < 24.
        let determinedAt = end;
        for (let k = 0; k <= 30; k++) {
          const openByK = events.filter(
            (e) =>
              e.type === 'calendar_day_open' &&
              e.bucket_index !== undefined &&
              e.bucket_index < k &&
              inPeriod(e),
          ).length;
          if (openByK + (30 - k) < 24) {
            determinedAt = start + k * DAY;
            break;
          }
        }
        candidates.push({ conditionId: 'C3', determinedAt });
      } else {
        candidates.push({ conditionId: id, determinedAt: end });
      }
    }
    candidates.sort((a, b) => a.determinedAt - b.determinedAt);
    const first = candidates[0];
    miss = {
      conditionId: first.conditionId,
      conditionName: CONDITION_NAMES[first.conditionId],
      determinedAt: first.determinedAt,
    };
  }

  return {
    activated: true,
    promiseIncluded: true,
    periodStart: start,
    periodEnd: end,
    ended,
    conditions,
    overall,
    miss,
    unknownIds,
    snapshot,
  };
}

// ---------------------------------------------------------------------------
// Overall result labels (verbatim from the spec)
// ---------------------------------------------------------------------------

const UNKNOWN_SUBLINES: Record<string, string> = {
  C1: 'The apply rate cannot be determined (C1).',
  C2: 'The reply condition cannot be determined (C2).',
  C5: 'Profile completeness has no published definition (C5).',
  C6: 'No authoritative definition of a booking exists (C6).',
  C7: 'Whether an early refund claim affects the Promise is not published (C7).',
};

export function overallLabel(state: DerivedState): {
  label: string;
  sub: string | null;
} {
  switch (state.overall) {
    case 'PRE_ACTIVATION':
      return { label: '', sub: null };
    case 'NO_PROMISE':
      return { label: 'No Money Back Promise on this activation', sub: null };
    case 'IN_PROGRESS':
      return {
        label: 'In progress: no tracked published condition missed yet',
        sub: null,
      };
    case 'REQUIREMENT_MISSED':
    case 'TRACKED_REQUIREMENTS_NOT_MET': {
      const label =
        state.overall === 'REQUIREMENT_MISSED'
          ? 'A tracked published requirement has been missed'
          : 'Not met';
      const sub = state.miss
        ? `Determined on ${fmtDay(state.miss.determinedAt)} at ${fmtClock(state.miss.determinedAt)} by ${state.miss.conditionName}. The remaining conditions are still tracked below. Whether this ends the Promise is Sittsy's decision; confirm with Sittsy.`
        : null;
      return { label, sub };
    }
    case 'TRACKED_PUBLISHED_CONDITIONS_MET':
      return {
        label: 'All tracked published conditions met',
        sub: 'This tracks the published list in the policy snapshot. It is not a refund decision; Sittsy decides claims.',
      };
    case 'CANNOT_DETERMINE':
      return {
        label: 'Cannot determine',
        sub: state.unknownIds
          .map((id) => UNKNOWN_SUBLINES[id])
          .filter(Boolean)
          .join(' '),
      };
  }
}

// ---------------------------------------------------------------------------
// Audit trail. Entries are written by comparing successive derived states.
// An entry exists iff no entry with the same key already exists, so
// re-deriving the same state or re-delivering the same event writes nothing.
// ---------------------------------------------------------------------------

export interface AuditEntry {
  seq: number;
  key: string;
  at: number;
  scope: string;
  trigger: string;
  from: string;
  to: string;
  reason: string;
  policy_version: string;
  kind: 'TRANSITION' | 'NOTE';
}

function reasonForCondition(
  id: string,
  prev: ConditionState,
  next: ConditionState,
  state: DerivedState,
): string {
  const version = state.snapshot?.version ?? '';
  if (prev.status === 'NOT_STARTED' && next.status === 'IN_PROGRESS') {
    switch (id) {
      case 'C5':
        return 'Profile reported complete at activation. Fact recorded; C5 carries no authoritative pass/fail (definition unresolved, I7).';
      case 'C6':
        return 'No booking event recorded. Fact recorded; C6 carries no authoritative pass/fail (definition unresolved, I8).';
      case 'C7':
        return 'No refund claim filed.';
      default:
        return `Activation with the Money Back Promise. Tracking begins against snapshot ${version}.`;
    }
  }
  if (prev.status === 'NOT_STARTED' && next.status === 'NOT_APPLICABLE') {
    return 'Activation does not include the Money Back Promise. This condition is not tracked.';
  }
  switch (id) {
    case 'C1':
      if (next.status === 'MET') {
        return `Period ended. Applied to ${next.applied} of ${next.received} requests received. Exact comparison: 5 x ${next.applied} = ${5 * next.applied} >= 4 x ${next.received} = ${4 * next.received} (I3), on the denominator as defined in I2.`;
      }
      if (next.status === 'MISSED') {
        return `Period ended. Applied to ${next.applied} of ${next.received} requests received. Exact comparison: 5 x ${next.applied} = ${5 * next.applied} < 4 x ${next.received} = ${4 * next.received} (I3), on the denominator as defined in I2.`;
      }
      if (next.status === 'UNKNOWN') {
        return next.received === 0
          ? 'Period ended. No requests were received, so the apply rate has no determinate status (I4).'
          : 'Period ended. A withdrawn request makes the denominator indeterminate, so the apply rate has no determinate status.';
      }
      break;
    case 'C2':
      if (next.status === 'MISSED') {
        const missed = next.instances.find((i) => i.status === 'MISSED');
        return `Instance ${missed ? missed.request_id : ''} missed. Replying to every request within 24 hours can no longer be met.`;
      }
      if (next.status === 'MET') {
        return 'Period ended. Every request received a reply within 24 hours.';
      }
      if (next.status === 'UNKNOWN') {
        return next.received === 0
          ? 'Period ended. No requests were received, so the reply condition has no determinate status (I4).'
          : 'Period ended. A withdrawn request is an unresolved case, so the reply condition has no determinate status.';
      }
      break;
    case 'C3':
      if (next.status === 'MET') {
        return 'Calendar open on 24 of the first 30 days. Published target reached (cumulative counting, I5).';
      }
      if (next.status === 'MISSED') {
        return `Calendar target unreachable or unmet: ${next.openDays} open days of the 30, against a target of 24.`;
      }
      break;
    case 'C4':
      if (next.status === 'MET') {
        return `${ordinal(next.testimonials)} approved testimonial received. Published target of 5 reached.`;
      }
      if (next.status === 'MISSED') {
        return `Period ended with ${next.testimonials} of 5 approved testimonials.`;
      }
      break;
    case 'C5':
      if (next.status === 'UNRESOLVED') {
        const fact = next.profileComplete
          ? next.profileHistory.length <= 1
            ? 'Fact at period end: profile reported complete throughout.'
            : 'Fact at period end: profile reported complete.'
          : 'Fact at period end: profile reported not complete.';
        return `Period ended. Profile completeness has no published definition (I7), so no authoritative pass or fail exists. ${fact}`;
      }
      break;
    case 'C6':
      if (next.status === 'UNRESOLVED') {
        const fact =
          next.bookings.length === 0
            ? 'Fact at period end: no booking event was recorded during the 30 days.'
            : `Fact at period end: a booking event was recorded on ${fmtTime(next.bookings[0].at)}.`;
        return `Period ended. "Booking" has no published definition (I8), so no authoritative pass or fail exists. ${fact}`;
      }
      break;
    case 'C7':
      if (next.status === 'CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED') {
        return `Claim filed inside the period [${fmtTime(state.periodStart ?? 0)}, ${fmtTime(state.periodEnd ?? 0)}). The event is recorded. Whether an early claim affects the Promise is not published (I9); the status records the event and the unresolved interpretation, and derives no miss.`;
      }
      if (next.status === 'MET') {
        return 'Period ended. No refund claim was filed inside the period.';
      }
      break;
  }
  return `${id} changed from ${prev.status} to ${next.status}.`;
}

function reasonForInstance(
  inst: C2Instance,
  prevStatus: InstanceStatus | null,
  c2AlreadyMissed: boolean,
): string {
  if (inst.status === 'SATISFIED' && inst.reply_at !== null) {
    const gap = inst.deadline - inst.reply_at;
    if (gap >= 0 && gap <= 60) {
      return `Reply at ${fmtTime(inst.reply_at)}, ${fmtSecondsGap(gap)} before the deadline (${fmtTime(inst.deadline)}). A reply at or before the deadline satisfies the instance (boundary case).`;
    }
    return `Reply ${fmtDuration(inst.reply_at - inst.received_at)} after receipt (${fmtTime(inst.received_at)}), inside the 24-hour deadline (${fmtTime(inst.deadline)}).`;
  }
  if (inst.status === 'MISSED') {
    if (inst.reply_at !== null && inst.reply_at > inst.deadline) {
      const gap = inst.reply_at - inst.deadline;
      const tail = c2AlreadyMissed
        ? ' C2 is already MISSED, so no condition entry follows.'
        : '';
      return `Reply at ${fmtTime(inst.reply_at)}, ${fmtSecondsGap(gap)} after the deadline (${fmtTime(inst.deadline)}). The reply is recorded; it does not satisfy the instance (boundary case).${tail}`;
    }
    return `Request ${inst.request_id} (received ${fmtTime(inst.received_at)}) had no reply by its 24-hour deadline (${fmtTime(inst.deadline)}).`;
  }
  if (inst.status === 'WITHDRAWN_UNRESOLVED') {
    return 'Request withdrawn. Treatment unpublished; the instance is neither satisfied nor missed.';
  }
  return `Instance ${inst.request_id} changed from ${prevStatus ?? 'PENDING'} to ${inst.status}.`;
}

function reasonForOverall(
  prev: OverallResult,
  next: OverallResult,
  state: DerivedState,
): string {
  switch (next) {
    case 'IN_PROGRESS':
      return 'Activation includes the Money Back Promise. Tracking the published conditions in the snapshot.';
    case 'NO_PROMISE':
      return 'Activation does not include the Money Back Promise. Nothing is tracked.';
    case 'REQUIREMENT_MISSED':
      return `Confirmed miss on ${state.miss ? state.miss.conditionId : ''}. The remaining conditions continue to be tracked.`;
    case 'TRACKED_REQUIREMENTS_NOT_MET': {
      const unknowns = state.unknownIds
        .map((id) =>
          id === 'C7'
            ? 'C7 claim interpretation unconfirmed'
            : `${id} ${id === 'C5' || id === 'C6' ? 'UNRESOLVED' : 'UNKNOWN'}`,
        )
        .join(', ');
      const missPart = state.miss
        ? `The confirmed miss on ${state.miss.conditionId} (${fmtDay(state.miss.determinedAt)}) is primary and decides the result.`
        : 'A confirmed miss is primary and decides the result.';
      return unknowns
        ? `Period ended. ${missPart} Unknowns coexist (${unknowns}) and are recorded; per the precedence table they do not displace a confirmed miss.`
        : `Period ended. ${missPart}`;
    }
    case 'CANNOT_DETERMINE':
      return 'Period ended. No confirmed miss. Determination is blocked by unresolved items recorded on the condition cards.';
    case 'TRACKED_PUBLISHED_CONDITIONS_MET':
      return 'Period ended. Every tracked published condition is met and no unresolved item remains.';
    default:
      return `Overall changed from ${prev} to ${next}.`;
  }
}

export function buildAudit(
  prevState: DerivedState,
  existing: AuditEntry[],
  newState: DerivedState,
  asOf: number,
  trigger: string,
): AuditEntry[] {
  const version = newState.snapshot?.version ?? '';
  const have = new Set(existing.map((e) => e.key));
  const out: AuditEntry[] = [];
  const push = (
    scope: string,
    from: string,
    to: string,
    reason: string,
    kind: 'TRANSITION' | 'NOTE',
    keyOverride?: string,
  ) => {
    const key = keyOverride ?? `${scope}@${version}->${to}`;
    if (have.has(key)) return;
    have.add(key);
    out.push({
      seq: 0, // assigned by the caller when appending
      key,
      at: asOf,
      scope,
      trigger,
      from,
      to,
      reason,
      policy_version: version,
      kind,
    });
  };

  const prevById: Record<string, ConditionState> = {};
  for (const c of prevState.conditions) prevById[c.id] = c;
  const newById: Record<string, ConditionState> = {};
  for (const c of newState.conditions) newById[c.id] = c;

  // 1. C2 instance transitions, by request receipt order.
  const prevC2 = prevById['C2'];
  const prevInstances = new Map(
    (prevC2 ? prevC2.instances : []).map((i) => [i.request_id, i]),
  );
  const c2AlreadyMissed = prevC2 ? prevC2.status === 'MISSED' : false;
  for (const inst of newById['C2'].instances) {
    const prevInst = prevInstances.get(inst.request_id);
    const prevStatus: InstanceStatus | null = prevInst ? prevInst.status : null;
    if (inst.status !== 'PENDING' && prevStatus !== inst.status) {
      push(
        `C2:${inst.request_id}`,
        prevStatus ?? 'PENDING',
        inst.status,
        reasonForInstance(inst, prevStatus, c2AlreadyMissed),
        'TRANSITION',
      );
    }
  }

  // 2. Condition transitions, C1 to C7.
  for (const id of CONDITION_ORDER) {
    const prev = prevById[id];
    const next = newById[id];
    if (prev && next && prev.status !== next.status) {
      push(id, prev.status, next.status, reasonForCondition(id, prev, next, newState), 'TRANSITION');
    }
  }

  // 3. Overall transition.
  if (prevState.overall !== newState.overall) {
    push(
      'OVERALL',
      prevState.overall,
      newState.overall,
      reasonForOverall(prevState.overall, newState.overall, newState),
      'TRANSITION',
    );
  }

  // 4. NOTE entries: refund claims filed at or after period end change no
  // status but must be on the record.
  const c7 = newById['C7'];
  if (c7) {
    const notedCount = existing.filter(
      (e) => e.kind === 'NOTE' && e.scope === 'C7',
    ).length;
    const alreadyInOut = out.filter(
      (e) => e.kind === 'NOTE' && e.scope === 'C7',
    ).length;
    c7.claimsAfterPeriod.forEach((claimAt, idx) => {
      if (idx < notedCount + alreadyInOut) return;
      const base = `C7@${version}->CLAIM_FILED_AFTER_PERIOD`;
      const key = notedCount + alreadyInOut === 0 ? base : `${base}@${claimAt}`;
      push(
        'C7',
        c7.status,
        c7.status,
        `Claim filed on ${fmtTime(claimAt)}, after the period ended, through the in-app route. Recorded; this tracker does not decide claims.`,
        'NOTE',
        key,
      );
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Run state: the simulator's log plus the last derived state and audit trail.
// ---------------------------------------------------------------------------

export interface RunState {
  log: SimEvent[];
  asOf: number;
  derived: DerivedState;
  audit: AuditEntry[];
}

export function initialRun(snapshot: PolicySnapshot | null): RunState {
  return {
    log: [],
    asOf: 0,
    derived: derive([], snapshot, 0),
    audit: [],
  };
}

export function applyEvents(
  run: RunState,
  events: SimEvent[],
  asOf: number,
  trigger: string,
  snapshot: PolicySnapshot | null,
): RunState {
  const log = [...run.log, ...events];
  const snap =
    log.find((e) => e.type === 'activation_completed')?.snapshot ?? snapshot;
  const derived = derive(log, snap, asOf);
  const fresh = buildAudit(run.derived, run.audit, derived, asOf, trigger);
  const audit = [...run.audit];
  for (const entry of fresh) {
    audit.push({ ...entry, seq: audit.length + 1 });
  }
  return { log, asOf, derived, audit };
}

// ---------------------------------------------------------------------------
// Naive mode. Two widgets, each independently computing the one quantity both
// are labelled with, from two different interpretations. Neither consults the
// other and neither consults the derivation above. This is a reconstruction
// of the documented symptom, not a claim about any real codebase.
// ---------------------------------------------------------------------------

export interface NaiveState {
  collected: number;
  widgetA: string;
  widgetANotification: string | null;
  widgetB: string;
  expired: boolean;
  remainingDays: number;
}

export function deriveNaive(events: SimEvent[], asOf: number): NaiveState {
  const activation = events.find((e) => e.type === 'activation_completed');
  const start = activation ? activation.at : 0;
  const testimonials = events
    .filter((e) => e.type === 'testimonial_approved' && e.at <= asOf)
    .map((e) => e.at);
  const collected = testimonials.length;
  const deadlineA = start + 7 * DAY;
  const collectedByDeadline = testimonials.filter((at) => at <= deadlineA).length;
  const expired = asOf >= deadlineA && collectedByDeadline < 5;
  const dayIndex = Math.floor(asOf / DAY);
  const remainingDays = 30 - dayIndex;

  let widgetA: string;
  if (expired) {
    widgetA = 'EXPIRED';
  } else if (collected === 0) {
    widgetA = 'Active. 7 days to collect 5 testimonials.';
  } else {
    widgetA = `Active. ${collected} of 5 collected.`;
  }
  return {
    collected,
    widgetA,
    widgetANotification: expired
      ? 'Your refund eligibility has expired.'
      : null,
    widgetB: `Active. ${remainingDays} days remaining.`,
    expired,
    remainingDays,
  };
}
