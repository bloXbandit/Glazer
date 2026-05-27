// ============================================================
// LIVE DATA API ROUTE — BLS PPI + SAM.gov calibration
// Fetches current material escalation and wage data from
// free public APIs. Applied as multipliers on RSMeans baseline.
// Called client-side on estimate completion; result cached 24h.
// ============================================================

import { NextResponse } from 'next/server';
import type { LiveDataFactor, LiveDataCache } from '@/types';

const CACHE_TTL_HOURS = 24;

// ── BLS PPI series for construction materials ──────────────────
// PCU327213327213 = Flat glass manufacturing
// PCU3323993323990 = Architectural & structural metals
const BLS_SERIES = ['PCU327213327213', 'PCU3323993323990'];
const BLS_BASE_YEAR = 2024; // RSMeans 2024 is our pricing baseline

async function fetchBLSPPI(): Promise<LiveDataFactor[]> {
  const payload = {
    seriesid: BLS_SERIES,
    startyear: String(BLS_BASE_YEAR),
    endyear: String(new Date().getFullYear()),
    registrationkey: process.env.BLS_API_KEY ?? '', // optional — increases rate limit
  };

  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`BLS API error: ${res.status}`);
  const data = await res.json();

  if (data.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS API returned status: ${data.status}`);
  }

  const factors: LiveDataFactor[] = [];
  const now = new Date().toISOString();

  for (const series of data.Results?.series ?? []) {
    if (!series.data?.length) continue;

    // Get most recent data point and the base year annual average
    const sorted = [...series.data].sort((a: { year: string; period: string }, b: { year: string; period: string }) =>
      `${b.year}${b.period}`.localeCompare(`${a.year}${a.period}`)
    );
    const latest = sorted[0];

    // Find base year annual avg (period = M13 or average of monthly)
    const baseYearData = series.data.filter((d: { year: string }) => d.year === String(BLS_BASE_YEAR));
    if (!baseYearData.length) continue;
    const baseAvg = baseYearData.reduce((sum: number, d: { value: string }) => sum + parseFloat(d.value), 0) / baseYearData.length;
    const latestVal = parseFloat(latest.value);

    if (!baseAvg || !latestVal) continue;

    const escalation = latestVal / baseAvg; // 1.0 = no change from 2024 baseline

    const isGlass = series.seriesID === 'PCU327213327213';
    factors.push({
      id: `bls-${series.seriesID}`,
      source: 'bls_ppi',
      label: isGlass ? 'Glass Manufacturing PPI' : 'Architectural Metals PPI',
      description: isGlass
        ? 'BLS Producer Price Index for flat glass manufacturing vs. 2024 baseline'
        : 'BLS Producer Price Index for architectural & structural metals vs. 2024 baseline',
      factor_type: 'material_escalation',
      applies_to: isGlass
        ? ['storefront', 'stick_curtain_wall', 'unitized_curtain_wall', 'window_wall', 'fire_rated', 'blast_security']
        : ['storefront', 'stick_curtain_wall', 'unitized_curtain_wall', 'window_wall', 'glass_railing', 'skylight'],
      value: escalation,
      base_year: BLS_BASE_YEAR,
      as_of_date: `${latest.year}-${latest.period.replace('M', '').padStart(2, '0')}-01`,
      series_id: series.seriesID,
      raw_value: latestVal,
      fetched_at: now,
    });
  }

  return factors;
}

// ── SAM.gov Wage Determinations ────────────────────────────────
// Davis-Bacon glazier rates for DC/MD/VA jurisdictions
// WD numbers for glaziers in DC metro area

const DC_WAGE_DET_NUMBERS = ['DC20240001', 'MD20240031', 'VA20240014'];

async function fetchSAMGovWages(): Promise<LiveDataFactor[]> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) return []; // SAM.gov requires a key for WD details

  const factors: LiveDataFactor[] = [];
  const now = new Date().toISOString();

  for (const wdNumber of DC_WAGE_DET_NUMBERS) {
    try {
      const url = `https://api.sam.gov/wages/v3/wdDetails?wdNumber=${wdNumber}&api_key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;

      const data = await res.json();
      const glazierEntry = data?.wages?.find((w: { occupation: string }) =>
        w.occupation?.toLowerCase().includes('glazier')
      );
      if (!glazierEntry) continue;

      const regionMap: Record<string, string> = {
        DC20240001: 'dc',
        MD20240031: 'maryland',
        VA20240014: 'nova',
      };
      const regionLabel: Record<string, string> = {
        DC20240001: 'Washington D.C.',
        MD20240031: 'Maryland',
        VA20240014: 'Northern Virginia',
      };

      factors.push({
        id: `sam-wd-${wdNumber}`,
        source: 'sam_gov_wd',
        label: `Davis-Bacon Glazier Rate — ${regionLabel[wdNumber]}`,
        description: `Current WD glazier base rate from SAM.gov Wage Determination ${wdNumber}`,
        factor_type: 'wage_rate',
        applies_to: ['all'],
        applies_to_region: regionMap[wdNumber],
        value: parseFloat(glazierEntry.basicRate ?? glazierEntry.rate ?? 0),
        base_year: new Date().getFullYear(),
        as_of_date: data?.wdEffectiveDate ?? new Date().toISOString().split('T')[0],
        series_id: wdNumber,
        raw_value: parseFloat(glazierEntry.basicRate ?? glazierEntry.rate ?? 0),
        fetched_at: now,
      });
    } catch {
      // Skip individual WD failures silently
    }
  }

  return factors;
}

// ── Response builder ──────────────────────────────────────────

export async function GET() {
  const results: LiveDataFactor[] = [];
  const errors: string[] = [];

  // Attempt BLS PPI fetch
  try {
    const ppiFactors = await fetchBLSPPI();
    results.push(...ppiFactors);
  } catch (e) {
    errors.push(`BLS PPI: ${e instanceof Error ? e.message : 'fetch failed'}`);
  }

  // Attempt SAM.gov fetch (only if key is set)
  if (process.env.SAM_GOV_API_KEY) {
    try {
      const wageFactors = await fetchSAMGovWages();
      results.push(...wageFactors);
    } catch (e) {
      errors.push(`SAM.gov WD: ${e instanceof Error ? e.message : 'fetch failed'}`);
    }
  }

  const cache: LiveDataCache = {
    last_fetched: new Date().toISOString(),
    factors: results,
    status: results.length > 0 ? 'fresh' : errors.length > 0 ? 'error' : 'unavailable',
    error_message: errors.length > 0 ? errors.join('; ') : undefined,
  };

  return NextResponse.json(cache, {
    headers: {
      'Cache-Control': `s-maxage=${CACHE_TTL_HOURS * 3600}, stale-while-revalidate`,
    },
  });
}
