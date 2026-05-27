// ============================================================
// GET /api/benchmarks?work_type_id=storefront&region_id=dc
// Returns calibrated benchmark blending static baseline with
// empirical procurement intelligence from the DB.
// Falls back gracefully to static if DB is unavailable or
// insufficient entries exist.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCalibratedBenchmark } from '@/lib/calibrationEngine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const work_type_id = searchParams.get('work_type_id');
  const region_id    = searchParams.get('region_id') ?? 'national';

  if (!work_type_id) {
    return NextResponse.json({ error: 'work_type_id is required.' }, { status: 400 });
  }

  try {
    const result = getCalibratedBenchmark(work_type_id, region_id);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
