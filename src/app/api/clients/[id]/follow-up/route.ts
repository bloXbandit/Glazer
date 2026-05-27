// ============================================================
// FOLLOW-UP TRIGGER — POST /api/clients/[id]/follow-up
// Initiates an outbound AI check-in call to the client via
// SignalWire.  Returns the call SID on success.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getClient, setFollowUpStatus } from '@/lib/db';
import { triggerOutboundCall } from '@/lib/signalwire';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = getClient(params.id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  if (!client.phone) {
    return NextResponse.json({ error: 'Client has no phone number' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`;

  // The SWML webhook returns the follow-up call script when SignalWire dials out
  const swmlUrl   = `${appUrl}/api/clients/${params.id}/follow-up/swml`;
  // After the call, SignalWire posts the AI summary here
  const resultUrl = `${appUrl}/api/clients/${params.id}/follow-up/result`;

  console.log(`[follow-up] Triggering outbound call to ${client.phone} for client ${params.id}`);

  try {
    const { sid } = await triggerOutboundCall({
      to:             client.phone,
      swmlWebhookUrl: swmlUrl,
    });

    setFollowUpStatus(params.id, 'scheduled');

    return NextResponse.json({ ok: true, sid, resultUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[follow-up] Outbound call failed: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
