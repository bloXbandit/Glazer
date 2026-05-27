// ============================================================
// CALIBRATION ENGINE
// Blends static RSMeans baseline benchmarks with empirical
// procurement intelligence stored in the DB.
//
// Algorithm:
//   - Weighted mean $/SF per (work_type, region) from saved entries
//   - Confidence weights: awarded=3, historical=3, leveled=2, proposed=1, indicative=0.5
//   - Also weight by total_sf (larger jobs carry more statistical weight)
//   - Requires MIN_ENTRIES before blend activates (prevents single-entry skew)
//   - Blend alpha = min(n / FULL_WEIGHT_AT, 1.0)
//     → 0 entries: 100% static  |  10+ entries: up to 100% empirical
//   - Preserves low/mid/high spread ratio from static baseline
// ============================================================

import type { PricingBenchmark } from '@/types';
import { getBenchmark } from '@/data/pricingBenchmarks';
import { getDb } from '@/lib/db';

const MIN_ENTRIES    = 3;   // entries required before any blending
const FULL_WEIGHT_AT = 10;  // entries for full empirical weight

const CONFIDENCE_WEIGHTS: Record<string, number> = {
  awarded:    3.0,
  historical: 3.0,
  leveled:    2.0,
  proposed:   1.0,
  indicative: 0.5,
};

interface ProcurementIntelRow {
  price_per_sf: number;
  total_sf: number | null;
  price_confidence: string;
}

export interface CalibrationResult {
  benchmark: PricingBenchmark;
  calibrated: boolean;
  entry_count: number;
  alpha: number;
  empirical_mid: number | null;
}

export function getCalibratedBenchmark(
  work_type_id: string,
  region_id: string
): CalibrationResult {
  const staticBenchmark = getBenchmark(work_type_id, region_id);

  if (!staticBenchmark) {
    throw new Error(`No static benchmark found for ${work_type_id} / ${region_id}`);
  }

  let rows: ProcurementIntelRow[] = [];

  try {
    const db = getDb();
    rows = db.prepare(`
      SELECT price_per_sf, total_sf, price_confidence
      FROM procurement_intel
      WHERE work_type_id = ?
        AND (region_id = ? OR region_id = 'national')
        AND price_per_sf > 0
      ORDER BY created_at DESC
      LIMIT 50
    `).all(work_type_id, region_id) as ProcurementIntelRow[];
  } catch {
    return { benchmark: staticBenchmark, calibrated: false, entry_count: 0, alpha: 0, empirical_mid: null };
  }

  if (rows.length < MIN_ENTRIES) {
    return { benchmark: staticBenchmark, calibrated: false, entry_count: rows.length, alpha: 0, empirical_mid: null };
  }

  // Weighted mean — weight by confidence tier × square footage
  let weightedSum = 0;
  let totalWeight = 0;

  for (const row of rows) {
    const confWeight = CONFIDENCE_WEIGHTS[row.price_confidence] ?? 1.0;
    const sfWeight   = row.total_sf ? Math.log1p(row.total_sf) : 1.0; // log-scale SF so huge jobs don't dominate
    const w = confWeight * sfWeight;
    weightedSum += row.price_per_sf * w;
    totalWeight += w;
  }

  const empiricalMid = weightedSum / totalWeight;
  const alpha = Math.min(rows.length / FULL_WEIGHT_AT, 1.0);

  // Preserve the spread ratio from static baseline
  const staticMid   = staticBenchmark.price_mid;
  const lowRatio    = staticBenchmark.price_low  / staticMid;
  const highRatio   = staticBenchmark.price_high / staticMid;

  const empiricalLow  = empiricalMid * lowRatio;
  const empiricalHigh = empiricalMid * highRatio;

  // Blend
  const blendedMid  = alpha * empiricalMid  + (1 - alpha) * staticMid;
  const blendedLow  = alpha * empiricalLow  + (1 - alpha) * staticBenchmark.price_low;
  const blendedHigh = alpha * empiricalHigh + (1 - alpha) * staticBenchmark.price_high;

  const calibrated: PricingBenchmark = {
    ...staticBenchmark,
    price_low:  Math.round(blendedLow),
    price_mid:  Math.round(blendedMid),
    price_high: Math.round(blendedHigh),
    notes: `${staticBenchmark.notes ?? ''} [Calibrated: ${rows.length} empirical entries, α=${alpha.toFixed(2)}]`.trim(),
  };

  return {
    benchmark:    calibrated,
    calibrated:   true,
    entry_count:  rows.length,
    alpha,
    empirical_mid: empiricalMid,
  };
}

