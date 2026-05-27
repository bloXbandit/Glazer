// ============================================================
// GLASS TYPES
// Material multipliers and descriptions sourced from technical references.
// RULE: cost_multiplier values must trace to pricing sources only.
// Educational sources (Fab Glass etc.) inform description/scope ONLY.
// ============================================================

import type { GlassType } from '@/types';

export const glassTypes: GlassType[] = [
  {
    id: 'standard_clear_igs',
    name: 'Standard Clear IGU',
    description: '1" insulated glass unit, clear annealed lites, air or argon fill',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Baseline unit. No special performance. Suitable for low-exposure applications.',
    source_ids: ['src-rsmeans-2024'],
    applicable_work_types: []
  },
  {
    id: 'low_e_clear',
    name: 'Low-E Insulated Glass (Clear)',
    description: '1" IGU with low-emissivity soft-coat or hard-coat, thermally improved',
    cost_multiplier: 1.22,
    lead_time_impact_weeks: 1,
    performance_notes: 'Energy code standard in most DMV jurisdictions. ASHRAE 90.1 compliant.',
    source_ids: ['src-rsmeans-2024', 'src-gana-2023'],
    applicable_work_types: [
      'storefront', 'stick_curtain_wall', 'unitized_curtain_wall',
      'window_wall', 'skylight', 'residential_window'
    ]
  },
  {
    id: 'low_e_tinted',
    name: 'Low-E Tinted / Solar Control',
    description: 'Tinted outer lite with Low-E coating; reduces solar heat gain',
    cost_multiplier: 1.30,
    lead_time_impact_weeks: 2,
    performance_notes: 'Common in DC/VA office projects. Reduces HVAC load. Slight color variation batch to batch.',
    source_ids: ['src-rsmeans-2024', 'src-gana-2023'],
    applicable_work_types: [
      'storefront', 'stick_curtain_wall', 'unitized_curtain_wall', 'window_wall',
      'residential_window', 'decorative_glass'
    ]
  },
  {
    id: 'tempered_clear',
    name: 'Tempered Safety Glass',
    description: 'Heat-strengthened tempered glass; shatters into small pieces on breakage',
    cost_multiplier: 1.15,
    lead_time_impact_weeks: 1,
    performance_notes: 'Code-required in many locations. All sizes must be finalized before fabrication — cannot be cut after tempering.',
    source_ids: ['src-rsmeans-2024', 'src-fabglass-guide'],
    applicable_work_types: [
      'storefront', 'interior_partition', 'glass_railing',
      'residential_window', 'decorative_glass'
    ]
  },
  {
    id: 'laminated_safety',
    name: 'Laminated Safety Glass (PVB)',
    description: 'Two glass lites bonded with PVB interlayer; holds together on breakage',
    cost_multiplier: 1.38,
    lead_time_impact_weeks: 2,
    performance_notes: 'Provides fall-out prevention, acoustic control, and forced-entry resistance. Heavier than standard — structural check required for large lites.',
    source_ids: ['src-rsmeans-2024', 'src-fabglass-guide'],
    applicable_work_types: [
      'interior_partition', 'glass_railing', 'skylight', 'storefront',
      'decorative_glass'
    ]
  },
  {
    id: 'laminated_sgp',
    name: 'Laminated Safety Glass (SGP Interlayer)',
    description: 'Structural laminated glass with SentryGlas Plus interlayer; superior strength',
    cost_multiplier: 1.55,
    lead_time_impact_weeks: 3,
    performance_notes: 'Required for overhead glazing, point-fixed systems, and blast applications. 5x stronger than PVB.',
    source_ids: ['src-rsmeans-2024', 'src-gana-2023'],
    applicable_work_types: ['skylight', 'glass_railing', 'blast_security']
  },
  {
    id: 'fire_rated_glass',
    name: 'Fire-Rated Glass (UL Listed)',
    description: 'UL-classified fire-protection or fire-resistance rated glass',
    cost_multiplier: 2.80,
    lead_time_impact_weeks: 6,
    performance_notes: 'Must be specified by UL design number. Frame and glass are a listed assembly. Do not mix manufacturers. Premium premium cost item.',
    source_ids: ['src-rsmeans-2024', 'src-ibc-2021'],
    applicable_work_types: ['fire_rated']
  },
  {
    id: 'blast_resistant',
    name: 'Blast-Resistant Glazing',
    description: 'Laminated glass assembly tested to GSA or DoD blast standards',
    cost_multiplier: 4.50,
    lead_time_impact_weeks: 12,
    performance_notes: 'Must meet specific threat level per GSA Security Design Manual or UFC 4-010-01. Requires special framing and anchorage engineering.',
    source_ids: ['src-rsmeans-2024'],
    applicable_work_types: ['blast_security']
  },
  {
    id: 'acoustic_laminated',
    name: 'Acoustic Laminated Glass',
    description: 'Laminated glass with acoustic-grade PVB to reduce sound transmission',
    cost_multiplier: 1.45,
    lead_time_impact_weeks: 2,
    performance_notes: 'Used in noisy urban environments, hospitals, and studio spaces. Check STC rating requirements in specs.',
    source_ids: ['src-rsmeans-2024', 'src-gana-2023'],
    applicable_work_types: ['interior_partition', 'window_wall', 'storefront', 'residential_window']
  }
];

export const getGlassTypeById = (id: string): GlassType | undefined =>
  glassTypes.find(g => g.id === id);
