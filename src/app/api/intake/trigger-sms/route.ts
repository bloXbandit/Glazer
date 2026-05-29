// ============================================================
// TRIGGER SMS — POST /api/intake/trigger-sms
// Sends the opening intake SMS to a phone number.
// Called when a missed call is detected and forwarded, or
// manually from the dashboard to follow up on a lead.
//
// Body: { phone: string, force?: boolean }
// force=true re-opens a completed session for a new project.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { sendSms, normalizePhone } from '@/lib/signalwire';
import { createSession, getSession, logMessage, updateSession } from '@/lib/db';
import { triggerMessage } from '@/lib/intakeFlow';

export async function POST(req: NextRequest) {
  let phone = '', force = false;

  try {
    const body = await req.json();
    phone = body.phone ?? '';
    force = body.force === true;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!phone) {
    return NextResponse.json({ error: 'Missing phone number' }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);

  // Check for active session — don't re-trigger unless forced
  const existing = getSession(normalizedPhone);
  if (existing && !force) {
    return NextResponse.json({
      ok: false,
      reason: 'Active session already exists for this number. Pass force=true to restart.',
      session_step: existing.step,
    }, { status: 409 });
  }

  // Create (or reset) session
  if (force && existing) {
    updateSession(normalizedPhone, { status: 'abandoned' });
  }

  const session = createSession(normalizedPhone, 'sms');
  // The trigger message IS the first question (location), so step starts at 1.
  // processStep subtracts 1 for the array index; step=0 would give -1 → "already captured" bug.
  updateSession(normalizedPhone, { step: 1 });
  const msg = triggerMessage();

  try {
    const result = await sendSms(normalizedPhone, msg);
    logMessage(session.id, 'outbound', msg);

    console.log(`[trigger-sms] Sent to ${normalizedPhone}, SID: ${result.sid}`);

    return NextResponse.json({
      ok: true,
      sid: result.sid,
      session_id: session.id,
      message_sent: msg,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[trigger-sms] Failed for ${normalizedPhone}:`, errMsg);
    return NextResponse.json({ ok: false, error: errMsg }, { status: 502 });
  }
}
