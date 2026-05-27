// ============================================================
// CLIENTS API — GET/POST /api/clients
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { listClients, upsertClient, getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit  = parseInt(searchParams.get('limit')  ?? '100');
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const status = searchParams.get('status');

  let clients = listClients(limit, offset);
  if (status === '__followup_due') {
    clients = clients.filter(c =>
      ['new', 'contacted'].includes(c.status) &&
      c.follow_up_status !== 'no_interest' &&
      new Date(c.created_at).getTime() < Date.now() - 86_400_000
    );
  } else if (status) {
    clients = clients.filter(c => c.status === status);
  }

  const total = (getDb()
    .prepare('SELECT COUNT(*) as n FROM clients')
    .get() as { n: number }).n;

  return NextResponse.json({ clients, total, limit, offset });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phone = body.phone as string;
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 });

  const client = upsertClient({ phone, ...body } as Parameters<typeof upsertClient>[0]);
  return NextResponse.json(client, { status: 201 });
}
