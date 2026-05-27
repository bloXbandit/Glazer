// ============================================================
// VOICE SUMMARY WEBHOOK — POST /api/intake/voice-webhook/summary
// SignalWire AI Agent posts here after every call ends.
// Parses the post_prompt JSON, creates/updates client record,
// fires lead summary email to owner.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { upsertClient } from '@/lib/db';
import { mapToGlazingCategory, scoreLead } from '@/lib/intakeFlow';
import { sendLeadSummaryEmail } from '@/lib/emailDispatch';

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

  console.log('[voice/summary] Received payload:', JSON.stringify(body).slice(0, 600));

  // ── Extract caller phone ───────────────────────────────────
  const callerPhone: string =
    (body.caller_id_number as string) ??
    (body.from as string) ??
    (body.From as string) ??
    (body.callerIdNumber as string) ??
    '';

  if (!callerPhone) {
    console.warn('[voice/summary] No caller phone in payload — record not created');
    return NextResponse.json({ ok: true, note: 'no caller phone' });
  }

  // ── Parse project summary from post_prompt result ──────────
  // SignalWire sends the AI's post_prompt output in post_prompt_data
  const summaryRaw: string =
    (body.post_prompt_data as string) ??
    (body.post_prompt_response as string) ??
    (body.result as string) ??
    '';

  let parsed: Record<string, unknown> = {};
  if (summaryRaw) {
    const jsonMatch = summaryRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch { /* keep empty */ }
    }
  }

  console.log('[voice/summary] Parsed fields:', Object.keys(parsed));

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
