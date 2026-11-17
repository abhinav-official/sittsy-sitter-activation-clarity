// Verification for the Sitter Activation Clarity model.
// Runs the full demo script through derive() and the audit builder, and
// asserts the spec's expected table (section 9), the audit ledger
// (section 6.2, exactly 23 entries), idempotency at the duplicate-delivery
// step, the naive-mode contradiction (section 7.3), and the boundary unit
// tests of section 10.1. Exits non-zero on any failure.

import {
  applyEvents,
  derive,
  deriveNaive,
  initialRun,
  T,
} from '../src/model';
import type { DerivedState, RunState, SimEvent } from '../src/model';
import { DEMO_STEPS, NAIVE_STEPS, POLICY_SNAPSHOT } from '../src/data';

let failures = 0;
let checks = 0;
function check(name: string, ok: boolean, detail = ''): void {
  checks++;
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? ` :: ${detail}` : ''}`);
  }
}

const IP = 'IN_PROGRESS';
const MS = 'MISSED';
const M = 'MET';
const UR = 'UNRESOLVED';
const CR = 'CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED';
const RM = 'REQUIREMENT_MISSED';
const NM = 'TRACKED_REQUIREMENTS_NOT_MET';
const PR = 'IN_PROGRESS'; // overall before any miss is also IN_PROGRESS

// Expected table, spec section 9. Columns:
// [C1 status, C1 applied, C1 received, C2 status, C3 status, C3 open days,
//  C4 status, C4 count, C5 status, C6 status, C7 status, overall]
type Row = [string, number, number, string, string, number, string, number, string, string, string, string];
const EXPECTED: Row[] = [
  [IP, 0, 0, IP, IP, 1, IP, 0, IP, IP, IP, PR],
  [IP, 0, 0, IP, IP, 1, IP, 1, IP, IP, IP, PR],
  [IP, 0, 0, IP, IP, 2, IP, 1, IP, IP, IP, PR],
  [IP, 0, 1, IP, IP, 2, IP, 1, IP, IP, IP, PR],
  [IP, 0, 1, IP, IP, 3, IP, 1, IP, IP, IP, PR],
  [IP, 1, 1, IP, IP, 3, IP, 1, IP, IP, IP, PR],
  [IP, 1, 1, IP, IP, 3, IP, 1, IP, IP, IP, PR],
  [IP, 1, 1, IP, IP, 4, IP, 1, IP, IP, IP, PR],
  [IP, 1, 1, IP, IP, 4, IP, 2, IP, IP, IP, PR],
  [IP, 1, 2, IP, IP, 4, IP, 2, IP, IP, IP, PR],
  [IP, 1, 2, IP, IP, 5, IP, 2, IP, IP, IP, PR],
  [IP, 1, 2, MS, IP, 5, IP, 2, IP, IP, IP, RM],
  [IP, 1, 2, MS, IP, 5, IP, 2, IP, IP, IP, RM],
  [IP, 1, 2, MS, IP, 5, IP, 2, IP, IP, IP, RM],
  [IP, 1, 2, MS, IP, 6, IP, 2, IP, IP, IP, RM],
  [IP, 1, 2, MS, IP, 6, IP, 3, IP, IP, IP, RM],
  [IP, 1, 2, MS, IP, 7, IP, 3, IP, IP, IP, RM],
  [IP, 1, 2, MS, IP, 8, IP, 3, IP, IP, IP, RM],
  [IP, 1, 3, MS, IP, 8, IP, 3, IP, IP, IP, RM],
  [IP, 2, 3, MS, IP, 8, IP, 3, IP, IP, IP, RM],
  [IP, 2, 3, MS, IP, 8, IP, 3, IP, IP, IP, RM],
  [IP, 2, 3, MS, IP, 9, IP, 3, IP, IP, IP, RM],
  [IP, 2, 3, MS, IP, 9, IP, 4, IP, IP, IP, RM],
  [IP, 2, 3, MS, IP, 11, IP, 4, IP, IP, IP, RM],
  [IP, 2, 3, MS, IP, 11, IP, 4, IP, IP, IP, RM],
  [IP, 2, 3, MS, IP, 12, IP, 4, IP, IP, IP, RM],
  [IP, 2, 3, MS, IP, 12, M, 5, IP, IP, IP, RM],
  [IP, 2, 3, MS, IP, 13, M, 5, IP, IP, IP, RM],
  [IP, 2, 4, MS, IP, 13, M, 5, IP, IP, IP, RM],
  [IP, 3, 4, MS, IP, 13, M, 5, IP, IP, IP, RM],
  [IP, 3, 4, MS, IP, 14, M, 5, IP, IP, IP, RM],
  [IP, 3, 4, MS, IP, 14, M, 5, IP, IP, IP, RM],
  [IP, 3, 4, MS, IP, 19, M, 5, IP, IP, IP, RM],
  [IP, 3, 4, MS, IP, 20, M, 5, IP, IP, IP, RM],
  [IP, 3, 5, MS, IP, 20, M, 5, IP, IP, IP, RM],
  [IP, 4, 5, MS, IP, 20, M, 5, IP, IP, IP, RM],
  [IP, 4, 5, MS, IP, 21, M, 5, IP, IP, IP, RM],
  [IP, 4, 5, MS, IP, 21, M, 5, IP, IP, IP, RM],
  [IP, 4, 5, MS, IP, 22, M, 5, IP, IP, IP, RM],
  [IP, 4, 6, MS, IP, 22, M, 5, IP, IP, IP, RM],
  [IP, 5, 6, MS, IP, 22, M, 5, IP, IP, IP, RM],
  [IP, 5, 6, MS, IP, 23, M, 5, IP, IP, IP, RM],
  [IP, 5, 6, MS, IP, 23, M, 5, IP, IP, IP, RM],
  [IP, 5, 6, MS, M, 24, M, 5, IP, IP, IP, RM],
  [IP, 5, 6, MS, M, 28, M, 5, IP, IP, IP, RM],
  [IP, 5, 6, MS, M, 28, M, 5, IP, IP, CR, RM],
  [M, 5, 6, MS, M, 28, M, 5, UR, UR, CR, NM],
];

// Simulator step (1-based) at which each table row is complete.
const ROW_AT_STEP = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 25, 26, 27, 28, 29, 30, 31, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45,
  46, 47, 48, 49, 53, 54, 55,
];

function condOf(state: DerivedState, id: string) {
  return state.conditions.find((c) => c.id === id) as NonNullable<
    ReturnType<typeof state.conditions.find>
  >;
}

function rowMatches(state: DerivedState, row: Row): string | null {
  const c1 = condOf(state, 'C1');
  const c2 = condOf(state, 'C2');
  const c3 = condOf(state, 'C3');
  const c4 = condOf(state, 'C4');
  const c5 = condOf(state, 'C5');
  const c6 = condOf(state, 'C6');
  const c7 = condOf(state, 'C7');
  const got: Row = [
    c1.status, c1.applied, c1.received,
    c2.status,
    c3.status, c3.openDays,
    c4.status, c4.testimonials,
    c5.status, c6.status, c7.status,
    state.overall,
  ];
  for (let i = 0; i < row.length; i++) {
    if (got[i] !== row[i]) {
      return `column ${i}: expected ${JSON.stringify(row[i])}, got ${JSON.stringify(got[i])} (full row got ${JSON.stringify(got)})`;
    }
  }
  return null;
}

// --- Run the demo -----------------------------------------------------------

let run: RunState = initialRun(POLICY_SNAPSHOT);
const stateAtStep = new Map<number, DerivedState>();
let auditLenBeforeDup = 0;
let auditLenAfterDup = 0;
let stateBeforeDup = '';
let stateAfterDup = '';

for (let i = 0; i < DEMO_STEPS.length; i++) {
  const step = DEMO_STEPS[i];
  if (i === 12) {
    auditLenBeforeDup = run.audit.length;
    stateBeforeDup = JSON.stringify(run.derived);
  }
  run = applyEvents(run, step.events, step.at, step.auditTrigger, POLICY_SNAPSHOT);
  stateAtStep.set(i + 1, run.derived);
  if (i === 12) {
    auditLenAfterDup = run.audit.length;
    stateAfterDup = JSON.stringify(run.derived);
  }
}

check('demo script has 55 simulator steps', DEMO_STEPS.length === 55, `got ${DEMO_STEPS.length}`);

for (let r = 0; r < EXPECTED.length; r++) {
  const state = stateAtStep.get(ROW_AT_STEP[r]) as DerivedState;
  const mismatch = rowMatches(state, EXPECTED[r]);
  check(`spec table row ${r + 1} (after step ${ROW_AT_STEP[r]})`, mismatch === null, mismatch ?? '');
}

// C2 instance statuses at the steps where the table resolves them.
function instanceStatus(step: number, id: string): string {
  const state = stateAtStep.get(step) as DerivedState;
  const inst = condOf(state, 'C2').instances.find((i) => i.request_id === id);
  return inst ? inst.status : 'ABSENT';
}
check('R1 SATISFIED after step 7', instanceStatus(7, 'R1') === 'SATISFIED', instanceStatus(7, 'R1'));
check('R2 MISSED after step 12', instanceStatus(12, 'R2') === 'MISSED', instanceStatus(12, 'R2'));
check('R3 SATISFIED after step 21', instanceStatus(21, 'R3') === 'SATISFIED', instanceStatus(21, 'R3'));
check('R4 SATISFIED after step 33 (1s before deadline)', instanceStatus(33, 'R4') === 'SATISFIED', instanceStatus(33, 'R4'));
check('R5 SATISFIED after step 43', instanceStatus(43, 'R5') === 'SATISFIED', instanceStatus(43, 'R5'));
check('R6 MISSED after step 48 (1s after deadline)', instanceStatus(48, 'R6') === 'MISSED', instanceStatus(48, 'R6'));

// Duplicate delivery (step 13): total stillness.
check('step 13 adds zero audit entries', auditLenAfterDup === auditLenBeforeDup, `${auditLenBeforeDup} -> ${auditLenAfterDup}`);
check('step 13 leaves derived state identical', stateBeforeDup === stateAfterDup);

// Ending result.
check(
  'ending overall result is TRACKED_REQUIREMENTS_NOT_MET',
  run.derived.overall === 'TRACKED_REQUIREMENTS_NOT_MET',
  run.derived.overall,
);

// --- Audit ledger: exactly 23 entries, spec section 6.2 ----------------------

type ExpectedEntry = [number, string, string, string, string];
const EXPECTED_AUDIT: ExpectedEntry[] = [
  [T(0, 10, 0, 0), 'C1', 'NOT_STARTED', 'IN_PROGRESS', 'activation_completed'],
  [T(0, 10, 0, 0), 'C2', 'NOT_STARTED', 'IN_PROGRESS', 'activation_completed'],
  [T(0, 10, 0, 0), 'C3', 'NOT_STARTED', 'IN_PROGRESS', 'activation_completed'],
  [T(0, 10, 0, 0), 'C4', 'NOT_STARTED', 'IN_PROGRESS', 'activation_completed'],
  [T(0, 10, 0, 0), 'C5', 'NOT_STARTED', 'IN_PROGRESS', 'activation_completed'],
  [T(0, 10, 0, 0), 'C6', 'NOT_STARTED', 'IN_PROGRESS', 'activation_completed'],
  [T(0, 10, 0, 0), 'C7', 'NOT_STARTED', 'IN_PROGRESS', 'activation_completed'],
  [T(0, 10, 0, 0), 'OVERALL', 'PRE_ACTIVATION', 'IN_PROGRESS', 'activation_completed'],
  [T(2, 16, 5), 'C2:R1', 'PENDING', 'SATISFIED', 'request_replied R1'],
  [T(4, 18, 30, 1), 'C2:R2', 'PENDING', 'MISSED', 'time_advanced to Day 4, 18:30:01'],
  [T(4, 18, 30, 1), 'C2', 'IN_PROGRESS', 'MISSED', 'time_advanced to Day 4, 18:30:01'],
  [T(4, 18, 30, 1), 'OVERALL', 'IN_PROGRESS', 'REQUIREMENT_MISSED', 'time_advanced to Day 4, 18:30:01'],
  [T(8, 20, 45), 'C2:R3', 'PENDING', 'SATISFIED', 'request_replied R3'],
  [T(13, 13, 30), 'C4', 'IN_PROGRESS', 'MET', 'testimonial_approved T5'],
  [T(16, 8, 19, 59), 'C2:R4', 'PENDING', 'SATISFIED', 'request_replied R4'],
  [T(22, 10, 30), 'C2:R5', 'PENDING', 'SATISFIED', 'request_replied R5'],
  [T(25, 9, 0, 1), 'C2:R6', 'PENDING', 'MISSED', 'request_replied R6 (arriving after the deadline)'],
  [T(25, 10, 0), 'C3', 'IN_PROGRESS', 'MET', 'calendar_day_open, bucket 25'],
  [T(29, 11, 0), 'C7', 'IN_PROGRESS', 'CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED', 'refund_claim_filed'],
  [T(30, 10, 0, 0), 'C1', 'IN_PROGRESS', 'MET', 'time_advanced to period end (finalisation)'],
  [T(30, 10, 0, 0), 'C5', 'IN_PROGRESS', 'UNRESOLVED', 'time_advanced to period end (finalisation)'],
  [T(30, 10, 0, 0), 'C6', 'IN_PROGRESS', 'UNRESOLVED', 'time_advanced to period end (finalisation)'],
  [T(30, 10, 0, 0), 'OVERALL', 'REQUIREMENT_MISSED', 'TRACKED_REQUIREMENTS_NOT_MET', 'time_advanced to period end (finalisation)'],
];

check('audit ledger has exactly 23 entries', run.audit.length === 23, `got ${run.audit.length}`);
for (let i = 0; i < EXPECTED_AUDIT.length; i++) {
  const [at, scope, from, to, trigger] = EXPECTED_AUDIT[i];
  const e = run.audit[i];
  const ok =
    e !== undefined &&
    e.seq === i + 1 &&
    e.at === at &&
    e.scope === scope &&
    e.from === from &&
    e.to === to &&
    e.trigger === trigger &&
    e.policy_version === 'published-list-2026-11-17' &&
    e.reason.length > 0;
  check(
    `audit entry ${i + 1} (${scope} ${from} -> ${to})`,
    ok,
    e ? JSON.stringify(e) : 'missing',
  );
}
const c1Final = run.audit[19];
check(
  'audit entry 20 reason carries the exact comparison 5 x 5 = 25 >= 4 x 6 = 24',
  c1Final !== undefined &&
    c1Final.reason.includes('5 x 5 = 25 >= 4 x 6 = 24'),
  c1Final ? c1Final.reason : 'missing',
);

// --- Naive mode ---------------------------------------------------------------

const naiveEventsUpTo = (n: number): SimEvent[] =>
  NAIVE_STEPS.slice(0, n).flatMap((s) => s.events);

const n3 = deriveNaive(naiveEventsUpTo(4), NAIVE_STEPS[3].at);
check(
  'naive N3: widget A shows EXPIRED',
  n3.widgetA === 'EXPIRED',
  n3.widgetA,
);
check(
  'naive N3: widget B shows 23 days remaining at the same moment',
  n3.widgetB.includes('23 days remaining'),
  n3.widgetB,
);
check(
  'naive N3: both contradictory labels are present simultaneously',
  n3.widgetA === 'EXPIRED' && n3.widgetB.includes('23 days remaining'),
);
const n4 = deriveNaive(naiveEventsUpTo(5), NAIVE_STEPS[4].at);
check(
  'naive N4: widget A stays EXPIRED (latched) after another testimonial',
  n4.widgetA === 'EXPIRED',
  n4.widgetA,
);
check(
  'naive N4: widget B shows 22 days remaining',
  n4.widgetB.includes('22 days remaining'),
  n4.widgetB,
);
const corrected = derive(naiveEventsUpTo(5), POLICY_SNAPSHOT, NAIVE_STEPS[4].at);
check(
  'corrected model over the naive history: C4 IN_PROGRESS at 3 of 5',
  condOf(corrected, 'C4').status === 'IN_PROGRESS' &&
    condOf(corrected, 'C4').testimonials === 3,
  `${condOf(corrected, 'C4').status} / ${condOf(corrected, 'C4').testimonials}`,
);

// --- Boundary unit tests (spec section 10.1) ---------------------------------

const ACT: SimEvent = {
  type: 'activation_completed',
  at: T(0, 10, 0, 0),
  plan_includes_promise: true,
  profile_complete: true,
  snapshot: POLICY_SNAPSHOT,
};
const END = T(30, 10, 0, 0);

// B3: reply exactly at the deadline satisfies.
{
  const log: SimEvent[] = [
    ACT,
    { type: 'request_received', at: T(1, 10, 0), request_id: 'RX' },
    { type: 'request_replied', at: T(2, 10, 0, 0), request_id: 'RX' },
  ];
  const s = derive(log, POLICY_SNAPSHOT, T(2, 10, 0, 0));
  const inst = condOf(s, 'C2').instances[0];
  check('B3 reply exactly at deadline is SATISFIED', inst !== undefined && inst.status === 'SATISFIED', inst?.status);
}

// B5: duplicate event delivery counts once.
{
  const dup: SimEvent = { type: 'testimonial_approved', at: T(1, 10, 0), testimonial_id: 'TX' };
  const s = derive([ACT, dup, dup], POLICY_SNAPSHOT, T(1, 11, 0));
  check('B5 duplicate testimonial delivery counts once', condOf(s, 'C4').testimonials === 1, `${condOf(s, 'C4').testimonials}`);
}

// B6: out-of-order arrival derives identical state.
{
  const fullLog = DEMO_STEPS.flatMap((s) => s.events);
  const forward = derive(fullLog, POLICY_SNAPSHOT, END);
  const reversed = derive([...fullLog].reverse(), POLICY_SNAPSHOT, END);
  check(
    'B6 out-of-order log derives identical state',
    JSON.stringify(forward) === JSON.stringify(reversed),
  );
}

// B8: an event exactly at period end is outside the period.
{
  const log: SimEvent[] = [
    ACT,
    { type: 'request_received', at: END, request_id: 'RLATE' },
  ];
  const s = derive(log, POLICY_SNAPSHOT, T(31, 10, 0));
  check(
    'B8 request at the end instant counts for nothing',
    condOf(s, 'C1').received === 0 && condOf(s, 'C1').status === 'UNKNOWN',
    `${condOf(s, 'C1').received} / ${condOf(s, 'C1').status}`,
  );
}

// B9: a correction event re-derives the instance; the original stays in the log.
{
  const log: SimEvent[] = [
    ACT,
    { type: 'request_received', at: T(1, 10, 0), request_id: 'RC' },
  ];
  const missed = derive(log, POLICY_SNAPSHOT, T(3, 10, 0));
  check(
    'B9 before correction the instance is MISSED',
    condOf(missed, 'C2').instances[0]?.status === 'MISSED',
    condOf(missed, 'C2').instances[0]?.status,
  );
  const correctedLog: SimEvent[] = [
    ...log,
    {
      type: 'reply_corrected',
      at: T(3, 11, 0),
      request_id: 'RC',
      corrected_reply_at: T(1, 20, 0),
      correction_reason: 'Reply was sent in the app at 20:00; the log had no reply event.',
    },
  ];
  const fixed = derive(correctedLog, POLICY_SNAPSHOT, T(3, 11, 0));
  check(
    'B9 after correction the instance is SATISFIED',
    condOf(fixed, 'C2').instances[0]?.status === 'SATISFIED',
    condOf(fixed, 'C2').instances[0]?.status,
  );
}

// Events that meet C3 and C4, so a scenario can isolate C1/C2 with no
// confirmed miss anywhere (the precondition of B10 and B11).
function fulfilOtherConditions(): SimEvent[] {
  const evts: SimEvent[] = [];
  for (let k = 0; k < 24; k++) {
    evts.push({ type: 'calendar_day_open', at: T(k, 10, 0), bucket_index: k });
  }
  for (let n = 1; n <= 5; n++) {
    evts.push({
      type: 'testimonial_approved',
      at: T(n, 12, 0),
      testimonial_id: `TU${n}`,
    });
  }
  return evts;
}

// B10: withdrawn request.
{
  const log: SimEvent[] = [
    ACT,
    ...fulfilOtherConditions(),
    { type: 'request_received', at: T(1, 10, 0), request_id: 'RW' },
    { type: 'request_withdrawn', at: T(1, 12, 0), request_id: 'RW' },
  ];
  const s = derive(log, POLICY_SNAPSHOT, END);
  check(
    'B10 withdrawn instance is WITHDRAWN_UNRESOLVED',
    condOf(s, 'C2').instances[0]?.status === 'WITHDRAWN_UNRESOLVED',
    condOf(s, 'C2').instances[0]?.status,
  );
  check(
    'B10 C1 and C2 UNKNOWN at period end, result CANNOT_DETERMINE',
    condOf(s, 'C1').status === 'UNKNOWN' &&
      condOf(s, 'C2').status === 'UNKNOWN' &&
      s.overall === 'CANNOT_DETERMINE',
    `${condOf(s, 'C1').status} / ${condOf(s, 'C2').status} / ${s.overall}`,
  );
}

// B11: zero requests in the whole period, with C3 and C4 met, so there is
// no confirmed miss and the unknowns decide the result.
{
  const s = derive([ACT, ...fulfilOtherConditions()], POLICY_SNAPSHOT, END);
  check(
    'B11 zero requests: C1 and C2 UNKNOWN, result CANNOT_DETERMINE',
    condOf(s, 'C1').status === 'UNKNOWN' &&
      condOf(s, 'C2').status === 'UNKNOWN' &&
      s.overall === 'CANNOT_DETERMINE',
    `${condOf(s, 'C1').status} / ${condOf(s, 'C2').status} / ${s.overall}`,
  );
}

// B12: activation without the Promise.
{
  const noPromise: SimEvent = {
    type: 'activation_completed',
    at: T(0, 10, 0, 0),
    plan_includes_promise: false,
    profile_complete: true,
    snapshot: POLICY_SNAPSHOT,
  };
  const s = derive([noPromise], POLICY_SNAPSHOT, T(5, 10, 0));
  check(
    'B12 no Promise: NO_PROMISE and conditions NOT_APPLICABLE',
    s.overall === 'NO_PROMISE' && condOf(s, 'C1').status === 'NOT_APPLICABLE',
    `${s.overall} / ${condOf(s, 'C1').status}`,
  );
}

console.log(`\n${checks - failures}/${checks} checks passed, ${failures} failed.`);
if (failures > 0) {
  process.exit(1);
}
