// ============================================================
// PROCUREMENT ITEMS
// Scope-referenced items that appear in estimate breakdowns.
// cost_authority = false means these inform scope/risk ONLY.
// Only RSMeans-sourced items have estimated_cost_per_sf set.
// ============================================================

import type { ProcurementItem } from '@/types';

export const procurementItems: ProcurementItem[] = [
  // ----------------------------------------------------------
  // SUBMITTALS & ENGINEERING (universal)
  // ----------------------------------------------------------
  {
    id: 'proc-delegated-design',
    name: 'Delegated Design Engineering',
    description: 'Structural engineering for system anchorage, wind load, and thermal analysis',
    category: 'submittal',
    applicable_work_types: ['stick_curtain_wall', 'unitized_curtain_wall', 'skylight', 'glass_railing', 'blast_security'],
    estimated_cost_per_sf: 2.50,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'Engineering required before fabrication; delays can push lead time significantly'
  },
  {
    id: 'proc-shop-drawings',
    name: 'Shop Drawings & Submittals',
    description: 'Preparation and processing of shop drawings, product data, and samples',
    category: 'submittal',
    applicable_work_types: [],
    estimated_cost_per_sf: 1.50,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'Architect review cycles can delay procurement — allow 3-4 weeks minimum'
  },
  {
    id: 'proc-mock-up',
    name: 'Mock-Up Panel',
    description: 'Full-scale field mock-up of glazing system for architect/owner review',
    category: 'submittal',
    applicable_work_types: ['stick_curtain_wall', 'unitized_curtain_wall', 'window_wall'],
    estimated_cost_fixed: 8500,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'May be required by spec. Mock-up approval required before bulk fabrication.'
  },

  // ----------------------------------------------------------
  // TESTING & INSPECTION
  // ----------------------------------------------------------
  {
    id: 'proc-air-water-testing',
    name: 'Air & Water Infiltration Testing (AAMA 501)',
    description: 'Third-party testing per AAMA 501.1 or 501.2 — air, water, and structural',
    category: 'testing',
    applicable_work_types: ['stick_curtain_wall', 'unitized_curtain_wall', 'window_wall'],
    estimated_cost_fixed: 6500,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024', 'src-csi-div08-2024'],
    risk_note: 'Field testing failure requires repair and retest — schedule buffer critical'
  },
  {
    id: 'proc-ul-fire-inspection',
    name: 'UL Listed Assembly Inspection',
    description: 'Third-party inspection verifying fire-rated assembly compliance',
    category: 'testing',
    applicable_work_types: ['fire_rated'],
    estimated_cost_fixed: 3500,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024', 'src-ibc-2021'],
    risk_note: 'Non-compliant installation requires full replacement — no field modification allowed'
  },
  {
    id: 'proc-blast-testing',
    name: 'Blast Performance Testing / Documentation',
    description: 'GSA/DoD blast resistance documentation and third-party review',
    category: 'testing',
    applicable_work_types: ['blast_security'],
    estimated_cost_fixed: 15000,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'Federal projects may require pre-qualification. Long-lead item.'
  },

  // ----------------------------------------------------------
  // ANCILLARY MATERIALS
  // ----------------------------------------------------------
  {
    id: 'proc-sealants-caulking',
    name: 'Sealants & Caulking',
    description: 'Structural silicone, weatherseal, and interior finishing caulk',
    category: 'material',
    applicable_work_types: [],
    estimated_cost_per_sf: 1.80,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'Sealant compatibility with glass coating and metal must be verified'
  },
  {
    id: 'proc-flashing-membrane',
    name: 'Flashing & Membrane Integration',
    description: 'Head flashing, sill pans, and waterproof membrane tie-in to surrounding construction',
    category: 'material',
    applicable_work_types: ['storefront', 'stick_curtain_wall', 'window_wall', 'skylight'],
    estimated_cost_per_sf: 2.20,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'Critical detail — water intrusion callbacks are the most common glazing warranty claim'
  },
  {
    id: 'proc-thermal-breaks',
    name: 'Thermal Break Insulation',
    description: 'Interior perimeter insulation at sill and head conditions',
    category: 'material',
    applicable_work_types: ['stick_curtain_wall', 'unitized_curtain_wall', 'window_wall'],
    estimated_cost_per_sf: 1.20,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'Required by ASHRAE 90.1 in DMV jurisdictions'
  },

  // ----------------------------------------------------------
  // EQUIPMENT
  // ----------------------------------------------------------
  {
    id: 'proc-scaffolding',
    name: 'Scaffolding / Lift Equipment',
    description: 'Tube-and-clamp, system scaffolding, or boom lifts for access',
    category: 'equipment',
    applicable_work_types: [],
    estimated_cost_per_sf: 3.50,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'Cost varies significantly with height, urban site constraints, and duration'
  },
  {
    id: 'proc-swing-stage-rental',
    name: 'Swing Stage / Suspended Access',
    description: 'Certified suspended scaffold rental, rigging, and operator costs',
    category: 'equipment',
    applicable_work_types: ['stick_curtain_wall', 'unitized_curtain_wall', 'window_wall'],
    estimated_cost_per_sf: 7.50,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'Certified riggers required. Weather delays possible. Significantly increases project cost.'
  },
  {
    id: 'proc-crane-lifts',
    name: 'Crane Lifts (Unitized / Heavy Glass)',
    description: 'Tower or mobile crane for panel lifts, heavy glass, or high-rise installs',
    category: 'equipment',
    applicable_work_types: ['unitized_curtain_wall', 'skylight', 'blast_security'],
    estimated_cost_per_sf: 5.00,
    cost_authority: true,
    source_ids: ['src-rsmeans-2024'],
    risk_note: 'Crane time is expensive and weather-sensitive. Schedule in advance.'
  },

  // ----------------------------------------------------------
  // SCOPE REFERENCES (cost_authority = false)
  // These inform scope descriptions and risk notes only
  // ----------------------------------------------------------
  {
    id: 'proc-fire-rated-label-frame',
    name: 'UL Fire Label Framing System',
    description: 'Entire frame-and-glass assembly must be UL-listed. No substitutions allowed after approval.',
    category: 'material',
    applicable_work_types: ['fire_rated'],
    cost_authority: false,
    source_ids: ['src-csi-div08-2024', 'src-ibc-2021'],
    risk_note: 'Frame manufacturer and glass must be from same UL-listed assembly. Substitutions void the listing.'
  },
  {
    id: 'proc-blast-anchorage',
    name: 'Blast-Resistant Anchorage System',
    description: 'Engineered anchorage to structure for blast load resistance per UFC 4-010-01',
    category: 'material',
    applicable_work_types: ['blast_security'],
    cost_authority: false,
    source_ids: ['src-csi-div08-2024'],
    risk_note: 'Structural engineer must size anchors. Coordination with GC and structural steel required.'
  }
];

export const getProcurementForWorkType = (work_type_id: string): ProcurementItem[] =>
  procurementItems.filter(
    p => p.applicable_work_types.length === 0 || p.applicable_work_types.includes(work_type_id)
  );
