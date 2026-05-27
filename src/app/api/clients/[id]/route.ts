// ============================================================
// CLIENT DETAIL API — GET/PATCH /api/clients/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getClient, updateClientStatus, getClientConversations, getDb } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = getClient(params.id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const conversations = getClientConversations(params.id);

  // Get session info
  const session = getDb()
    .prepare('SELECT * FROM intake_sessions WHERE client_id = ? ORDER BY started_at DESC LIMIT 1')
    .get(params.id) as Record<string, unknown> | undefined;

  return NextResponse.json({ client, conversations, session: session ?? null });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = getClient(params.id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const allowedFields = [
    'name', 'email', 'project_location', 'project_type_raw', 'glazing_category',
    'approx_size', 'timeline', 'new_construction', 'notes', 'status',
    'lead_score', 'lead_score_label', 'follow_up_status', 'follow_up_at', 'source',
  ];

  const updates = Object.entries(body)
    .filter(([k]) => allowedFields.includes(k));

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const setClause = updates.map(([k]) => `${k} = @${k}`).join(', ');
  getDb()
    .prepare(`UPDATE clients SET ${setClause}, updated_at = @updated_at WHERE id = @id`)
    .run({ ...Object.fromEntries(updates), updated_at: now, id: params.id });

  return NextResponse.json(getClient(params.id));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = getClient(params.id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Soft delete — set status to archived
  updateClientStatus(params.id, 'archived');
  return NextResponse.json({ ok: true });
}
