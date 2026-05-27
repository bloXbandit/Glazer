// ============================================================
// POST /api/procurement-intel/save
// Persists a parsed ScopeIntelligence entry to the DB.
// Extracts one row per glazing_system detected in the doc.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { ScopeIntelligence } from '@/types';
import { saveIntelEntry, inferRegionId } from '@/lib/calibrationEngine';

export async function POST(req: NextRequest) {
  let body: ScopeIntelligence;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body || !body.glazing_systems?.length) {
    return NextResponse.json({ error: 'No glazing systems detected in entry.' }, { status: 400 });
  }

  const hasPriceData =
    body.total_price_proposed != null && body.total_sf_proposed != null && body.total_sf_proposed > 0;

  if (!hasPriceData) {
    return NextResponse.json({ error: 'Entry has no usable price_per_sf (missing total_price or total_sf).' }, { status: 422 });
  }

  const pricePerSf = body.total_price_proposed! / body.total_sf_proposed!;
  const regionId   = inferRegionId(body.project_location ?? '');

  const savedIds: string[] = [];

  for (const workTypeId of body.glazing_systems) {
    const id = saveIntelEntry({
      work_type_id:     workTypeId,
      region_id:        regionId,
      price_per_sf:     pricePerSf,
      total_sf:         body.total_sf_proposed,
      total_price:      body.total_price_proposed,
      price_confidence: body.price_confidence,
      document_type:    body.document_type,
      subcontractor:    body.subcontractor_name,
      project_name:     body.project_name,
      project_location: body.project_location,
      bid_date:         body.bid_date,
      parse_confidence: body.parse_confidence,
      raw_snippet:      body.raw_text_snippet,
    });
    savedIds.push(id);
  }

  return NextResponse.json({
    saved: savedIds.length,
    ids: savedIds,
    region_id: regionId,
    price_per_sf: Math.round(pricePerSf * 100) / 100,
    work_types: body.glazing_systems,
  });
}
