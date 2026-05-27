// ============================================================
// WORK TYPES - Glazing System Definitions
// Source of truth for all glazing scope types in the platform
// Each work type references source IDs for traceability
// ============================================================

import type { WorkType } from '@/types';

export const workTypes: WorkType[] = [
  {
    id: 'storefront',
    name: 'Commercial Storefront',
    short_description: 'Aluminum-framed glass system at grade for commercial buildings',
    use_case: 'Retail entries, office lobbies, restaurant fronts, banks, ground-level commercial',
    csi_division: '08 41 00',
    typical_lead_time_weeks: { min: 4, max: 7 },
    difficulty_rating: 'Low',
    procurement_risk: 'Low',
    source_ids: ['src-csi-div08-2024', 'src-rsmeans-2024', 'src-kawneer-2024'],
    tags: ['entry', 'retail', 'office', 'grade-level', 'aluminum']
  },
  {
    id: 'stick_curtain_wall',
    name: 'Stick-Built Curtain Wall',
    short_description: 'Field-assembled aluminum curtain wall, piece by piece on structure',
    use_case: 'Mid-rise office, institutional, custom facades requiring field flexibility',
    csi_division: '08 44 00',
    typical_lead_time_weeks: { min: 8, max: 14 },
    difficulty_rating: 'Medium',
    procurement_risk: 'Medium',
    source_ids: ['src-csi-div08-2024', 'src-rsmeans-2024', 'src-kawneer-2024', 'src-ykk-ap-2024', 'src-gana-2023'],
    tags: ['curtain-wall', 'mid-rise', 'aluminum', 'field-assembled', 'commercial']
  },
  {
    id: 'unitized_curtain_wall',
    name: 'Unitized Curtain Wall',
    short_description: 'Factory-assembled curtain wall panels hung floor-to-floor on structure',
    use_case: 'High-rise towers, large commercial, fast-track construction, repetitive floor plates',
    csi_division: '08 44 00',
    typical_lead_time_weeks: { min: 12, max: 20 },
    difficulty_rating: 'High',
    procurement_risk: 'High',
    source_ids: ['src-csi-div08-2024', 'src-rsmeans-2024', 'src-kawneer-2024'],
    tags: ['curtain-wall', 'high-rise', 'factory-assembled', 'unitized', 'fast-track']
  },
  {
    id: 'window_wall',
    name: 'Window Wall',
    short_description: 'Floor-to-ceiling glass system resting on slab edges, not hung from structure',
    use_case: 'Multi-family residential, hotels, mixed-use; floor-to-floor span with slab pockets',
    csi_division: '08 51 00',
    typical_lead_time_weeks: { min: 6, max: 11 },
    difficulty_rating: 'Medium',
    procurement_risk: 'Medium',
    source_ids: ['src-csi-div08-2024', 'src-rsmeans-2024'],
    tags: ['window-wall', 'residential', 'multifamily', 'hotel', 'slab-edge']
  },
  {
    id: 'interior_partition',
    name: 'Interior Glass Partition',
    short_description: 'Non-structural glass wall and demising partition systems',
    use_case: 'Office interiors, conference rooms, medical suites, lobby dividers',
    csi_division: '08 81 00',
    typical_lead_time_weeks: { min: 3, max: 6 },
    difficulty_rating: 'Low',
    procurement_risk: 'Low',
    source_ids: ['src-csi-div08-2024', 'src-rsmeans-2024', 'src-fabglass-guide'],
    tags: ['interior', 'partition', 'office', 'frameless', 'demising']
  },
  {
    id: 'glass_railing',
    name: 'Glass Railing / Balustrade',
    short_description: 'Frameless or framed glass guardrail and balustrade systems',
    use_case: 'Balconies, atriums, stairways, terraces, mezzanines, exterior decks',
    csi_division: '08 71 00',
    typical_lead_time_weeks: { min: 5, max: 9 },
    difficulty_rating: 'Medium',
    procurement_risk: 'Medium',
    source_ids: ['src-csi-div08-2024', 'src-rsmeans-2024', 'src-ibc-2021', 'src-fabglass-guide'],
    tags: ['railing', 'balustrade', 'balcony', 'atrium', 'code-critical']
  },
  {
    id: 'skylight',
    name: 'Skylight / Overhead Glazing',
    short_description: 'Roof-mounted or overhead glass systems and atrium glazing',
    use_case: 'Retail atriums, office skylights, canopies, covered passages',
    csi_division: '08 85 00',
    typical_lead_time_weeks: { min: 10, max: 16 },
    difficulty_rating: 'High',
    procurement_risk: 'High',
    source_ids: ['src-csi-div08-2024', 'src-rsmeans-2024', 'src-gana-2023'],
    tags: ['overhead', 'skylight', 'atrium', 'canopy', 'drainage-critical']
  },
  {
    id: 'fire_rated',
    name: 'Fire-Rated Glazing',
    short_description: 'Glass and framing assemblies with UL-listed fire ratings (20 min – 3 hr)',
    use_case: 'Fire barriers, stairwell enclosures, corridor glazing, protected openings',
    csi_division: '08 33 00',
    typical_lead_time_weeks: { min: 8, max: 14 },
    difficulty_rating: 'High',
    procurement_risk: 'High',
    source_ids: ['src-csi-div08-2024', 'src-rsmeans-2024', 'src-ibc-2021'],
    tags: ['fire-rated', 'code-critical', 'UL-listed', 'barrier', 'corridor']
  },
  {
    id: 'residential_window',
    name: 'Residential Window & Door',
    short_description: 'Home window replacement, patio/sliding doors, and storm window repair',
    use_case: 'Single-family homes, rowhouses, townhomes — glass replacement, patio doors, storm windows',
    csi_division: '08 51 13',
    typical_lead_time_weeks: { min: 1, max: 4 },
    difficulty_rating: 'Low',
    procurement_risk: 'Low',
    source_ids: ['src-rsmeans-2024'],
    tags: ['residential', 'window-replacement', 'patio-door', 'storm-window', 'rowhouse', 'single-family']
  },
  {
    id: 'decorative_glass',
    name: 'Decorative & Specialty Glass',
    short_description: 'Custom flat glass: shower enclosures, mirrors, table tops, shelves, stained & patterned glass',
    use_case: 'Shower enclosures, beveled mirrors, glass table tops/shelves/cabinets, tinted, stained, patterned glass. Also handles screen repair quotes and DIY glass cut orders.',
    csi_division: '08 81 00',
    typical_lead_time_weeks: { min: 1, max: 3 },
    difficulty_rating: 'Low',
    procurement_risk: 'Low',
    source_ids: ['src-rsmeans-2024', 'src-fabglass-guide'],
    tags: ['decorative', 'shower', 'mirror', 'table-top', 'stained-glass', 'patterned', 'tinted', 'residential', 'custom-cut']
  },
  {
    id: 'blast_security',
    name: 'Blast / Security Glazing',
    short_description: 'Ballistic, blast-resistant, or forced-entry-resistant glazing assemblies',
    use_case: 'Federal buildings, embassies, courthouses, data centers, high-security facilities',
    csi_division: '08 44 13',
    typical_lead_time_weeks: { min: 14, max: 24 },
    difficulty_rating: 'Very High',
    procurement_risk: 'Very High',
    source_ids: ['src-csi-div08-2024', 'src-rsmeans-2024', 'src-ibc-2021'],
    tags: ['blast', 'ballistic', 'security', 'federal', 'GSA', 'high-security']
  }
];

export const getWorkTypeById = (id: string): WorkType | undefined =>
  workTypes.find(wt => wt.id === id);
