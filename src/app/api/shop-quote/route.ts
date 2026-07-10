// ============================================================
// SHOP QUOTE API — POST /api/shop-quote (save) · GET (fetch)
// The server is the pricing authority: it recomputes the quote
// deterministically from the raw inputs via runShopQuote().
// Client-side totals are never trusted or stored.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runShopQuote } from '@/lib/shopQuote';
import type { ShopQuoteInput } from '@/lib/shopQuote';
import {
  saveShopQuote, getShopQuote, listRecentShopQuotes,
  upsertClient, getClient,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

interface SaveBody {
  input: ShopQuoteInput;
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
  if (!body.input?.glass_type_id || !(body.input.width_in > 0) || !(body.input.height_in > 0)) {
    return NextResponse.json({ error: 'input requires glass_type_id, width_in, height_in' }, { status: 400 });
  }

  // Deterministic recompute — the backend owns the number
  let result;
  try {
    result = runShopQuote(body.input);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Pricing failed' }, { status: 400 });
  }

  // Attach to CRM by phone (find-or-create), same identity key the
  // voice/SMS intake uses — walk-ins and leads share one record.
  let clientId: string | null = null;
  const phone = body.customer_phone?.trim();
  if (phone) {
    const client = upsertClient({
      phone,
      ...(body.customer_name?.trim() ? { name: body.customer_name.trim() } : {}),
      contact_type: 'walk_in',
      source: 'shop',
    });
    clientId = client.id;
    // Move the pipeline forward, but never downgrade a won/lost client
    if (client.status === 'new' || client.status === 'contacted') {
      upsertClient({ phone, status: 'quoted' });
    }
  }

  const row = saveShopQuote({
    client_id: clientId,
    glass_name: result.glass_name,
    input_json: JSON.stringify(body.input),
    result_json: JSON.stringify(result),
    total: result.total,
  });

  return NextResponse.json({ ok: true, id: row.id, client_id: clientId, quote: result });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const row = getShopQuote(id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const client = row.client_id ? getClient(row.client_id) ?? null : null;
    return NextResponse.json({
      id: row.id,
      created_at: row.created_at,
      glass_name: row.glass_name,
      input: JSON.parse(row.input_json),
      result: JSON.parse(row.result_json),
      client: client ? { id: client.id, name: client.name, phone: client.phone } : null,
    });
  }

  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get('recent') ?? '10', 10) || 10);
  const rows = listRecentShopQuotes(limit);
  return NextResponse.json({
    quotes: rows.map(r => ({
      id: r.id,
      created_at: r.created_at,
      glass_name: r.glass_name,
      total: r.total,
      client_id: r.client_id,
    })),
  });
}
