import { useState } from 'react';
import {
  applyEvents,
  derive,
  deriveNaive,
  fmtDuration,
  fmtSecondsGap,
  fmtTime,
  initialRun,
  overallLabel,
  DAY,
} from './model';
import type {
  C2Instance,
  ConditionState,
  DerivedState,
  PolicySnapshot,
  RunState,
} from './model';
import {
  C2_CONTRACT_NOTE,
  CONDITION_META,
  CORRECTED_PANEL_ANSWER,
  DEMAND_CITIES,
  DEMAND_GLOBAL_SITTERS,
  DEMAND_READ_LINE,
  DEMAND_UK_FOOTNOTE,
  DEMO_STEPS,
  FEE_COVERS_QUOTE,
  FEE_STANDING_TEXT,
  JAIPUR_NO_DATA,
  JAIPUR_OPTION,
  NAIVE_AUDIT_NOTE,
  NAIVE_STEPS,
  POLICY_SNAPSHOT,
  REPORTED_HEADING,
  REPORTED_INTRO,
  WAIVER_QUOTE,
  interpretationLabel,
} from './data';

// ---------------------------------------------------------------------------

function chipClass(status: string): string {
  if (status === 'MET') return 'chip met';
  if (status === 'MISSED') return 'chip missed';
  if (
    status === 'UNKNOWN' ||
    status === 'UNRESOLVED' ||
    status === 'CLAIM_RECORDED_INTERPRETATION_UNCONFIRMED'
  ) {
    return 'chip amber';
  }
  return 'chip grey';
}

function Chip({ status }: { status: string }) {
  return <span className={chipClass(status)}>{status.replace(/_/g, ' ')}</span>;
}

function cond(state: DerivedState, id: string): ConditionState {
  return state.conditions.find((c) => c.id === id) as ConditionState;
}

