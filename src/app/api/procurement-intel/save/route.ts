// ============================================================
// POST /api/procurement-intel/save
// Persists a parsed ScopeIntelligence entry to the DB.
// Extracts one row per glazing_system detected in the doc.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { ScopeIntelligence } from '@/types';
import { saveIntelEntry, inferRegionId } from '@/lib/calibrationEngine';
import { getDb } from '@/lib/db';

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

  // Scope-only docs (no total price) still belong in the Library — they hold
  // inclusions/exclusions/lead times worth keeping. They save with
  // price_per_sf = 0, which the calibration query (price_per_sf > 0) ignores,
  // so they never skew benchmarks.
  const pricePerSf = hasPriceData ? body.total_price_proposed! / body.total_sf_proposed! : 0;
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

  // Store the complete parsed entry once (on the first row) so the
  // Library can re-render it after reload; flattened rows feed calibration.
  if (savedIds.length > 0) {
    try {
      getDb()
        .prepare('UPDATE procurement_intel SET full_json = ? WHERE id = ?')
        .run(JSON.stringify(body), savedIds[0]);
    } catch (err) {
      console.error('[procurement-intel/save] full_json store failed:', err);
    }
  }

  return NextResponse.json({
    saved: savedIds.length,
    ids: savedIds,
    region_id: regionId,
    calibrates: hasPriceData,
    price_per_sf: Math.round(pricePerSf * 100) / 100,
    work_types: body.glazing_systems,
  });
}
