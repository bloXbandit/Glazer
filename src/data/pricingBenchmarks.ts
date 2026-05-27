// ============================================================
// PRICING BENCHMARKS
// RULE: Every entry MUST link to a source_id with source_type
// 'pricing' or 'historical_project'. No other source types
// may populate benchmark price values.
// ============================================================

import type { PricingBenchmark } from '@/types';

export const pricingBenchmarks: PricingBenchmark[] = [
  // ----------------------------------------------------------
  // STOREFRONT - National + DMV Benchmarks
  // Source: RSMeans 2024 + DMV Bid Data 2023
  // ----------------------------------------------------------
  {
    id: 'pb-storefront-national',
    work_type_id: 'storefront',
    region_id: 'national',
    price_low: 45,
    price_mid: 62,
    price_high: 85,
    year: 2024,
    source_id: 'src-rsmeans-2024',
    notes: 'National average, installed, standard aluminum storefront, 1" IGU'
  },
  {
    id: 'pb-storefront-dc',
    work_type_id: 'storefront',
    region_id: 'dc',
    price_low: 58,
    price_mid: 78,
    price_high: 105,
    year: 2023,
    source_id: 'src-cdc-dmv-bid-data-2023',
    notes: 'DC area competitive bid range, prevailing wage included'
  },
  {
    id: 'pb-storefront-nova',
    work_type_id: 'storefront',
    region_id: 'arlington_alexandria',
    price_low: 55,
    price_mid: 72,
    price_high: 98,
    year: 2023,
    source_id: 'src-cdc-dmv-bid-data-2023',
    notes: 'Arlington/Alexandria/Fairfax area competitive bids'
  },

  // ----------------------------------------------------------
  // STICK-BUILT CURTAIN WALL
  // ----------------------------------------------------------
  {
    id: 'pb-stick-cw-national',
    work_type_id: 'stick_curtain_wall',
    region_id: 'national',
    price_low: 85,
    price_mid: 118,
    price_high: 160,
    year: 2024,
    source_id: 'src-rsmeans-2024',
    notes: 'National average, 2"x6" stick-built, thermal break, 1" IGU'
  },
  {
    id: 'pb-stick-cw-dc',
    work_type_id: 'stick_curtain_wall',
    region_id: 'dc',
    price_low: 108,
    price_mid: 148,
    price_high: 195,
    year: 2023,
    source_id: 'src-cdc-dmv-bid-data-2023',
    notes: 'DC market mid-rise office, prevailing wage included'
  },
  {
    id: 'pb-stick-cw-nova',
    work_type_id: 'stick_curtain_wall',
    region_id: 'fairfax',
    price_low: 100,
    price_mid: 138,
    price_high: 182,
    year: 2023,
    source_id: 'src-cdc-dmv-bid-data-2023',
    notes: 'Fairfax/Arlington area competitive range'
  },

  // ----------------------------------------------------------
  // UNITIZED CURTAIN WALL
  // ----------------------------------------------------------
  {
    id: 'pb-unitized-cw-national',
    work_type_id: 'unitized_curtain_wall',
    region_id: 'national',
    price_low: 120,
    price_mid: 165,
    price_high: 225,
    year: 2024,
    source_id: 'src-rsmeans-2024',
    notes: 'National average, factory-assembled panels including glazing and install'
  },
  {
    id: 'pb-unitized-cw-dc',
    work_type_id: 'unitized_curtain_wall',
    region_id: 'dc',
    price_low: 148,
    price_mid: 200,
    price_high: 270,
    year: 2023,
    source_id: 'src-cdc-dmv-bid-data-2023',
    notes: 'DC high-rise tower projects, prevailing wage included'
  },

  // ----------------------------------------------------------
  // WINDOW WALL
  // ----------------------------------------------------------
  {
    id: 'pb-window-wall-national',
    work_type_id: 'window_wall',
    region_id: 'national',
    price_low: 65,
    price_mid: 92,
    price_high: 128,
    year: 2024,
    source_id: 'src-rsmeans-2024',
    notes: 'National average, floor-to-ceiling window wall, slab edge covers, 1" IGU'
  },
  {
    id: 'pb-window-wall-md',
    work_type_id: 'window_wall',
    region_id: 'montgomery_county',
    price_low: 78,
    price_mid: 108,
    price_high: 148,
    year: 2023,
    source_id: 'src-cdc-dmv-bid-data-2023',
    notes: 'Montgomery/PG County multifamily projects'
  },

  // ----------------------------------------------------------
  // INTERIOR GLASS PARTITION
  // ----------------------------------------------------------
  {
    id: 'pb-interior-partition-national',
    work_type_id: 'interior_partition',
    region_id: 'national',
    price_low: 35,
    price_mid: 52,
    price_high: 72,
    year: 2024,
    source_id: 'src-rsmeans-2024',
    notes: 'Standard aluminum-framed interior partition, 1/2" tempered glass'
  },

  // ----------------------------------------------------------
  // GLASS RAILING
  // ----------------------------------------------------------
  {
    id: 'pb-glass-railing-national',
    work_type_id: 'glass_railing',
    region_id: 'national',
    price_low: 92,
    price_mid: 138,
    price_high: 195,
    year: 2024,
    source_id: 'src-rsmeans-2024',
    notes: 'National average, post/channel system with 1/2" tempered or laminated glass'
  },

  // ----------------------------------------------------------
  // SKYLIGHT / OVERHEAD GLAZING
  // ----------------------------------------------------------
  {
    id: 'pb-skylight-national',
    work_type_id: 'skylight',
    region_id: 'national',
    price_low: 108,
    price_mid: 158,
    price_high: 215,
    year: 2024,
    source_id: 'src-rsmeans-2024',
    notes: 'Sloped or flat overhead glazing, framed system, laminated glass minimum'
  },

  // ----------------------------------------------------------
  // FIRE-RATED GLAZING
  // ----------------------------------------------------------
  {
    id: 'pb-fire-rated-national',
    work_type_id: 'fire_rated',
    region_id: 'national',
    price_low: 125,
    price_mid: 185,
    price_high: 255,
    year: 2024,
    source_id: 'src-rsmeans-2024',
    notes: '20-minute to 1-hour rated, UL-listed assembly, includes fire-rated frame'
  },

  // ----------------------------------------------------------
  // BLAST / SECURITY GLAZING
  // ----------------------------------------------------------
  {
    id: 'pb-blast-security-national',
    work_type_id: 'blast_security',
    region_id: 'national',
    price_low: 185,
    price_mid: 278,
    price_high: 395,
    year: 2024,
    source_id: 'src-rsmeans-2024',
    notes: 'GSA/DoD-level blast resistance, includes laminated glass assembly and reinforced framing'
  }
];

/**
 * Get benchmark for a specific work type and region.
 * Falls back to national benchmark if no region-specific data exists.
 */
export const getBenchmark = (
  work_type_id: string,
  region_id: string
): PricingBenchmark | undefined => {
  const regional = pricingBenchmarks.find(
    b => b.work_type_id === work_type_id && b.region_id === region_id
  );
  if (regional) return regional;

  return pricingBenchmarks.find(
    b => b.work_type_id === work_type_id && b.region_id === 'national'
  );
};
