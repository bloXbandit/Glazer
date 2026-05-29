// ============================================================
// SIGNALWIRE HELPERS
// SMS sending + SWML voice response builders.
// All credentials read from env — never hardcoded.
// SignalWire REST API is Twilio-compatible.
// ============================================================

// ── Config ────────────────────────────────────────────────────

function getConfig() {
  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const spaceUrl  = process.env.SIGNALWIRE_SPACE_URL;
  const apiToken  = process.env.SignalWire_API_KEY ?? process.env.SIGNALWIRE_API_TOKEN;
  const fromNumber = process.env.SIGNALWIRE_FROM_NUMBER;

  if (!projectId || !spaceUrl || !apiToken || !fromNumber) {
    throw new Error(
      'Missing SignalWire env vars: SIGNALWIRE_PROJECT_ID, SIGNALWIRE_SPACE_URL, SignalWire_API_KEY, SIGNALWIRE_FROM_NUMBER'
    );
  }

  return { projectId, spaceUrl, apiToken, fromNumber };
}

// ── SMS — send outbound message ───────────────────────────────

export async function sendSms(to: string, body: string): Promise<{ sid: string }> {
  const { projectId, spaceUrl, apiToken, fromNumber } = getConfig();

  const url = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages.json`;
  const creds = Buffer.from(`${projectId}:${apiToken}`).toString('base64');

  const params = new URLSearchParams({ From: fromNumber, To: to, Body: body });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SignalWire SMS failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { sid: data.sid };
}

// ── SWML — voice response builders ────────────────────────────
// SWML = SignalWire Markup Language (JSON format)
// Return value is sent as application/json from voice webhook routes.

export interface SwmlSection {
  [action: string]: unknown;
}

/** Simple say + hang up */
export function swmlSay(text: string, hangup = false): object {
  const actions: SwmlSection[] = [{ say: { text, voice: 'en-US-Journey-F' } }];
  if (hangup) actions.push({ hangup: {} });
  return {
    version: '1.0.0',
    sections: { main: actions },
  };
}

/** Say + gather digits/speech, then redirect to a webhook */
export function swmlGather(opts: {
  say: string;
  action: string;  // webhook URL to POST result to
  input?: 'speech' | 'dtmf' | 'speech dtmf';
  timeout?: number;
  speechTimeout?: number;
}): object {
  return {
    version: '1.0.0',
    sections: {
      main: [
        {
          prompt: {
            play: { say: opts.say, voice: 'en-US-Journey-F' },
            input: [opts.input ?? 'speech dtmf'],
            timeout: opts.timeout ?? 5,
            speech_timeout: opts.speechTimeout ?? 3,
          },
        },
        { transfer: { dest: opts.action } },
      ],
    },
  };
}

/**
 * Full SignalWire AI Agent voice handler — Grace intake concierge.
 *
 * Supports two routing modes:
 *   tryOwnerFirst=true  → SWML rings owner phone first (20 s), then Grace picks up
 *   tryOwnerFirst=false → Grace answers immediately (missed-call forward scenario)
 *
 * Grace also exposes a SWAIG transfer_to_team function so she can warm-transfer
 * a caller to the owner mid-conversation if they ask to speak to someone live.
 */
export function swmlAiAgent(opts: {
  companyName:    string;
  webhookUrl:     string;   // POST target for post-call JSON summary
  ownerPhone?:    string;   // owner's real number for try-first + warm transfer
  tryOwnerFirst?: boolean;  // ring owner before Grace (default false)
  voice?:         string;   // TTS voice — default en-US-Neural2-F
}): object {
  const company    = opts.companyName;
  const owner      = opts.ownerPhone ?? process.env.OWNER_PHONE ?? '';
  const tryFirst   = opts.tryOwnerFirst ?? false;
  const voice      = opts.voice ?? process.env.GRACE_VOICE ?? 'en-US-Neural2-F';

  // ── Grace identity prompt ─────────────────────────────────────
  const systemPrompt = `Your name is Grace. You are the project intake coordinator for ${company} — a commercial glazing and glass contractor.

ROLE:
You answer calls that weren't picked up by our team. Your job is to capture just enough project information so we can prepare a quote and call back. You are NOT an AI, NOT a chatbot — you are a real coordinator doing your job over the phone. Never say you are AI. Never say "Great question" or "Certainly."

TONE:
- Confident, direct, and warm — like a coordinator who's been on job sites
- Short sentences on the phone. No long monologues.
- If caller sounds rushed, move faster. Match their energy.

OPENING (say this first, naturally):
"Hi — thanks for calling ${company}. This is Grace. I missed the team just now, but I can grab your project info and the right person will call you right back. It'll take about two minutes — does that work?"

COLLECT IN ORDER (conversational — don't read as a list, one question at a time):
1. Project city or address
2. Type of work — use plain language: storefront windows, office glass wall, apartment windows, school or hospital glazing, glass repair, or something else
3. New construction or replacing existing
4. Rough size — square footage, number of floors, or just ballpark ("big or small?")
5. Timeline — need it done soon, a few months out, or still planning?
6. Best name and email for the estimate

AFTER ALL 6:
"Perfect — I have what I need. I'll pass this to the team and someone will call you back soon. Have a great one."
Then end the call.

IF CALLER ASKS TO SPEAK TO SOMEONE LIVE:
Say: "Let me try to connect you — and I'll grab your name first just in case they're not available."
Get their name, then use the transfer_to_team function.

IF CALLER IS VAGUE OR SAYS "JUST A QUESTION":
Say: "Of course — and while I have you, let me grab your project info so the right person is ready when they call you back."

NEVER:
- Discuss pricing or give estimates
- Ask about glazing specs, systems, or technical details
- Ask more than 6 intake questions
- Make specific promises about callback timing`;

  // ── SWAIG warm-transfer function ──────────────────────────────
  const swaigFunctions = owner ? [
    {
      name: 'transfer_to_team',
      description: 'Transfer the caller to a live team member when they ask to speak to someone directly.',
      parameters: { type: 'object', properties: {} },
      data_map: {
        output: [
          {
            response: "One moment — I'll connect you right now.",
            action: [
              {
                SWML: {
                  version: '1.0.0',
                  sections: {
                    main: [
                      {
                        connect: {
                          to: owner,
                          timeout: 20,
                          answer_on_bridge: true,
                        },
                      },
                      {
                        say: {
                          text: "I'm sorry — it looks like they're not available at the moment. I've captured your information and someone will call you back shortly. Have a great day.",
                          voice,
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    },
  ] : [];

  // ── AI verb block ─────────────────────────────────────────────
  const aiBlock: Record<string, unknown> = {
    languages: [
      {
        name: 'English',
        code: 'en-US',
        voice,
        // fillers play while LLM is generating — eliminates dead silence
        speech_fillers: [
          'Mm-hmm.', 'Got it.', 'Sure.', 'Okay.', 'Right.', 'One sec.',
        ],
        function_fillers: [
          'One moment.', 'Let me grab that.', 'Just a second.',
        ],
      },
    ],
    prompt: {
      text:        systemPrompt,
      temperature: 0.7,   // enough variety to sound natural, not robotic
      top_p:       0.9,   // broad sampling = varied, human-like responses
      confidence:  0.6,   // ASR confidence threshold — ignore low-confidence noise
    },
    post_prompt: {
      text: 'Output ONLY a valid JSON object with these keys (omit any not captured): project_location, project_type_raw, new_construction (true/false/unknown), approx_size, timeline, name, email. No extra text.',
      temperature: 0,     // fully deterministic — no hallucination on JSON keys
      top_p:       0,     // same — lock it down
    },
    post_prompt_url: opts.webhookUrl,
    params: {
      end_of_speech_timeout:   1000,   // was 700 — gives caller time to finish thought
      attention_timeout:       30000,  // 30 s before nudging idle caller
      inactivity_timeout:      20000,  // hang up after 20 s total silence
      barge_confidence:        0.5,    // caller can interrupt naturally
      barge_min_words:         2,      // ignore single-word noise triggers
      acknowledge_speech_timeout: 500, // Grace acknowledges caller quickly
    },
  };

  if (swaigFunctions.length > 0) {
    aiBlock.SWAIG = { functions: swaigFunctions };
  }

  // ── Build main section — optionally try owner first ───────────
  const mainActions: unknown[] = [];

  if (tryFirst && owner) {
    mainActions.push({
      connect: {
        to: owner,
        timeout: 20,
        answer_on_bridge: true,
      },
    });
  }

  mainActions.push({ ai: aiBlock });

  return {
    version: '1.0.0',
    sections: { main: mainActions },
  };
}

// ── Outbound call — trigger via REST API ──────────────────────

export async function triggerOutboundCall(opts: {
  to: string;         // client phone
  swmlWebhookUrl: string; // URL that returns SWML when SignalWire calls it
}): Promise<{ sid: string }> {
  const { projectId, spaceUrl, apiToken, fromNumber } = getConfig();
  const url = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Calls.json`;
  const creds = Buffer.from(`${projectId}:${apiToken}`).toString('base64');

  const params = new URLSearchParams({
    From: fromNumber,
    To:   opts.to,
    Url:  opts.swmlWebhookUrl,
    Method: 'POST',
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SignalWire outbound call failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { sid: data.sid };
}

// ── Follow-up SWML — Grace re-engages an existing lead ────────

export function swmlFollowUpCall(opts: {
  clientName:    string | null;
  companyName:   string;
  projectType:   string | null;
  resultWebhook: string;   // POST target for call outcome JSON
  voice?:        string;
}): object {
  const name    = opts.clientName ?? 'there';
  const project = opts.projectType ? `your ${opts.projectType} project` : 'your glazing project';
  const voice   = opts.voice ?? process.env.GRACE_VOICE ?? 'deepgram.aura-asteria-en';

  const systemPrompt = `Your name is Grace. You are a project coordinator at ${opts.companyName}.

You are calling ${name} for a brief, friendly check-in about ${project} inquiry.

YOUR GOAL: Find out ONE thing — are they still interested in moving forward?

OPENING (say this naturally):
"Hi, is this ${name}? Hey — this is Grace calling from ${opts.companyName}. I'm just following up on the glazing project you reached out about. Did you still want to move forward with getting a quote?"

THEN listen. Based on their response:

IF YES / STILL INTERESTED:
- Confirm any key project details that may have changed (location, timeline, size).
- Say: "Perfect — I'll flag this for our team and someone will be in touch very shortly."
- Set outcome to "interested".

IF NO / NOT INTERESTED:
- Say: "No worries at all — I'll take you off our follow-up list. If you ever need glazing work done, don't hesitate to reach out. Take care!"
- Set outcome to "no_interest".

IF UNCLEAR / MAYBE / BUSY:
- Say: "Totally understand — I'll make a note and reach back out in a couple weeks. Thanks for picking up!"
- Set outcome to "follow_up_again".

IMPORTANT:
- Keep it under 90 seconds total.
- Do NOT ask all 6 intake questions again — they already came to us.
- Be warm and direct. This is a check-in, not a new intake call.
- Never say you are AI.`;

  return {
    version: '1.0.0',
    sections: {
      main: [
        {
          ai: {
            languages: [
              {
                name: 'English',
                code: 'en-US',
                voice,
                speech_fillers: ['Mm-hmm.', 'Sure.', 'Got it.'],
              },
            ],
            prompt: {
              text:        systemPrompt,
              temperature: 0.7,
              top_p:       0.9,
              confidence:  0.6,
            },
            post_prompt: {
              text: 'Output ONLY valid JSON with these keys: outcome ("interested"|"no_interest"|"follow_up_again"|"no_answer"), notes (brief summary, max 1 sentence). No extra text.',
              temperature: 0,
              top_p:       0,
            },
            post_prompt_url: opts.resultWebhook,
            params: {
              end_of_speech_timeout:   1000,
              attention_timeout:       20000,
              inactivity_timeout:      15000,
              barge_confidence:        0.5,
              barge_min_words:         2,
              hard_stop_time:          '3m',
            },
          },
        },
      ],
    },
  };
}

// ── Phone number normalizer ────────────────────────────────────

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return raw; // pass through if already formatted
}
