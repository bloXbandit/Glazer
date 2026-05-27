// ============================================================
// MANUFACTURER SYSTEMS
// Source: manufacturer_product sources ONLY.
// cost_authority = false on all entries.
// These inform scope, procurement, and user guidance ONLY.
// ============================================================

import type { ManufacturerSystem } from '@/types';

export const manufacturerSystems: ManufacturerSystem[] = [
  // ----------------------------------------------------------
  // KAWNEER
  // ----------------------------------------------------------
  {
    id: 'mfr-kawneer-350-sf',
    manufacturer: 'Kawneer',
    product_line: '350 Storefront',
    system_type: 'Storefront',
    work_type_id: 'storefront',
    typical_use: 'Standard commercial storefront, retail, office entry',
    performance_specs: ['1-3/4" x 4-1/2" framing', 'Thermally broken', 'Accepts 1" IGU', 'AAMA 410 certified'],
    approximate_cost_tier: 'Mid',
    lead_time_weeks: { min: 4, max: 6 },
    source_id: 'src-kawneer-2024',
    notes: 'Industry workhorse. Most commonly specified storefront in DMV commercial market.'
  },
  {
    id: 'mfr-kawneer-1600-cw',
    manufacturer: 'Kawneer',
    product_line: '1600 Wall System',
    system_type: 'Stick-Built Curtain Wall',
    work_type_id: 'stick_curtain_wall',
    typical_use: 'Mid-rise and high-rise commercial office, institutional',
    performance_specs: ['2" x 6" framing', '2" sightlines', 'Thermally broken', 'Max 600 PSF wind load', 'Accepts up to 1-3/4" glass'],
    approximate_cost_tier: 'Mid',
    lead_time_weeks: { min: 10, max: 14 },
    source_id: 'src-kawneer-2024',
    notes: 'Widely specified in DMV federal and commercial projects. Well-supported by local glaziers.'
  },
  {
    id: 'mfr-kawneer-unitwall',
    manufacturer: 'Kawneer',
    product_line: 'UnitWall System',
    system_type: 'Unitized Curtain Wall',
    work_type_id: 'unitized_curtain_wall',
    typical_use: 'High-rise towers, fast-track large commercial',
    performance_specs: ['Factory-assembled panels', '2" sightlines', 'Full thermal break', 'Floor-to-floor module'],
    approximate_cost_tier: 'Premium',
    lead_time_weeks: { min: 14, max: 20 },
    source_id: 'src-kawneer-2024',
    notes: 'Factory-assembled — requires strict shop drawing approval before fabrication begins.'
  },

  // ----------------------------------------------------------
  // YKK AP
  // ----------------------------------------------------------
  {
    id: 'mfr-ykk-ysg-sf',
    manufacturer: 'YKK AP',
    product_line: 'YSG Storefront',
    system_type: 'Storefront',
    work_type_id: 'storefront',
    typical_use: 'Commercial entry, retail, ground-floor office',
    performance_specs: ['1-3/4" x 4-1/2" profile', 'Thermally improved', 'AAMA 410 compliant'],
    approximate_cost_tier: 'Mid',
    lead_time_weeks: { min: 3, max: 6 },
    source_id: 'src-ykk-ap-2024',
    notes: 'Competitive alternative to Kawneer. Good dealer network in DMV.'
  },
  {
    id: 'mfr-ykk-501t-cw',
    manufacturer: 'YKK AP',
    product_line: '501T Stick Curtain Wall',
    system_type: 'Stick-Built Curtain Wall',
    work_type_id: 'stick_curtain_wall',
    typical_use: 'Mid-rise commercial, institutional, mixed-use',
    performance_specs: ['2" x 6" framing', 'Thermally broken', 'Accepts 1" to 1-3/4" IGU', '2" sightlines'],
    approximate_cost_tier: 'Mid',
    lead_time_weeks: { min: 10, max: 14 },
    source_id: 'src-ykk-ap-2024',
    notes: 'Popular in mid-Atlantic market. Competitive pricing vs Kawneer.'
  },

  // ----------------------------------------------------------
  // OLDCASTLE BUILDINGENVELOPE
  // ----------------------------------------------------------
  {
    id: 'mfr-oldcastle-c13500-sf',
    manufacturer: 'Oldcastle BuildingEnvelope',
    product_line: 'C13500 Storefront',
    system_type: 'Storefront',
    work_type_id: 'storefront',
    typical_use: 'Commercial storefront, medium-traffic entry',
    performance_specs: ['1-3/4" x 4-1/2" framing', 'Thermally broken', 'Accepts 1" IGU'],
    approximate_cost_tier: 'Budget',
    lead_time_weeks: { min: 3, max: 5 },
    source_id: 'src-kawneer-2024',
    notes: 'Value option. Strong local distribution. Commonly used in budget commercial projects.'
  },

  // ----------------------------------------------------------
  // TUBELITE
  // ----------------------------------------------------------
  {
    id: 'mfr-tubelite-e4500-sf',
    manufacturer: 'Tubelite',
    product_line: 'E4500 Storefront',
    system_type: 'Storefront',
    work_type_id: 'storefront',
    typical_use: 'Standard retail, office, healthcare entry',
    performance_specs: ['1-3/4" x 4-1/2" thermal break', 'AAMA 410 compliant', 'Wide hardware compatibility'],
    approximate_cost_tier: 'Mid',
    lead_time_weeks: { min: 3, max: 5 },
    source_id: 'src-kawneer-2024',
    notes: 'Reliable second-tier option. Commonly specified in hospital and educational projects.'
  },

  // ----------------------------------------------------------
  // VETROTECH / PILKINGTON (fire-rated)
  // ----------------------------------------------------------
  {
    id: 'mfr-vetrotech-pyrobel',
    manufacturer: 'Vetrotech Saint-Gobain',
    product_line: 'Pyrobel Fire-Rated Glass',
    system_type: 'Fire-Rated Glazing',
    work_type_id: 'fire_rated',
    typical_use: 'Fire barriers, stair enclosures, 20-min to 3-hr rated assemblies',
    performance_specs: ['UL 9, UL 10C, NFPA 257 listed', '20-min, 45-min, 60-min, 90-min, 3-hr ratings', 'Transparent fire protection'],
    approximate_cost_tier: 'Premium',
    lead_time_weeks: { min: 8, max: 14 },
    source_id: 'src-kawneer-2024',
    notes: 'Must be specified by UL design number. Frame and glass are a listed assembly — no mixing manufacturers.'
  },

  // ----------------------------------------------------------
  // DLUBAK / GUARDIAN (blast/security)
  // ----------------------------------------------------------
  {
    id: 'mfr-guardian-blast',
    manufacturer: 'Guardian Glass',
    product_line: 'SunGuard Blast-Resistant',
    system_type: 'Blast / Security Glazing',
    work_type_id: 'blast_security',
    typical_use: 'Federal facilities, embassies, courthouses, data centers',
    performance_specs: ['Laminated with SGP interlayer', 'GSA threat level ratings', 'UFC 4-010-01 compliant options', 'Paired with engineered framing'],
    approximate_cost_tier: 'Custom',
    lead_time_weeks: { min: 16, max: 24 },
    source_id: 'src-kawneer-2024',
    notes: 'Threat level must be specified by security consultant. Long-lead custom fabrication.'
  }
];

export const getManufacturerSystemsByWorkType = (work_type_id: string): ManufacturerSystem[] =>
  manufacturerSystems.filter(m => m.work_type_id === work_type_id);
