// ============================================================
// VOICE SUMMARY WEBHOOK — POST /api/intake/voice-webhook/summary
// SignalWire AI Agent posts here after every call ends.
// Parses the post_prompt JSON, creates/updates client record,
// fires lead summary email to owner.
//
// Defensive parsing — SignalWire sends post_prompt_data as either
// a string OR a pre-parsed object. Handles both.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { upsertClient, createSession, updateSession, logMessage } from '@/lib/db';
import { mapToGlazingCategory, scoreLead } from '@/lib/intakeFlow';
import { sendLeadSummaryEmail } from '@/lib/emailDispatch';
import { normalizePhone } from '@/lib/signalwire';

// Field names SignalWire uses for the caller number across payload variants
const PHONE_KEYS = [
  'caller_id_number', 'caller_id_num', 'from', 'From',
  'callerIdNumber', 'caller_number', 'callerNumber', 'from_number',
];
// Nested objects that may carry call metadata, by payload variant
const PHONE_CONTAINERS = ['data', 'call', 'call_info', 'channel_data', 'vars', 'call_data'];

function pickPhone(obj: Record<string, unknown> | undefined): string {
  if (!obj) return '';
  for (const key of PHONE_KEYS) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function extractPhone(body: Record<string, unknown>): string {
  // Direct fields
  const direct = pickPhone(body);
  if (direct) return direct;
  // Known nested containers (SignalWire varies by SWML version)
  for (const container of PHONE_CONTAINERS) {
    const nested = body[container];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const v = pickPhone(nested as Record<string, unknown>);
      if (v) return v;
    }
  }
  // Try call_log first entry metadata
  const callLog = body.call_log as Array<Record<string, unknown>> | undefined;
  if (callLog && callLog.length > 0) {
    const v = pickPhone(callLog[0]);
    if (v) return v;
  }
  return '';
}

function extractSummary(body: Record<string, unknown>): Record<string, unknown> {
  // 1. post_prompt_data might already be parsed JSON
  const ppd = body.post_prompt_data;
  if (ppd && typeof ppd === 'object' && !Array.isArray(ppd)) {
    console.log('[voice/summary] post_prompt_data is pre-parsed object');
    return ppd as Record<string, unknown>;
  }

  // 2. post_prompt_data might be a JSON string
  if (typeof ppd === 'string' && ppd) {
    try { return JSON.parse(ppd); } catch { /* fall through */ }
  }

  // 3. Try post_prompt_response
  const ppr = body.post_prompt_response;
  if (ppr && typeof ppr === 'object' && !Array.isArray(ppr)) {
    return ppr as Record<string, unknown>;
  }
  if (typeof ppr === 'string' && ppr) {
    try { return JSON.parse(ppr); } catch { /* fall through */ }
  }

  // 4. Try result
  const result = body.result;
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result as Record<string, unknown>;
  }
  if (typeof result === 'string' && result) {
    const m = result.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { /* fall through */ }
    }
  }

  // 5. Try call_log — last assistant message may contain JSON
  const callLog = body.call_log as Array<Record<string, unknown>> | undefined;
  if (callLog) {
    for (let i = callLog.length - 1; i >= 0; i--) {
      const entry = callLog[i];
      if (entry.role === 'assistant' && typeof entry.content === 'string') {
        const content = entry.content as string;
        const m = content.match(/\{[\s\S]*\}/);
        if (m) {
          try { return JSON.parse(m[0]); } catch { continue }
        }
      }
    }
  }

  return {};
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};

  try {
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData();
      form.forEach((v, k) => { body[k] = v; });
    } else {
      body = await req.json();
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  console.log('[voice/summary] Received payload keys:', Object.keys(body).join(', '));

  // ── Extract caller phone ───────────────────────────────────
  const rawPhone = extractPhone(body);
  const callerPhone = rawPhone ? normalizePhone(rawPhone) : '';

  if (!callerPhone) {
    console.warn('[voice/summary] No caller phone in payload — record not created');
    console.warn('[voice/summary] Available top-level keys:', Object.keys(body).join(', '));
    return NextResponse.json({ ok: true, note: 'no caller phone' });
  }

  // ── Parse project summary from post_prompt result ──────────
  const parsed = extractSummary(body);
  console.log('[voice/summary] Parsed fields:', Object.keys(parsed));
  if (Object.keys(parsed).length === 0) {
    console.warn('[voice/summary] Could not extract structured summary from payload');
  }

  // ── Score and store ────────────────────────────────────────
  const rawType  = (parsed.project_type_raw as string) ?? '';
  const category = rawType ? mapToGlazingCategory(rawType) : 'unknown';
  const { score, label } = scoreLead({ ...parsed, glazing_category: category });

  const newConstRaw = parsed.new_construction;
  const newConst =
    newConstRaw === true  || newConstRaw === 'true'  ? 1 :
    newConstRaw === false || newConstRaw === 'false' ? 0 : null;

  const client = upsertClient({
    phone:            callerPhone,
    name:             (parsed.name as string)             ?? null,
    email:            (parsed.email as string)            ?? null,
    project_location: (parsed.project_location as string) ?? null,
    project_type_raw: rawType || null,
    glazing_category: category,
    approx_size:      (parsed.approx_size as string)      ?? null,
    timeline:         (parsed.timeline as string)         ?? null,
    new_construction: newConst,
    status:           'new',
    lead_score:       score,
    lead_score_label: label,
    contact_type:     'voice',
  });

  // ── Persist call transcript to CRM conversations ───────────
  // Makes the Grace call visible on the client card, same as SMS threads.
  try {
    const callLog = body.call_log as Array<Record<string, unknown>> | undefined;
    if (callLog && callLog.length > 0) {
      const session = createSession(callerPhone, 'voice');
      let logged = 0;
      for (const entry of callLog.slice(0, 100)) {
        const role = entry.role;
        const content = typeof entry.content === 'string' ? entry.content.trim() : '';
        if (!content || (role !== 'user' && role !== 'assistant')) continue;
        logMessage(session.id, role === 'user' ? 'inbound' : 'outbound', content, client.id);
        logged++;
      }
      updateSession(callerPhone, { status: 'completed', client_id: client.id });
      console.log(`[voice/summary] Transcript logged: ${logged} turns → session ${session.id}`);
    }
  } catch (err) {
    // Transcript is best-effort — never lose the lead over logging
    console.error('[voice/summary] Transcript logging failed:', err);
  }

  sendLeadSummaryEmail(client).catch(err =>
    console.error('[voice/summary] Email dispatch failed:', err)
  );

  console.log(`[voice/summary] Lead saved: ${client.id} — ${label} (${score}/100) from ${callerPhone}`);
  return NextResponse.json({ ok: true, client_id: client.id, score, label });
}
