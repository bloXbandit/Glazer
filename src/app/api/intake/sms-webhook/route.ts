// ============================================================
// SMS WEBHOOK — POST /api/intake/sms-webhook
// SignalWire calls this when an inbound SMS arrives on the
// intake number. Processes the conversation state machine,
// persists to SQLite, and sends the next question.
// Returns TwiML/LaML XML (SignalWire expects this format).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getSession, createSession, updateSession,
  upsertClient, logMessage, getClientByPhone,
} from '@/lib/db';
import { processStep, triggerMessage, scoreLead, isOptOut } from '@/lib/intakeFlow';
import { sendLeadSummaryEmail } from '@/lib/emailDispatch';

// Return LaML XML response (SignalWire will send this as the SMS reply)
function lamlSms(body: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(body)}</Message>
</Response>`;
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

// Empty response when we handle sending via REST API directly
function lamlEmpty(): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function POST(req: NextRequest) {
  let from = '', body = '';

  // SignalWire posts form-encoded data
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await req.formData();
    from = (formData.get('From') as string) ?? '';
    body = (formData.get('Body') as string) ?? '';
  } else {
    const json = await req.json().catch(() => ({}));
    from = json.From ?? json.from ?? '';
    body = json.Body ?? json.body ?? '';
  }

  if (!from) {
    return new NextResponse('Missing From number', { status: 400 });
  }

  console.log(`[sms-webhook] Inbound from ${from}: "${body}"`);

  // ── Handle opt-out before anything else ──
  if (isOptOut(body)) {
    const session = getSession(from);
    if (session) {
      updateSession(from, { status: 'opted_out' });
    }
    return lamlSms(`No problem — we won't send any more messages. Feel free to call us anytime.`);
  }

  // ── Get or create session ──
  let session = getSession(from);
  if (!session) {
    // Unsolicited inbound — start fresh if they text us first
    session = createSession(from, 'sms');
    const openingMsg = triggerMessage();
    logMessage(session.id, 'outbound', openingMsg, session.client_id ?? undefined);
    return lamlSms(openingMsg);
  }

  // Log inbound message
  logMessage(session.id, 'inbound', body, session.client_id ?? undefined);

  // ── Process current step ──
  const collected = JSON.parse(session.collected) as Record<string, unknown>;
  const result = processStep(session.step, body, collected);

  // Update session
  updateSession(from, {
    step:      result.nextStep,
    status:    result.done ? 'completed' : 'active',
    collected: result.newCollected,
  });

  // Log outbound reply
  logMessage(session.id, 'outbound', result.reply, session.client_id ?? undefined);

  // ── If done — create/update client record ──
  if (result.done) {
    const { score, label } = scoreLead(result.newCollected);
    const c = result.newCollected;

    const client = upsertClient({
      phone:            from,
      name:             (c.name as string) ?? null,
      email:            (c.email as string) ?? null,
      project_location: (c.project_location as string) ?? null,
      project_type_raw: (c.project_type_raw as string) ?? null,
      glazing_category: (c.glazing_category as string) ?? null,
      approx_size:      (c.approx_size as string) ?? null,
      timeline:         (c.timeline as string) ?? null,
      new_construction: c.new_construction === true ? 1 : c.new_construction === false ? 0 : null,
      status:           'new',
      lead_score:       score,
      lead_score_label: label,
      contact_type:     'sms',
    });

    // Link session to client
    updateSession(from, { client_id: client.id });

    // Fire summary email (non-blocking)
    sendLeadSummaryEmail(client).catch(err =>
      console.error('[sms-webhook] Email dispatch failed:', err)
    );

    console.log(`[sms-webhook] Lead captured: ${client.id} — ${label} (${score}/100)`);
  }

  return lamlSms(result.reply);
}
