// The fixed follow-up sequence — fast first touch, then decreasing
// frequency, matching standard abandoned-cart/lead-nurture cadences
// rather than repeated same-day pressure (which risks WhatsApp's
// per-number quality rating, not just annoying the customer). Timing and
// tone are fixed in code, not business-editable — see docs/FUTURE.md and
// session design notes: with one business and no outcome data yet, a
// configurable sequence editor would just be configuring guesses. What IS
// business-editable is how many of these steps to run before giving up
// (BusinessConfig.maxFollowups, clamped to this array's length).
//
// deltaHours is measured from the PREVIOUS step's actual fire time (step
// 1 from the trigger moment) — not a fixed offset from the trigger — so
// a customer-specific first delay (e.g. "I'll pay this evening") doesn't
// throw the rest of the sequence into the past.
export interface FollowupStepDefinition {
  step: number;
  deltaHours: number;
  angle: string;
}

export const FOLLOWUP_SEQUENCE: FollowupStepDefinition[] = [
  {
    step: 1,
    deltaHours: 1,
    angle: "A simple, low-pressure check-in — they may have just gotten busy.",
  },
  {
    step: 2,
    deltaHours: 5,
    angle:
      "Address likely hesitation directly (trust, value) — a different angle than the first touch, not a repeat.",
  },
  {
    step: 3,
    deltaHours: 18,
    angle: "Reinforce the real benefit/value of the product from a fresh angle.",
  },
  {
    step: 4,
    deltaHours: 48,
    angle: "A brief, low-key check-in — keep it short, no pressure.",
  },
  {
    step: 5,
    deltaHours: 96,
    angle:
      "This is the final automated follow-up in the sequence. Be warm, explicitly acknowledge this is the last check-in, and leave the door open without pressuring them — never manufacture urgency.",
  },
];

export const MAX_SEQUENCE_STEPS = FOLLOWUP_SEQUENCE.length;

export function stepDefinition(step: number): FollowupStepDefinition | undefined {
  return FOLLOWUP_SEQUENCE.find((s) => s.step === step);
}

// A business owner can end the sequence earlier than the full 5 steps
// (BusinessConfig.maxFollowups) but never extend it past what's actually
// designed.
export function clampMaxFollowups(value: number): number {
  return Math.min(Math.max(Math.round(value), 1), MAX_SEQUENCE_STEPS);
}
