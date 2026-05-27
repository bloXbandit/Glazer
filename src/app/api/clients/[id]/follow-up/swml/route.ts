// ============================================================
// FOLLOW-UP SWML — POST /api/clients/[id]/follow-up/swml
// SignalWire fetches this when the outbound call is answered.
// Returns the SWML JSON that drives Grace's re-engagement script.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { swmlFollowUpCall } from '@/lib/signalwire';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = getClient(params.id);
  if (!client) {
    return NextResponse.json(
      { version: '1.0.0', sections: { main: [{ hangup: {} }] } }
    );
  }

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`;
  const resultUrl = `${appUrl}/api/clients/${params.id}/follow-up/result`;

  const swml = swmlFollowUpCall({
    clientName:    client.name,
    companyName:   process.env.COMPANY_NAME ?? 'Baltimore Glass Company',
    projectType:   client.project_type_raw,
    resultWebhook: resultUrl,
  });

  return NextResponse.json(swml, {
    headers: { 'Content-Type': 'application/json' },
  });
}
