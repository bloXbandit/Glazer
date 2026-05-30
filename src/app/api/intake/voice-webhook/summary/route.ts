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
import { upsertClient } from '@/lib/db';
import { mapToGlazingCategory, scoreLead } from '@/lib/intakeFlow';
import { sendLeadSummaryEmail } from '@/lib/emailDispatch';

function extractPhone(body: Record<string, unknown>): string {
  // Direct fields
  for (const key of ['caller_id_number', 'from', 'From', 'callerIdNumber', 'caller_number', 'callerNumber']) {
    const v = body[key];
    if (typeof v === 'string' && v) return v;
  }
  // Nested in data
  const data = body.data as Record<string, unknown> | undefined;
  if (data) {
    for (const key of ['caller_id_number', 'from', 'From']) {
      const v = data[key];
      if (typeof v === 'string' && v) return v;
    }
  }
  // Try call_log first entry metadata
  const callLog = body.call_log as Array<Record<string, unknown>> | undefined;
  if (callLog && callLog.length > 0) {
    const first = callLog[0];
    for (const key of ['from', 'From', 'caller_id_number']) {
      const v = first[key];
      if (typeof v === 'string' && v) return v;
    }
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
  const callerPhone = extractPhone(body);

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

  sendLeadSummaryEmail(client).catch(err =>
    console.error('[voice/summary] Email dispatch failed:', err)
  );

  console.log(`[voice/summary] Lead saved: ${client.id} — ${label} (${score}/100) from ${callerPhone}`);
  return NextResponse.json({ ok: true, client_id: client.id, score, label });
}
