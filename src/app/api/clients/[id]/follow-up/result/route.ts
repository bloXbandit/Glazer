// ============================================================
// FOLLOW-UP RESULT — POST /api/clients/[id]/follow-up/result
// SignalWire posts the AI post_prompt JSON here after the call.
// Updates client follow_up_status and optionally client status.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getClient, setFollowUpStatus, updateClientStatus, getDb } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = getClient(params.id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let raw = '';
  const contentType = req.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const body = await req.json();
      // SignalWire wraps AI output in post_prompt_data or similar
      raw = body.post_prompt_data ?? body.ai_summary ?? JSON.stringify(body);
    } else {
      const text = await req.text();
      const params2 = new URLSearchParams(text);
      raw = params2.get('post_prompt_data') ?? params2.get('ai_summary') ?? text;
    }
  } catch {
    raw = '';
  }

  // Parse outcome JSON from Grace
  let outcome   = 'called';
  let notes     = '';
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      outcome = parsed.outcome ?? 'called';
      notes   = parsed.notes   ?? '';
    }
  } catch { /* use defaults */ }

  // Map outcome to follow_up_status and optionally update main status
  const followUpStatus =
    outcome === 'interested'      ? 'called' :
    outcome === 'no_interest'     ? 'no_interest' :
    outcome === 'follow_up_again' ? 'scheduled' :
    'called';

  setFollowUpStatus(params.id, followUpStatus);

  if (outcome === 'no_interest') {
    updateClientStatus(params.id, 'lost');
  } else if (outcome === 'interested') {
    updateClientStatus(params.id, 'contacted');
  }

  // Append notes to client notes field if we got something useful
  if (notes) {
    const existing = client.notes ?? '';
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const appended  = [existing, `[Follow-up ${timestamp}] ${notes}`].filter(Boolean).join('\n');
    getDb()
      .prepare('UPDATE clients SET notes = ?, updated_at = ? WHERE id = ?')
      .run(appended, new Date().toISOString(), params.id);
  }

  console.log(`[follow-up/result] Client ${params.id} outcome=${outcome} notes="${notes}"`);

  return NextResponse.json({ ok: true, outcome, notes });
}
