// ============================================================
// GET /api/procurement-intel — saved Library entries
// Returns the full parsed ScopeIntelligence entries persisted by
// /api/procurement-intel/save, newest first, so the Library
// survives page reloads.
// ============================================================

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { ScopeIntelligence } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = getDb()
      .prepare(`
        SELECT full_json FROM procurement_intel
        WHERE full_json IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 200
      `)
      .all() as { full_json: string }[];

    const entries: ScopeIntelligence[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      try {
        const entry = JSON.parse(row.full_json) as ScopeIntelligence;
        if (entry?.id && !seen.has(entry.id)) {
          seen.add(entry.id);
          entries.push(entry);
        }
      } catch { /* skip malformed rows */ }
    }

    return NextResponse.json({ entries }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[procurement-intel] list failed:', err);
    return NextResponse.json({ entries: [] });
  }
}
