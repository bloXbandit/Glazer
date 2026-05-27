// ============================================================
// INTAKE CONVERSATION FLOW — SMS State Machine
// Each step sends one message and expects one reply.
// Plain-language questions only — no glazing jargon.
// Internal glazing category mapping happens here.
// ============================================================

// ── Glazing category mapping ───────────────────────────────────

const PROJECT_TYPE_MAP: Record<string, string> = {
  '1': 'storefront',
  '2': 'storefront',
  '3': 'stick_curtain_wall',
  '4': 'unitized_curtain_wall',
  '5': 'window_wall',
  '6': 'fire_rated',
  '7': 'unknown',
  '8': 'unknown',
  storefront:   'storefront',
  entrance:     'storefront',
  door:         'storefront',
  window:       'storefront',
  office:       'stick_curtain_wall',
  commercial:   'stick_curtain_wall',
  curtain:      'unitized_curtain_wall',
  unitized:     'unitized_curtain_wall',
  'glass wall': 'unitized_curtain_wall',
  facade:       'unitized_curtain_wall',
  apartment:    'window_wall',
  residential:  'window_wall',
  condo:        'window_wall',
  school:       'fire_rated',
  hospital:     'fire_rated',
  institutional:'fire_rated',
  repair:       'storefront',
  replacement:  'storefront',
  skylight:     'skylight',
  railing:      'glass_railing',
};

