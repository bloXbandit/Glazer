// ============================================================
// VOICE WEBHOOK — POST /api/intake/voice-webhook
// SignalWire calls this when an inbound call arrives.
// Returns SWML JSON that activates the AI voice concierge.
//
// POST /api/intake/voice-webhook/summary
// Receives the AI post-prompt summary when call ends,
// creates client record + fires email.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { swmlAiAgent } from '@/lib/signalwire';

// ── Inbound call handler — returns SWML ───────────────────────

export async function POST(req: NextRequest) {
  // Parse caller phone from SignalWire request
  let callerPhone = '';
  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData();
      callerPhone = (form.get('From') as string) ?? '';
    } else {
      const json = await req.json().catch(() => ({}));
      callerPhone = json.From ?? json.from ?? json.caller_id_number ?? '';
    }
  } catch { /* no-op */ }

  console.log(`[voice-webhook] Inbound call from ${callerPhone}`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`;
  const summaryWebhook = `${appUrl}/api/intake/voice-webhook/summary`;

  // tryOwnerFirst=true  → SWML rings owner's real phone for 20 s, then Grace picks up
  // tryOwnerFirst=false → Grace answers immediately (use when number IS the forward target)
  const tryOwnerFirst = process.env.VOICE_TRY_OWNER_FIRST === 'true';

  const swml = swmlAiAgent({
    companyName:   process.env.COMPANY_NAME  ?? 'GlazePro DMV',
    webhookUrl:    summaryWebhook,
    ownerPhone:    process.env.OWNER_PHONE   ?? '',
    tryOwnerFirst,
  });

  return NextResponse.json(swml, {
    headers: { 'Content-Type': 'application/json' },
  });
}

