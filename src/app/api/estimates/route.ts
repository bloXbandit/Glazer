// ============================================================
// ESTIMATE ARCHIVE — POST /api/estimates (save what went out)
// Stores the estimate input + full packet verbatim: this is an
// archival record of the document actually sent to the customer,
// not a live price (shop quotes recompute; archives don't).
// GET ?id=… returns one; GET ?client_id=… lists summaries.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { saveEstimate, getEstimate, listEstimatesByClient, upsertClient } from '@/lib/db';
import type { EstimateInput, EstimatePacket } from '@/types';

export const dynamic = 'force-dynamic';

interface SaveBody {
  input: EstimateInput;
  packet: EstimatePacket;
  customer_name?: string;
  customer_phone?: string;
}

export async function POST(req: NextRequest) {
  let body: SaveBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { input, packet } = body;
  if (!input?.work_type_id || !packet?.result?.grand_total) {
    return NextResponse.json({ error: 'input and packet required' }, { status: 400 });
  }

  // Attach to CRM by phone — same identity key as intake and shop quotes
  let clientId: string | null = null;
  const phone = body.customer_phone?.trim();
  if (phone) {
    const client = upsertClient({
      phone,
      ...(body.customer_name?.trim() ? { name: body.customer_name.trim() } : {}),
    });
    clientId = client.id;
    if (client.status === 'new' || client.status === 'contacted') {
      upsertClient({ phone, status: 'quoted' });
    }
  }

  const row = saveEstimate({
    client_id: clientId,
    work_type: packet.work_type_name ?? input.work_type_id,
    region: packet.region_name ?? input.region_id,
    total_sf: input.total_sf,
    grand_total: packet.result.grand_total,
    input_json: JSON.stringify(input),
    packet_json: JSON.stringify(packet),
  });

  return NextResponse.json({ ok: true, id: row.id, client_id: clientId });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const row = getEstimate(id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      id: row.id,
      client_id: row.client_id,
      status: row.status,
      created_at: row.created_at,
      input: JSON.parse(row.input_json),
      packet: JSON.parse(row.packet_json),
    });
  }

  const clientId = req.nextUrl.searchParams.get('client_id');
  if (!clientId) return NextResponse.json({ error: 'client_id or id required' }, { status: 400 });
  return NextResponse.json({ estimates: listEstimatesByClient(clientId) });
}