export function mapToGlazingCategory(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [keyword, category] of Object.entries(PROJECT_TYPE_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return 'unknown';
}

// ── Lead scoring ───────────────────────────────────────────────

export interface LeadScore {
  score: number;         // 0–100
  label: string;         // 'High Value' | 'Commercial' | 'Residential' | 'Small Repair' | 'Unscored'
}

export function scoreLead(collected: Record<string, unknown>): LeadScore {
  let score = 0;

  const cat = (collected.glazing_category as string) ?? '';
  const size = ((collected.approx_size as string) ?? '').toLowerCase();
  const timeline = ((collected.timeline as string) ?? '').toLowerCase();
  const isNew = collected.new_construction;

  // Glazing category weight
  if (['unitized_curtain_wall', 'stick_curtain_wall'].includes(cat)) score += 40;
  else if (['window_wall', 'fire_rated', 'skylight', 'glass_railing'].includes(cat)) score += 25;
  else if (cat === 'storefront') score += 15;

  // Size signals
  if (/\d{4,}/.test(size) || /\d+\s*(floor|stor)/i.test(size)) score += 30;
  else if (/\d{3}/.test(size)) score += 15;
  else if (size.length > 3) score += 5;

  // New construction is higher value than repair
  if (isNew === true || isNew === 1 || String(isNew).toLowerCase() === 'new') score += 15;

  // Urgency
  if (timeline.includes('asap') || timeline.includes('soon')) score += 10;
  else if (timeline.includes('planning')) score += 5;

  // Contact completeness
  if (collected.email) score += 5;

  let label = 'Unscored';
  if (score >= 70) label = 'High Value';
  else if (score >= 45) label = 'Commercial';
  else if (score >= 25) label = 'Residential';
  else if (score > 0)   label = 'Small Repair';

  return { score: Math.min(score, 100), label };
}

// ── Conversation steps ─────────────────────────────────────────

export type StepKey =
  | 'location'
  | 'project_type'
  | 'new_vs_reno'
  | 'size'
  | 'timeline'
  | 'contact'
  | 'complete';

export interface FlowStep {
  key: StepKey;
  message: (companyName: string, collected?: Record<string, unknown>) => string;
  collect: (reply: string) => Record<string, unknown>;
}

const companyName = () =>
  process.env.COMPANY_NAME ?? 'GlazePro DMV';

export const INTAKE_STEPS: FlowStep[] = [
  {
    key: 'location',
    message: () =>
      `Hey — this is ${companyName()}. Sorry we missed your call. We'd love to help get your glazing quote started. What city or address is the project at?`,
    collect: (reply) => ({ project_location: reply.trim() }),
  },
  {
    key: 'project_type',
    message: () =>
      `Got it. What kind of glass work are you looking at? Reply with a number or just describe it:\n\n1) Storefront / entrance glass\n2) Commercial windows\n3) Full glass wall or facade\n4) Apartment / residential building\n5) School, hospital, or institution\n6) Repair or replacement\n7) Not sure yet`,
    collect: (reply) => {
      const raw = reply.trim();
      const category = mapToGlazingCategory(raw);
      return { project_type_raw: raw, glazing_category: category };
    },
  },
  {
    key: 'new_vs_reno',
    message: () =>
      `Is this a new construction project or a renovation / replacement?`,
    collect: (reply) => {
      const lower = reply.toLowerCase();
      const isNew = lower.includes('new') || lower.includes('construction') || lower.includes('build');
      return { new_construction: isNew };
    },
  },
  {
    key: 'size',
    message: () =>
      `Roughly how big is the project? Square footage, number of floors, or just ballpark it — whatever you have.`,
    collect: (reply) => ({ approx_size: reply.trim() }),
  },
  {
    key: 'timeline',
    message: () =>
      `What's your timeline looking like? (ASAP / a few months / still in planning)`,
    collect: (reply) => ({ timeline: reply.trim() }),
  },
  {
    key: 'contact',
    message: (_, collected) => {
      const loc = collected?.project_location ? ` in ${collected.project_location}` : '';
      return `Perfect${loc}. Last thing — what's your name and best email so we can send the estimate?`;
    },
    collect: (reply) => {
      // Try to extract name and email from free-form reply
      const emailMatch = reply.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
      const email = emailMatch?.[0] ?? null;
      // Name is everything that isn't the email address
      const name = email
        ? reply.replace(email, '').replace(/[,\s]+/g, ' ').trim() || null
        : reply.trim() || null;
      return { name, email };
    },
  },
];

// ── Closing message ────────────────────────────────────────────

export function closingMessage(collected: Record<string, unknown>): string {
  const name  = collected.name ? ` ${(collected.name as string).split(' ')[0]}` : '';
  const phone = process.env.OWNER_PHONE ?? '';
  const phoneNote = phone && !phone.includes('XXXX')
    ? ` You can also reach us directly at ${phone}.`
    : '';
  return `Thanks${name}! We've got your project info and someone from our team will follow up with your estimate shortly.${phoneNote} Have a great day.`;
}

// ── Opt-out detection ──────────────────────────────────────────

export function isOptOut(msg: string): boolean {
  return /^\s*(stop|unsubscribe|cancel|quit|end|optout|opt out|opt-out)\s*$/i.test(msg);
}

// ── Step processor ─────────────────────────────────────────────
// Returns { reply, collected, nextStep, done }

export function processStep(
  currentStep: number,
  inboundMessage: string,
  sessionCollected: Record<string, unknown>
): {
  reply: string;
  newCollected: Record<string, unknown>;
  nextStep: number;
  done: boolean;
} {
  if (isOptOut(inboundMessage)) {
    return {
      reply: `No problem — we won't send any more messages. Feel free to call us anytime.`,
      newCollected: sessionCollected,
      nextStep: currentStep,
      done: true,
    };
  }

  // Step 0 is the trigger (outbound only) — so step 1 = first reply
  const stepIndex = currentStep - 1; // steps array is 0-indexed
  const step = INTAKE_STEPS[stepIndex];

  if (!step) {
    return {
      reply: `We've already captured your info — our team will be in touch soon!`,
      newCollected: sessionCollected,
      nextStep: currentStep,
      done: true,
    };
  }

  // Collect data from this reply
  const collected = step.collect(inboundMessage);
  const merged = { ...sessionCollected, ...collected };

  const nextStep = currentStep + 1;
  const isLast = nextStep > INTAKE_STEPS.length;

  if (isLast) {
    return {
      reply: closingMessage(merged),
      newCollected: merged,
      nextStep,
      done: true,
    };
  }

  // Get next question
  const nextStepDef = INTAKE_STEPS[nextStep - 1];
  const reply = nextStepDef.message(companyName(), merged);

  return {
    reply,
    newCollected: merged,
    nextStep,
    done: false,
  };
}

// ── Initial trigger message (step 0) ──────────────────────────

export function triggerMessage(): string {
  return INTAKE_STEPS[0].message(companyName());
}