function InterpretationLabels({ ids }: { ids: string[] }) {
  const labels = ids
    .map((id) => ({ id, text: interpretationLabel(id) }))
    .filter((x) => x.text !== null);
  if (labels.length === 0) return null;
  return (
    <div>
      {labels.map((x) => (
        <p key={x.id} className="small">
          {x.id}: {x.text}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ReportedSection({ snapshot }: { snapshot: PolicySnapshot }) {
  return (
    <div className="reported-section">
      <h4>{REPORTED_HEADING}</h4>
      <p className="small">{REPORTED_INTRO}</p>
      {snapshot.reported_items_as_shown.map((item) => (
        <div key={item.id} className="reported-card">
          <p>{item.display_text}</p>
          <p className="small">
            {item.id} ·{' '}
            {item.evidence_class === 'REPORTED_ENFORCEMENT'
              ? 'Reported enforcement'
              : 'Unconfirmed interpretation'}{' '}
            · Status: NOT EVALUATED · Source: {item.source_url}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function DemandPanel() {
  const [city, setCity] = useState('London');
  const selected = DEMAND_CITIES.find((c) => c.name === city);
  return (
    <div className="card">
      <h4>Owner requests in the last 30 days, as published by Sittsy</h4>
      <p className="small">
        {DEMAND_GLOBAL_SITTERS}, across all markets. {DEMAND_READ_LINE}
      </p>
      <label>
        City:{' '}
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          {DEMAND_CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}, {c.country}
            </option>
          ))}
          <option value={JAIPUR_OPTION}>{JAIPUR_OPTION}</option>
        </select>
      </label>
      {city === JAIPUR_OPTION ? (
        <p>{JAIPUR_NO_DATA}</p>
      ) : selected ? (
        <div>
          <p>
            Sitters in {selected.name}: {selected.sitters}
            <br />
            Owner requests reaching {selected.name} in the last 30 days:{' '}
            {selected.requests === 0 ? 'none (0)' : selected.requests}
            <br />
            {selected.country} total: {selected.countryTotal} owner requests
            reached the country in the last 30 days.
          </p>
          <p className="small">
            Source: {selected.source} · {DEMAND_READ_LINE}
            {selected.country === 'United Kingdom' ? ` ${DEMAND_UK_FOOTNOTE}` : ''}
          </p>
        </div>
      ) : null}
      <p className="small">
        Requests are not bookings, and bookings are not earnings. This panel is
        context only; it is never an input to any condition. Sittsy publishes:
        "Eligibility for the guarantee is based on the stated terms and
        conditions, not on the number of sitters in your town."
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function BeforeYouPay({ snapshot }: { snapshot: PolicySnapshot }) {
  const c8 = snapshot.conditions_as_shown.find((c) => c.id === 'C8');
  return (
    <div>
      <h3>Before you pay: what the Money Back Promise actually requires</h3>

      <div className="card">
        <h4>The activation fee</h4>
        <p>{FEE_STANDING_TEXT}</p>
        {snapshot.fee_amount_shown !== null && (
          <p>
            On this sitter's Pay button (simulated): {snapshot.fee_currency}{' '}
            {snapshot.fee_amount_shown}.
          </p>
        )}
        <p className="small">
          What the fee covers, in Sittsy's published words: "{FEE_COVERS_QUOTE}"
        </p>
        <p className="small">
          Published wording shown before paying (EU/UK waiver): "{WAIVER_QUOTE}"
          Quoted as published wording. This prototype takes no position on it.
        </p>
      </div>

      {c8 && (
        <div className="card">
          <p>
            <strong>{c8.sitter_facing_text}</strong>
          </p>
          <p className="small">
            Published. Published wording: "{c8.published_wording}" Source:{' '}
            {c8.source_url}
          </p>
        </div>
      )}

      <h4>The published conditions</h4>
      {snapshot.conditions_as_shown
        .filter((c) => c.id !== 'C8')
        .map((c) => {
          const meta = CONDITION_META[c.id];
          return (
            <div key={c.id} className={meta.factPanel ? 'card fact' : 'card'}>
              <p>
                <strong>
                  {c.id}. {c.sitter_facing_text}
                </strong>
              </p>
              <p className="small">
                {meta.badge} · Published wording: "{c.published_wording}" ·
                Source: {c.source_url}
              </p>
              <p className="small">{meta.mechanic}</p>
              {c.id === 'C2' && <p className="small">{C2_CONTRACT_NOTE}</p>}
              <InterpretationLabels ids={meta.interpretationIds} />
            </div>
          );
        })}

      <ReportedSection snapshot={snapshot} />

      <DemandPanel />

      <p className="small">
        Policy snapshot: {snapshot.version}, captured at activation. Market:{' '}
        {snapshot.market}. This prototype tracks the published conditions in
        the snapshot. It does not decide refunds.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function instanceText(inst: C2Instance): string {
  switch (inst.status) {
    case 'SATISFIED': {
      if (inst.reply_at === null) return 'Replied in time.';
      const gap = inst.deadline - inst.reply_at;
      const after = fmtDuration(inst.reply_at - inst.received_at);
      if (gap <= 60) {
        return `Replied after ${after}, ${fmtSecondsGap(gap)} before the deadline.`;
      }
      return `Replied after ${after}.`;
    }
    case 'MISSED':
      if (inst.reply_at !== null && inst.reply_at > inst.deadline) {
        return `Replied ${fmtSecondsGap(inst.reply_at - inst.deadline)} after the deadline; does not satisfy the condition as published.`;
      }
      return `Deadline passed without a reply, ${fmtTime(inst.deadline)}.`;
    case 'PENDING':
      return `Waiting; deadline ${fmtTime(inst.deadline)}.`;
    case 'WITHDRAWN_UNRESOLVED':
      return 'Withdrawn - treatment unpublished.';
  }
}

function TrackerCard({ state, id }: { state: DerivedState; id: string }) {
  const c = cond(state, id);
  const meta = CONDITION_META[id];
  const name =
    state.snapshot?.conditions_as_shown.find((x) => x.id === id)
      ?.sitter_facing_text ?? id;
  return (
    <div className={meta.factPanel ? 'card fact' : 'card'}>
      <p>
        <strong>
          {id}. {name}
        </strong>{' '}
        <Chip status={c.status} />
      </p>
      {id === 'C1' && (
        <div>
          <p>
            {c.received === 0 && !state.ended
              ? 'No requests received yet.'
              : `Applied to ${c.applied} of ${c.received} requests so far.`}
          </p>
          {state.ended && (c.status === 'MET' || c.status === 'MISSED') && (
            <p className="small">
              Exact comparison at day 30: 5 x {c.applied} = {5 * c.applied}{' '}
              against 4 x {c.received} = {4 * c.received}.
            </p>
          )}
          <InterpretationLabels ids={['I2', 'I3']} />
          {c.received === 0 && <InterpretationLabels ids={['I4']} />}
        </div>
      )}
      {id === 'C2' && (
        <div>
          {c.instances.length === 0 ? (
            <p>No requests received yet.</p>
          ) : (
            <ul className="plain-list">
              {c.instances.map((inst) => (
                <li key={inst.request_id}>
                  {inst.request_id} (received {fmtTime(inst.received_at)}):{' '}
                  {instanceText(inst)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {id === 'C3' && (
        <div>
          <p>
            Calendar open on {c.openDays} of the first 30 days. Target 24.
          </p>
          {c.status === 'IN_PROGRESS' && (
            <p className="small">
              {24 - c.openDays} more open days needed; {c.remainingBuckets}{' '}
              days remain.
            </p>
          )}
          <InterpretationLabels ids={['I5']} />
        </div>
      )}
      {id === 'C4' && (
        <div>
          <p>{c.testimonials} of 5 approved testimonials.</p>
          <InterpretationLabels ids={['I6']} />
        </div>
      )}
      {id === 'C5' && (
        <div>
          <p>
            {c.profileComplete
              ? 'Profile reported complete.'
              : 'Profile reported not complete.'}
          </p>
          <ul className="plain-list">
            {c.profileHistory.map((h, i) => (
              <li key={i} className="small">
                {fmtTime(h.at)}: reported {h.complete ? 'complete' : 'not complete'}.
              </li>
            ))}
          </ul>
          <InterpretationLabels ids={['I7']} />
        </div>
      )}
      {id === 'C6' && (
        <div>
          {c.bookings.length === 0 ? (
            <p>
              {state.ended
                ? 'No booking event was recorded during the 30 days.'
                : 'No booking event recorded so far in this period.'}
            </p>
          ) : (
            c.bookings.map((b) => (
              <p key={b.booking_id}>
                A booking event was recorded on {fmtTime(b.at)} ({b.booking_id}).
              </p>
            ))
          )}
          <InterpretationLabels ids={['I8']} />
        </div>
      )}
      {id === 'C7' && (
        <div>
          {c.claimInPeriodAt === null && c.claimsAfterPeriod.length === 0 && (
            <p>No refund claim filed in this period.</p>
          )}
          {c.claimInPeriodAt !== null && (
            <div>
              <p>Claim filed {fmtTime(c.claimInPeriodAt)}, inside the 30 days.</p>
              <InterpretationLabels ids={['I9']} />
              <p>
                Your claim is recorded. What it means for the Promise is not
                published, so this tracker does not decide it.
              </p>
            </div>
          )}
          {c.claimsAfterPeriod.map((at) => (
            <p key={at}>
              Claim filed on {fmtTime(at)}, after the period ended, through the
              in-app route. Recorded; this tracker does not decide claims.
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Tracker({
  state,
  snapshot,
  asOf,
}: {
  state: DerivedState;
  snapshot: PolicySnapshot;
  asOf: number;
}) {
  if (!state.activated || state.periodStart === null || state.periodEnd === null) {
    return (
      <div>
        <div className="banner">
          Not started. This is the tracker you would see from the moment you
          activate; it is the same list you just read, tracked live.
        </div>
        {['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'].map((id) => (
          <div key={id} className="card">
            <p>
              <strong>
                {id}.{' '}
                {snapshot.conditions_as_shown.find((x) => x.id === id)
                  ?.sitter_facing_text}
              </strong>{' '}
              <Chip status="NOT_STARTED" />
            </p>
          </div>
        ))}
        <ReportedSection snapshot={snapshot} />
      </div>
    );
  }
  const { label, sub } = overallLabel(state);
  const dayNumber = Math.min(
    30,
    Math.floor((asOf - state.periodStart) / DAY) + 1,
  );
  return (
    <div>
      <div className="banner">
        <p>
          <strong>{label}</strong>
        </p>
        {sub && <p className="small">{sub}</p>}
        <p className="small">
          Day {dayNumber} of 30 · Your 30 days: {fmtTime(state.periodStart)}{' '}
          to {fmtTime(state.periodEnd)}.
        </p>
        <InterpretationLabels ids={['I1', 'I14']} />
      </div>
      {['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'].map((id) => (
        <TrackerCard key={id} state={state} id={id} />
      ))}
      <ReportedSection snapshot={snapshot} />
      <div className="card">
        {!state.ended ? (
          <p>
            Claims open after Day 30, in the app. There is no refund during the
            30 days.
          </p>
        ) : (
          <p>
            <strong>{label}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function App() {
  const [run, setRun] = useState<RunState>(() => initialRun(POLICY_SNAPSHOT));
  const [applied, setApplied] = useState(0);
  const [view, setView] = useState<'before' | 'tracker'>('before');
  const [naive, setNaive] = useState(false);
  const [naiveApplied, setNaiveApplied] = useState(1);

  const snapshot = run.derived.snapshot ?? POLICY_SNAPSHOT;
  const state = run.derived;

  const applyStep = (r: RunState, index: number): RunState => {
    const step = DEMO_STEPS[index];
    return applyEvents(r, step.events, step.at, step.auditTrigger, POLICY_SNAPSHOT);
  };

  const runNext = () => {
    if (naive) {
      if (naiveApplied < NAIVE_STEPS.length) setNaiveApplied(naiveApplied + 1);
      return;
    }
    if (applied >= DEMO_STEPS.length) return;
    setRun(applyStep(run, applied));
    setApplied(applied + 1);
  };

  const runAll = () => {
    if (naive) {
      setNaiveApplied(NAIVE_STEPS.length);
      return;
    }
    let r = run;
    for (let i = applied; i < DEMO_STEPS.length; i++) r = applyStep(r, i);
    setRun(r);
    setApplied(DEMO_STEPS.length);
  };

  const reset = () => {
    setRun(initialRun(POLICY_SNAPSHOT));
    setApplied(0);
    setNaiveApplied(1);
  };

  const toggleNaive = () => {
    if (!naive) setNaiveApplied(1);
    setNaive(!naive);
  };

  // Naive mode state, computed by its own two independent widgets.
  const naiveEvents = NAIVE_STEPS.slice(0, naiveApplied).flatMap((s) => s.events);
  const naiveAsOf =
    naiveApplied > 0 ? NAIVE_STEPS[naiveApplied - 1].at : NAIVE_STEPS[0].at;
  const naiveState = deriveNaive(naiveEvents, naiveAsOf);
  const corrected = derive(naiveEvents, POLICY_SNAPSHOT, naiveAsOf);
  const correctedC4 = cond(corrected, 'C4');

  const currentTime = naive
    ? fmtTime(naiveAsOf)
    : applied === 0
      ? 'Not started'
      : fmtTime(DEMO_STEPS[applied - 1].at);

  const steps = naive ? NAIVE_STEPS : DEMO_STEPS;
  const stepsApplied = naive ? naiveApplied : applied;

  return (
    <div className="page">
      <div className="header">
        <h1>Sitter Activation Clarity</h1>
        <p>
          A prototype: the Money Back Promise, shown before you pay and tracked
          from one source of truth.
        </p>
        <p className="small">
          Working prototype. Not affiliated with Sittsy. All Sittsy wording is
          quoted from public sources, cited on screen.
        </p>
      </div>

      <div className="layout">
        <div>
          <div className="phone">
            {!naive && (
              <div className="phone-tabs">
                <button
                  className={view === 'before' ? 'tab active' : 'tab'}
                  onClick={() => setView('before')}
                >
                  Before you pay
                </button>
                <button
                  className={view === 'tracker' ? 'tab active' : 'tab'}
                  onClick={() => setView('tracker')}
                >
                  Your first 30 days
                </button>
              </div>
            )}
            {naive ? (
              <div>
                <h3>Naive mode: two independent interpretations, no shared state</h3>
                <div className="widget">
                  <h4>Refund eligibility</h4>
                  <p className="widget-value">{naiveState.widgetA}</p>
                  {naiveState.widgetANotification && (
                    <p>
                      <strong>Notification: {naiveState.widgetANotification}</strong>
                    </p>
                  )}
                  <p className="small">
                    Computed on its own, from the reported 7-day testimonial
                    deadline. It consults nothing else.
                  </p>
                </div>
                <div className="widget">
                  <h4>Refund eligibility</h4>
                  <p className="widget-value">{naiveState.widgetB}</p>
                  <p className="small">
                    Computed on its own, from the 30-day period. It knows
                    nothing about any collection deadline.
                  </p>
                </div>
                <p className="small">
                  Same screen, same label, two answers. Each widget is a
                  plausible implementation on its own; together they contradict
                  each other, and nothing on the screen records why.
                </p>
              </div>
            ) : view === 'before' ? (
              <BeforeYouPay snapshot={snapshot} />
            ) : (
              <Tracker state={state} snapshot={snapshot} asOf={run.asOf} />
            )}
          </div>

          {naive && (
            <div className="corrected">
              <h3>The same history, through one derivation</h3>
              <p>
                Testimonials (published condition C4): {correctedC4.status},{' '}
                {correctedC4.testimonials} of 5 approved testimonials. The
                published list sets no collection deadline.
              </p>
              <p>
                Asked the same question both widgets claimed to answer, the
                single derivation says:
              </p>
              <div className="answer-box">{CORRECTED_PANEL_ANSWER}</div>
              <div className="evidence-row">
                <div className="evidence-box">
                  <strong>Published evidence</strong>
                  <p className="small">
                    Five approved testimonials, in the company reply
                    enumeration (Trustpilot). No deadline is published.
                  </p>
                </div>
                <div className="evidence-box">
                  <strong>Reported evidence</strong>
                  <p className="small">
                    A 7-day collection deadline, reported in a refund denial
                    (Padua case, Trustpilot). It does not appear in the
                    published list, so it sits in the reported section and is
                    never evaluated.
                  </p>
                </div>
              </div>
              <p className="small">
                Principle: never let independently maintained interpretations
                of the same policy determine the same user-facing result. One
                derivation produces one answer; where the evidence does not
                settle the question, the answer is Cannot determine, not two
                confident contradictions.
              </p>
            </div>
          )}
        </div>

        <div className="side">
          <div className="panel">
            <h3>
              {naive
                ? 'Naive timeline'
                : "Demo: a London sitter's first 30 days"}
            </h3>
            <p className="clock">{currentTime}</p>
            <div className="controls">
              <button onClick={runNext}>Run next event</button>
              <button onClick={runAll}>Run all</button>
              <button onClick={reset}>Reset</button>
              <button onClick={toggleNaive}>
                {naive ? 'Leave naive mode' : 'Naive mode: the contradiction'}
              </button>
            </div>
            <ol className="steps">
              {steps.map((s, i) => {
                const annotation = s.annotation;
                return (
                  <li key={i} className={i < stepsApplied ? 'applied' : ''}>
                    <span className="step-time">{fmtTime(s.at)}</span> {s.label}
                    {annotation ? (
                      <span className="small"> {annotation}</span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="panel">
            <h3>Audit trail</h3>
            {naive ? (
              <p>{NAIVE_AUDIT_NOTE}</p>
            ) : run.audit.length === 0 ? (
              <p className="small">No entries yet.</p>
            ) : (
              <table className="audit">
                <thead>
                  <tr>
                    <th>Seq</th>
                    <th>Time</th>
                    <th>Scope</th>
                    <th>Change</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {run.audit.map((e) => (
                    <tr key={e.seq}>
                      <td>{e.seq}</td>
                      <td>{fmtTime(e.at)}</td>
                      <td>{e.scope}</td>
                      <td>
                        {e.from} -&gt; {e.to}
                      </td>
                      <td>{e.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