const LOCATION_REGION_MAP: Array<{ keywords: string[]; region_id: string }> = [
  { keywords: ['washington, d.c', 'washington dc', ' dc ', 'district of columbia'], region_id: 'dc' },
  { keywords: ['montgomery', 'silver spring', 'bethesda', 'rockville', 'gaithersburg'], region_id: 'montgomery-county' },
  { keywords: ["prince george", "pg county", "hyattsville", "college park", "bowie"], region_id: 'prince-georges-county' },
  { keywords: ['baltimore'], region_id: 'baltimore' },
  { keywords: ['fairfax', 'reston', 'herndon', 'mclean', 'vienna', 'tyson'], region_id: 'fairfax-county' },
  { keywords: ['arlington', 'alexandria', 'crystal city', 'pentagon city'], region_id: 'arlington-alexandria' },
  { keywords: ['loudoun', 'sterling', 'ashburn', 'leesburg', 'prince william', 'manassas'], region_id: 'loudoun-prince-william' },
  { keywords: ['maryland', ' md '], region_id: 'montgomery-county' },
  { keywords: ['virginia', ' va '], region_id: 'fairfax-county' },
];

export function inferRegionId(location: string): string {
  if (!location) return 'national';
  const lower = ` ${location.toLowerCase()} `;
  for (const entry of LOCATION_REGION_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.region_id;
  }
  return 'national';
}

export function saveIntelEntry(params: {
  work_type_id: string;
  region_id: string;
  price_per_sf: number;
  total_sf?: number;
  total_price?: number;
  price_confidence: string;
  document_type?: string;
  subcontractor?: string;
  project_name?: string;
  project_location?: string;
  bid_date?: string;
  parse_confidence?: string;
  raw_snippet?: string;
}): string {
  const db  = getDb();
  const now = new Date().toISOString();
  const rand = Math.random().toString(36).slice(2, 8);
  const id = `pi_${Date.now().toString(36)}${rand}`;

  db.prepare(`
    INSERT INTO procurement_intel
      (id, work_type_id, region_id, price_per_sf, total_sf, total_price,
       price_confidence, document_type, subcontractor, project_name,
       project_location, bid_date, parse_confidence, raw_snippet, created_at)
    VALUES
      (@id, @work_type_id, @region_id, @price_per_sf, @total_sf, @total_price,
       @price_confidence, @document_type, @subcontractor, @project_name,
       @project_location, @bid_date, @parse_confidence, @raw_snippet, @created_at)
  `).run({
    id,
    work_type_id:     params.work_type_id,
    region_id:        params.region_id ?? 'national',
    price_per_sf:     params.price_per_sf,
    total_sf:         params.total_sf         ?? null,
    total_price:      params.total_price      ?? null,
    price_confidence: params.price_confidence ?? 'proposed',
    document_type:    params.document_type    ?? null,
    subcontractor:    params.subcontractor    ?? null,
    project_name:     params.project_name     ?? null,
    project_location: params.project_location ?? null,
    bid_date:         params.bid_date         ?? null,
    parse_confidence: params.parse_confidence ?? null,
    raw_snippet:      params.raw_snippet      ?? null,
    created_at:       now,
  });

  return id;
}
