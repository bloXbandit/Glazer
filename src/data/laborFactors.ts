// ============================================================
// LABOR FACTORS - Rates and Productivity
// All rate values sourced from pricing-authority sources only.
// Productivity hours per SF sourced from GANA and RSMeans.
// ============================================================

import type { LaborRate, LaborProductivity } from '@/types';

export const laborRates: LaborRate[] = [
  {
    id: 'lr-dc-glazier',
    region_id: 'dc',
    trade: 'Glazier',
    base_rate_per_hour: 72,
    davis_bacon_rate: 98,
    maryland_pw_rate: undefined,
    virginia_pw_rate: undefined,
    benefits_burden: 1.42,
    source_id: 'src-rsmeans-2024',
    effective_date: '2024-01-01'
  },
  {
    id: 'lr-montgomery-glazier',
    region_id: 'montgomery_county',
    trade: 'Glazier',
    base_rate_per_hour: 68,
    davis_bacon_rate: 92,
    maryland_pw_rate: 88,
    virginia_pw_rate: undefined,
    benefits_burden: 1.40,
    source_id: 'src-rsmeans-2024',
    effective_date: '2024-01-01'
  },
  {
    id: 'lr-pg-county-glazier',
    region_id: 'prince_georges',
    trade: 'Glazier',
    base_rate_per_hour: 64,
    davis_bacon_rate: 88,
    maryland_pw_rate: 82,
    virginia_pw_rate: undefined,
    benefits_burden: 1.38,
    source_id: 'src-rsmeans-2024',
    effective_date: '2024-01-01'
  },
  {
    id: 'lr-baltimore-glazier',
    region_id: 'baltimore',
    trade: 'Glazier',
    base_rate_per_hour: 62,
    davis_bacon_rate: 86,
    maryland_pw_rate: 80,
    virginia_pw_rate: undefined,
    benefits_burden: 1.38,
    source_id: 'src-rsmeans-2024',
    effective_date: '2024-01-01'
  },
  {
    id: 'lr-fairfax-glazier',
    region_id: 'fairfax',
    trade: 'Glazier',
    base_rate_per_hour: 68,
    davis_bacon_rate: 94,
    maryland_pw_rate: undefined,
    virginia_pw_rate: 85,
    benefits_burden: 1.40,
    source_id: 'src-rsmeans-2024',
    effective_date: '2024-01-01'
  },
  {
    id: 'lr-arlington-glazier',
    region_id: 'arlington_alexandria',
    trade: 'Glazier',
    base_rate_per_hour: 72,
    davis_bacon_rate: 98,
    maryland_pw_rate: undefined,
    virginia_pw_rate: 88,
    benefits_burden: 1.42,
    source_id: 'src-rsmeans-2024',
    effective_date: '2024-01-01'
  },
  {
    id: 'lr-loudoun-glazier',
    region_id: 'loudoun_pw',
    trade: 'Glazier',
    base_rate_per_hour: 62,
    davis_bacon_rate: 88,
    maryland_pw_rate: undefined,
    virginia_pw_rate: 80,
    benefits_burden: 1.36,
    source_id: 'src-rsmeans-2024',
    effective_date: '2024-01-01'
  }
];

export const laborProductivity: LaborProductivity[] = [
  {
    id: 'lp-storefront',
    work_type_id: 'storefront',
    hours_per_sf: 0.14,
    source_id: 'src-rsmeans-2024',
    notes: 'Ground-level, new construction baseline. Includes setting, glazing, sealant.'
  },
  {
    id: 'lp-stick-cw',
    work_type_id: 'stick_curtain_wall',
    hours_per_sf: 0.38,
    source_id: 'src-gana-2023',
    notes: 'Field assembly including anchor, framing, glass, seals, and interior trim.'
  },
  {
    id: 'lp-unitized-cw',
    work_type_id: 'unitized_curtain_wall',
    hours_per_sf: 0.24,
    source_id: 'src-rsmeans-2024',
    notes: 'Panel hang and seal only — fabrication labor not included (factory). Assumes crane assist.'
  },
  {
    id: 'lp-window-wall',
    work_type_id: 'window_wall',
    hours_per_sf: 0.20,
    source_id: 'src-rsmeans-2024',
    notes: 'Floor-to-floor panel set and seal. Does not include slab edge work.'
  },
  {
    id: 'lp-interior-partition',
    work_type_id: 'interior_partition',
    hours_per_sf: 0.12,
    source_id: 'src-rsmeans-2024',
    notes: 'Track, framing, glass set, and hardware. Finished, interior conditions.'
  },
  {
    id: 'lp-glass-railing',
    work_type_id: 'glass_railing',
    hours_per_sf: 0.45,
    source_id: 'src-rsmeans-2024',
    notes: 'Post/channel installation, glass setting, fasteners, cap rail. High handling effort per SF.'
  },
  {
    id: 'lp-skylight',
    work_type_id: 'skylight',
    hours_per_sf: 0.52,
    source_id: 'src-rsmeans-2024',
    notes: 'Overhead work, sealing, drainage integration, and safety provisions included.'
  },
  {
    id: 'lp-fire-rated',
    work_type_id: 'fire_rated',
    hours_per_sf: 0.55,
    source_id: 'src-rsmeans-2024',
    notes: 'Fire-rated assemblies require precise installation per UL listing — extra labor for compliance.'
  },
  {
    id: 'lp-blast-security',
    work_type_id: 'blast_security',
    hours_per_sf: 0.70,
    source_id: 'src-rsmeans-2024',
    notes: 'High-complexity framing, heavy glass, special anchorage. Specialized crew required.'
  }
];

export const getLaborRateForRegion = (region_id: string): LaborRate | undefined =>
  laborRates.find(r => r.region_id === region_id);

export const getLaborProductivityForWorkType = (work_type_id: string): LaborProductivity | undefined =>
  laborProductivity.find(lp => lp.work_type_id === work_type_id);
