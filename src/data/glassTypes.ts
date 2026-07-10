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
  // ------------------------------------------------------------
  // BGC SHOP GLASS PRODUCTS — Baltimore Glass Co. true pricing
  // Sell rates from the BGC Pricing Document (src-bgc-pricing-doc).
  // Rates are $/sqft, already marked up; engine applies the exact
  // shop formulas (see src/data/bgcPricing.ts).
  // ------------------------------------------------------------
  {
    id: 'bgc_ss_3_32',
    name: 'BGC — 3/32" Single Strength (SS)',
    description: 'Single-strength glass for windows or IG units. Sells $8/sqft clean-cut or swiped edges.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $8/sqft (min 1 sqft, 2" increments). Window repair: $5/sqft glass + $20 labor ×1.75 markup.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 8, sell_per_sf_polished: 8, repair_rate_per_sf: 5, repair_labor_per_lite: 20 }
  },
  {
    id: 'bgc_ds_1_8',
    name: 'BGC — 1/8" Double Strength (DS)',
    description: 'Double-strength glass for windows or IG units. $9/sqft for all 1/8 DS glass.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $9/sqft clean-cut or with edge work. Window repair: $6/sqft glass + $20 labor ×1.75 markup (+$30 putty when required).',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 9, sell_per_sf_polished: 9, repair_rate_per_sf: 6, repair_labor_per_lite: 20 }
  },
  {
    id: 'bgc_plate_3_16_1_4',
    name: 'BGC — 3/16" / 1/4" Plate',
    description: 'Plate glass for windows, IGs, and glass tops. $14/sqft clean-cut, $16/sqft polished edges.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $14/sqft CC or $16/sqft with polished edges. Used for glass tops and heavier lites.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window', 'interior_partition', 'storefront'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 14, sell_per_sf_polished: 16 }
  },
  {
    id: 'bgc_mirror',
    name: 'BGC — Mirror (1/8" / 1/4")',
    description: 'Mirror glass. $16/sqft clean-cut, $18/sqft polished edge (PE).',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $16/sqft CC or $18/sqft with polished edges, both 1/8" and 1/4" mirror.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'interior_partition'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 16, sell_per_sf_polished: 18 }
  },
  {
    id: 'bgc_lami_1_4',
    name: 'BGC — 1/4" Clear Laminated',
    description: 'Clear laminated safety glass, 1/4". $18/sqft.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $18/sqft. Safety glazing — holds together on breakage.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window', 'interior_partition', 'storefront'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 18, sell_per_sf_polished: 18 }
  },
  {
    id: 'bgc_lami_1_8',
    name: 'BGC — 1/8" Clear Laminated',
    description: 'Clear laminated safety glass, 1/8". $25/sqft.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $25/sqft.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 25, sell_per_sf_polished: 25 }
  },
  {
    id: 'bgc_ig_5_8_clear',
    name: 'BGC — 5/8" Clear Insulated (IG)',
    description: 'Clear insulated glass unit, double pane, 5/8". $10/sqft.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $10/sqft. Window repair: glass + $30 labor (push-in vinyl; $35 wrap-around) ×1.75 markup.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window', 'storefront'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 10, sell_per_sf_polished: 10, repair_labor_per_lite: 30 }
  },
  {
    id: 'bgc_ig_other',
    name: 'BGC — Other Insulated Glass (IG)',
    description: 'Insulated glass units other than 5/8" clear (3/8"–1" combinations). $11.50/sqft.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $11.50/sqft. IG can be 3/8" to 1" using 3/32 to 1/4 lites with appropriate spacer.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window', 'storefront'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 11.5, sell_per_sf_polished: 11.5, repair_labor_per_lite: 30 }
  },
  {
    id: 'bgc_ig_low_e',
    name: 'BGC — Low-E Insulated (IG)',
    description: 'Low-emissivity insulated glass unit. $12/sqft.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $12/sqft. Window repair: glass + $30 labor ×1.75 markup.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window', 'storefront'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 12, sell_per_sf_polished: 12, repair_labor_per_lite: 30 }
  },
  {
    id: 'bgc_ig_clear_mullions',
    name: 'BGC — Clear IG with Mullions (up to 3)',
    description: 'Clear insulated glass with up to 3 mullions. $13/sqft.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $13/sqft with up to 3 mullions. More than 3 mullions (grid): check OBE.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 13, sell_per_sf_polished: 13, repair_labor_per_lite: 30 }
  },
  {
    id: 'bgc_ig_low_e_mullions',
    name: 'BGC — Low-E IG with Mullions (up to 3)',
    description: 'Low-E insulated glass with up to 3 mullions. $14/sqft.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 0,
    performance_notes: 'Shop pricing: $14/sqft with up to 3 mullions. More than 3 mullions (grid): check OBE.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'residential_window'],
    bgc_pricing: { method: 'flat_rate', sell_per_sf: 14, sell_per_sf_polished: 14, repair_labor_per_lite: 30 }
  },
  {
    id: 'bgc_heavy_3_8',
    name: 'BGC — 3/8" Heavy Glass (Cost-Plus)',
    description: 'Heavy glass from Oldcastle (OBE). Cost-plus: $7.78/sqft + $0.15/inch edging ×1.13 OBE FSC ×2.0 markup.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 1,
    performance_notes: 'Cost-plus quoting per BGC price sheet. Markup 2.0 standard (1.85 floor if customer pushes back). Shapes via Bel Pre add 1.30–1.35 shape charge.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'interior_partition', 'storefront'],
    bgc_pricing: { method: 'cost_plus', obe_cost_per_sf: 7.78, edge_cost_per_inch: 0.15 }
  },
  {
    id: 'bgc_heavy_1_2',
    name: 'BGC — 1/2" Heavy Glass (Cost-Plus)',
    description: 'Heavy glass from Oldcastle (OBE). Cost-plus: $8.35/sqft + $0.17/inch edging ×1.13 OBE FSC ×2.0 markup.',
    cost_multiplier: 1.00,
    lead_time_impact_weeks: 1,
    performance_notes: 'Cost-plus quoting per BGC price sheet. Markup 2.0 standard (1.85 floor). 3/4" heavy glass also cost-plus — get OBE cost at order time.',
    source_ids: ['src-bgc-pricing-doc'],
    applicable_work_types: ['decorative_glass', 'interior_partition', 'storefront'],
    bgc_pricing: { method: 'cost_plus', obe_cost_per_sf: 8.35, edge_cost_per_inch: 0.17 }
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
