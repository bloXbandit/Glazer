// ============================================================
// SOURCE INGESTION FRAMEWORK
// Every pricing/benchmark data point must trace back to a source here.
// RULE: only source_type 'pricing' | 'historical_project' can set can_affect_price = true
// RULE: educational, technical, code, manufacturer sources = explanation/scope/risk ONLY
// To add new data: add a SourceRecord here, then reference its id in data files
// ============================================================

import type { SourceRecord } from '@/types';

export const sources: SourceRecord[] = [
  // ----------------------------------------------------------
  // PRICING SOURCES
  // ----------------------------------------------------------
  {
    id: 'src-rsmeans-2024',
    title: 'RSMeans Building Construction Cost Data 2024',
    url: 'https://www.gordiangroup.com/rsmeans',
    publisher: 'Gordian / RSMeans',
    source_type: 'pricing',
    date_accessed: '2024-11-01',
    date_published: '2024-01-01',
    confidence_weight: 0.90,
    allowed_usage: ['estimate_pricing', 'confidence_score', 'assumption_text'],
    linked_work_types: [
      'storefront', 'stick_curtain_wall', 'unitized_curtain_wall',
      'window_wall', 'interior_partition', 'glass_railing',
      'skylight', 'fire_rated', 'blast_security'
    ],
    extracted_facts: [
      {
        id: 'ef-rsmeans-sf-01',
        fact_type: 'price_per_sf',
        text: 'Commercial aluminum storefront system, installed, national average',
        numeric_value: 55,
        unit: '$/SF',
        confidence: 'high',
        applies_to: ['storefront'],
        can_affect_price: true,
        notes: 'National average including material and labor, excludes glass'
      },
      {
        id: 'ef-rsmeans-cw-01',
        fact_type: 'price_per_sf',
        text: 'Stick-built curtain wall system, installed, national average',
        numeric_value: 110,
        unit: '$/SF',
        confidence: 'high',
        applies_to: ['stick_curtain_wall'],
        can_affect_price: true,
        notes: 'Includes aluminum framing, thermal break, insulated glass unit'
      },
      {
        id: 'ef-rsmeans-ucw-01',
        fact_type: 'price_per_sf',
        text: 'Unitized curtain wall, premium system, national average',
        numeric_value: 160,
        unit: '$/SF',
        confidence: 'high',
        applies_to: ['unitized_curtain_wall'],
        can_affect_price: true,
        notes: 'Factory-assembled panels including glazing, install, sealing'
      },
      {
        id: 'ef-rsmeans-labor-glazier-01',
        fact_type: 'labor_rate',
        text: 'Glazier journeyman wage, national average',
        numeric_value: 58,
        unit: '$/HR',
        confidence: 'high',
        applies_to: ['storefront', 'stick_curtain_wall', 'unitized_curtain_wall', 'window_wall', 'interior_partition'],
        can_affect_price: true,
        notes: 'Base wage only, does not include benefits burden'
      }
    ],
    notes: 'Primary pricing authority for all base cost estimates'
  },

  {
    id: 'src-cdc-dmv-bid-data-2023',
    title: 'DMV Commercial Glazing Bid Results Compilation 2021-2023',
    url: '',
    publisher: 'Internal Compilation - Public Bid Records DC, MD, VA',
    source_type: 'historical_project',
    date_accessed: '2024-01-01',
    date_published: '2024-01-01',
    confidence_weight: 0.85,
    allowed_usage: ['estimate_pricing', 'risk_flag', 'confidence_score', 'assumption_text'],
    linked_work_types: [
      'storefront', 'stick_curtain_wall', 'unitized_curtain_wall', 'window_wall', 'fire_rated'
    ],
    extracted_facts: [
      {
        id: 'ef-bid-dc-cw-01',
        fact_type: 'price_per_sf',
        text: 'Washington DC area stick-built curtain wall, competitive bid range 2021-2023',
        numeric_value: 130,
        unit: '$/SF',
        confidence: 'high',
        applies_to: ['stick_curtain_wall'],
        can_affect_price: true,
        notes: 'Mid-point of surveyed DC area bids, prevailing wage included'
      },
      {
        id: 'ef-bid-nova-sf-01',
        fact_type: 'price_per_sf',
        text: 'Northern Virginia storefront competitive bid range',
        numeric_value: 68,
        unit: '$/SF',
        confidence: 'high',
        applies_to: ['storefront'],
        can_affect_price: true,
        notes: 'Mid-point Arlington/Fairfax/Alexandria area bids'
      },
      {
        id: 'ef-bid-md-ww-01',
        fact_type: 'price_per_sf',
        text: 'Maryland window wall system competitive bid range',
        numeric_value: 95,
        unit: '$/SF',
        confidence: 'medium',
        applies_to: ['window_wall'],
        can_affect_price: true,
        notes: 'Montgomery/PG County area, multifamily projects'
      }
    ],
    notes: 'Compiled from public procurement portals: SDAT, DC eProcurement, eVA'
  },

  // ----------------------------------------------------------
  // SCOPE DEFINITION SOURCES
  // ----------------------------------------------------------
  {
    id: 'src-csi-div08-2024',
    title: 'MasterFormat Division 08 - Openings, 2024 Edition',
    url: 'https://www.csiresources.org/standards/masterformat',
    publisher: 'Construction Specifications Institute (CSI)',
    source_type: 'scope_definition',
    date_accessed: '2024-09-01',
    date_published: '2024-01-01',
    confidence_weight: 0.95,
    allowed_usage: ['scope_description', 'procurement_item', 'assumption_text', 'ai_advisor_context'],
    linked_work_types: [
      'storefront', 'stick_curtain_wall', 'unitized_curtain_wall',
      'window_wall', 'interior_partition', 'glass_railing',
      'skylight', 'fire_rated', 'blast_security'
    ],
    extracted_facts: [
      {
        id: 'ef-csi-08-41-00',
        fact_type: 'scope_note',
        text: 'CSI 08 41 00 - Entrances and Storefronts: aluminum-framed storefront, commercial entrances, automatic door assemblies',
        confidence: 'verified',
        applies_to: ['storefront'],
        can_affect_price: false
      },
      {
        id: 'ef-csi-08-44-00',
        fact_type: 'scope_note',
        text: 'CSI 08 44 00 - Curtain Wall and Glazed Assemblies: stick-built and unitized curtain wall, structural silicone glazing',
        confidence: 'verified',
        applies_to: ['stick_curtain_wall', 'unitized_curtain_wall'],
        can_affect_price: false
      },
      {
        id: 'ef-csi-08-33-00',
        fact_type: 'scope_note',
        text: 'CSI 08 33 00 - Coiling Doors and Grilles / Fire-Rated Glazing: fire-rated glass assemblies, hourly rating requirements',
        confidence: 'verified',
        applies_to: ['fire_rated'],
        can_affect_price: false
      }
    ],
    notes: 'Authoritative scope reference. Zero price authority.'
  },

  // ----------------------------------------------------------
  // PREVAILING WAGE / LABOR COMPLIANCE
  // ----------------------------------------------------------
  {
    id: 'src-davis-bacon',
    title: 'U.S. Department of Labor — Davis-Bacon Wage Determinations (DMV)',
    url: 'https://sam.gov/content/wage-determinations',
    publisher: 'U.S. Department of Labor, Wage and Hour Division',
    source_type: 'pricing',
    date_accessed: '2024-11-01',
    date_published: '2024-01-01',
    confidence_weight: 0.95,
    allowed_usage: ['estimate_pricing', 'assumption_text', 'risk_flag', 'ai_advisor_context'],
    linked_work_types: [
      'storefront', 'stick_curtain_wall', 'unitized_curtain_wall',
      'window_wall', 'fire_rated', 'blast_security', 'skylight',
      'glass_railing', 'interior_partition'
    ],
    extracted_facts: [
      {
        id: 'ef-db-glazier-dc-2024',
        fact_type: 'labor_rate',
        text: 'Davis-Bacon glazier journeyman base rate, Washington D.C. jurisdiction, 2024',
        numeric_value: 67.50,
        unit: '$/HR',
        confidence: 'verified',
        applies_to: ['storefront', 'stick_curtain_wall', 'unitized_curtain_wall'],
        can_affect_price: true,
        notes: 'Base rate only; add fringe benefits per WD. Federal and DC public work only.'
      },
      {
        id: 'ef-db-glazier-md-2024',
        fact_type: 'labor_rate',
        text: 'Maryland prevailing wage glazier rate, Montgomery/PG County, 2024',
        numeric_value: 62.00,
        unit: '$/HR',
        confidence: 'verified',
        applies_to: ['storefront', 'stick_curtain_wall', 'unitized_curtain_wall'],
        can_affect_price: true,
        notes: 'Maryland Prevailing Wage Act. Public works contracts ≥$500K with ≥25% state funding.'
      }
    ],
    notes: 'Federal and state prevailing wage authority for glazier trade in DMV jurisdictions.'
  },

  // ----------------------------------------------------------
  // TECHNICAL / ENGINEERING SOURCES
  // ----------------------------------------------------------
  {
    id: 'src-nfrc-technical',
    title: 'National Fenestration Rating Council — Fenestration Product Standards',
    url: 'https://www.nfrc.org',
    publisher: 'National Fenestration Rating Council (NFRC)',
    source_type: 'technical_engineering',
    date_accessed: '2024-09-01',
    date_published: '2024-01-01',
    confidence_weight: 0.90,
    allowed_usage: [
      'scope_description', 'assumption_text', 'risk_flag',
      'install_complexity', 'ai_advisor_context', 'user_guidance'
    ],
    linked_work_types: [
      'storefront', 'stick_curtain_wall', 'unitized_curtain_wall',
      'window_wall', 'skylight', 'fire_rated', 'blast_security',
      'glass_railing', 'interior_partition'
    ],
    extracted_facts: [
      {
        id: 'ef-nfrc-u-value',
        fact_type: 'technical_spec',
        text: 'NFRC 100: standardized U-factor and SHGC ratings for commercial fenestration. ASHRAE 90.1-2022 requires U≤0.38 for most commercial curtain wall in climate zone 4A (DC/MD/VA)',
        confidence: 'verified',
        applies_to: ['stick_curtain_wall', 'unitized_curtain_wall', 'window_wall', 'storefront'],
        can_affect_price: false,
        notes: 'Energy compliance reference. Performance requirement affects glass selection and cost.'
      },
      {
        id: 'ef-nfrc-label',
        fact_type: 'technical_spec',
        text: 'NFRC certification labels required on glazing products used in ASHRAE 90.1 compliance calculations for commercial buildings',
        confidence: 'verified',
        applies_to: ['storefront', 'stick_curtain_wall', 'unitized_curtain_wall'],
        can_affect_price: false,
        notes: 'Procurement and submittal requirement. Not a price authority.'
      }
    ],
    notes: 'Technical reference for fenestration performance standards. No price authority.'
  },

  {
    id: 'src-gana-2023',
    title: 'Glass Association of North America - Glazing Manual 2023',
    url: 'https://www.glasswebsite.com',
    publisher: 'GANA',
    source_type: 'technical_engineering',
    date_accessed: '2024-06-01',
    date_published: '2023-01-01',
    confidence_weight: 0.88,
    allowed_usage: [
      'scope_description', 'assumption_text', 'risk_flag',
      'install_complexity', 'ai_advisor_context', 'user_guidance'
    ],
    linked_work_types: [
      'stick_curtain_wall', 'unitized_curtain_wall', 'window_wall',
      'skylight', 'fire_rated', 'blast_security'
    ],
    extracted_facts: [
      {
        id: 'ef-gana-cw-prod',
        fact_type: 'labor_hours_per_sf',
        text: 'Curtain wall installation productivity: 0.30-0.45 hours per SF for stick-built systems',
        numeric_value: 0.38,
        unit: 'hrs/SF',
        confidence: 'medium',
        applies_to: ['stick_curtain_wall'],
        can_affect_price: false,
        notes: 'Does not authorize pricing; used for labor hour estimation only'
      },
      {
        id: 'ef-gana-skylight-risk',
        fact_type: 'risk_note',
        text: 'Overhead glazing requires enhanced sealant systems, drainage provisions, and access provisions for maintenance',
        confidence: 'verified',
        applies_to: ['skylight'],
        can_affect_price: false
      }
    ],
    notes: 'Technical reference only. No price authority.'
  },

  // ----------------------------------------------------------
  // CODE COMPLIANCE SOURCES
  // ----------------------------------------------------------
  {
    id: 'src-ibc-2021',
    title: 'International Building Code 2021',
    url: 'https://codes.iccsafe.org/content/IBC2021P2',
    publisher: 'ICC - International Code Council',
    source_type: 'code_compliance',
    date_accessed: '2024-07-01',
    date_published: '2021-01-01',
    confidence_weight: 1.0,
    allowed_usage: [
      'scope_description', 'risk_flag', 'assumption_text',
      'procurement_item', 'ai_advisor_context', 'user_guidance'
    ],
    linked_work_types: ['fire_rated', 'blast_security', 'skylight', 'glass_railing'],
    extracted_facts: [
      {
        id: 'ef-ibc-fire-glass',
        fact_type: 'code_requirement',
        text: 'IBC Section 715: Fire-rated glazing must meet fire-protection rating or fire-resistance rating as required by occupancy and construction type',
        confidence: 'verified',
        applies_to: ['fire_rated'],
        can_affect_price: false
      },
      {
        id: 'ef-ibc-railing-glass',
        fact_type: 'code_requirement',
        text: 'IBC Section 2407: Glass in railing systems must be tempered or laminated safety glass; point-supported systems require engineering analysis',
        confidence: 'verified',
        applies_to: ['glass_railing'],
        can_affect_price: false
      }
    ],
    notes: 'Mandatory compliance reference. Zero price authority.'
  },

  // ----------------------------------------------------------
  // MANUFACTURER PRODUCT SOURCES
  // ----------------------------------------------------------
  {
    id: 'src-kawneer-2024',
    title: 'Kawneer Commercial Glazing Systems - Product Reference 2024',
    url: 'https://www.kawneer.com',
    publisher: 'Kawneer Company Inc. (Arconic)',
    source_type: 'manufacturer_product',
    date_accessed: '2024-10-01',
    date_published: '2024-01-01',
    confidence_weight: 0.80,
    allowed_usage: [
      'scope_description', 'procurement_item', 'assumption_text',
      'install_complexity', 'user_guidance', 'ai_advisor_context'
    ],
    linked_work_types: [
      'storefront', 'stick_curtain_wall', 'unitized_curtain_wall', 'window_wall'
    ],
    extracted_facts: [
      {
        id: 'ef-kawneer-1600-cw',
        fact_type: 'scope_note',
        text: 'Kawneer 1600 Wall System: 2" x 6" curtain wall, 2-inch sightline, thermal break standard, max 600 PSF wind load',
        confidence: 'high',
        applies_to: ['stick_curtain_wall'],
        can_affect_price: false,
        notes: 'Spec reference only. No list pricing used for estimates.'
      },
      {
        id: 'ef-kawneer-storefront-350',
        fact_type: 'scope_note',
        text: 'Kawneer 350 Storefront: standard 1-3/4" x 4-1/2" system, thermal break, compatible with most hardware',
        confidence: 'high',
        applies_to: ['storefront'],
        can_affect_price: false
      },
      {
        id: 'ef-kawneer-lead-time',
        fact_type: 'lead_time_weeks',
        text: 'Kawneer curtain wall lead time: typically 10-14 weeks from approved shop drawings',
        numeric_value: 12,
        unit: 'weeks',
        confidence: 'medium',
        applies_to: ['stick_curtain_wall', 'unitized_curtain_wall'],
        can_affect_price: false
      }
    ],
    notes: 'Manufacturer reference for scope and procurement. No list price authority.'
  },

  {
    id: 'src-ykk-ap-2024',
    title: 'YKK AP Commercial Architectural Products 2024',
    url: 'https://www.ykkap.com/commercial',
    publisher: 'YKK AP America',
    source_type: 'manufacturer_product',
    date_accessed: '2024-10-01',
    date_published: '2024-01-01',
    confidence_weight: 0.80,
    allowed_usage: [
      'scope_description', 'procurement_item', 'assumption_text',
      'install_complexity', 'user_guidance', 'ai_advisor_context'
    ],
    linked_work_types: ['storefront', 'stick_curtain_wall', 'unitized_curtain_wall'],
    extracted_facts: [
      {
        id: 'ef-ykk-cw-501t',
        fact_type: 'scope_note',
        text: 'YKK AP 501T Thermal Stick System: 2"x6" curtain wall with thermal break, 2-inch sightlines, suitable for 1" to 1-3/4" IGUs',
        confidence: 'high',
        applies_to: ['stick_curtain_wall'],
        can_affect_price: false
      }
    ],
    notes: 'Manufacturer reference only. No price authority.'
  },

  // ----------------------------------------------------------
  // EDUCATIONAL REFERENCES
  // ----------------------------------------------------------
  {
    id: 'src-fabglass-guide',
    title: 'Types of Commercial Glass - Material Guide',
    url: 'https://www.fab-glass-and-mirror.com/blog/types-of-commercial-glass',
    publisher: 'Fab Glass and Mirror',
    source_type: 'educational_reference',
    date_accessed: '2024-08-01',
    date_published: '2023-06-01',
    confidence_weight: 0.40,
    allowed_usage: [
      'scope_description', 'user_guidance', 'assumption_text', 'ai_advisor_context'
    ],
    linked_work_types: [
      'storefront', 'interior_partition', 'glass_railing'
    ],
    extracted_facts: [
      {
        id: 'ef-fabglass-laminated',
        fact_type: 'scope_note',
        text: 'Laminated glass: PVB or SGP interlayer provides safety, security, and acoustic benefits; heavier and higher handling cost vs standard',
        confidence: 'medium',
        applies_to: ['interior_partition', 'glass_railing', 'storefront'],
        can_affect_price: false,
        notes: 'Educational context only. Cannot set price values.'
      },
      {
        id: 'ef-fabglass-tempered',
        fact_type: 'scope_note',
        text: 'Tempered glass cannot be cut after tempering; all dimensions must be finalized before fabrication order',
        confidence: 'high',
        applies_to: ['storefront', 'interior_partition', 'glass_railing'],
        can_affect_price: false,
        notes: 'Procurement risk note only.'
      }
    ],
    notes: 'Educational/blog source. ZERO price authority. Scope description and guidance only.'
  },

  // ----------------------------------------------------------
  // PROCUREMENT INTELLIGENCE (internal — parsed documents)
  // ----------------------------------------------------------
  {
    id: 'src-proc-intel',
    title: 'Internal Procurement Intelligence — Parsed Proposals & Bid Tabs',
    url: '',
    publisher: 'Internal — Normalized from subcontractor proposals, bid tabs, and scope documents',
    source_type: 'historical_project',
    date_accessed: '2024-01-01',
    date_published: '2024-01-01',
    confidence_weight: 0.70,
    allowed_usage: ['assumption_text', 'risk_flag', 'ai_advisor_context', 'user_guidance'],
    linked_work_types: [
      'storefront', 'stick_curtain_wall', 'unitized_curtain_wall',
      'window_wall', 'interior_partition', 'glass_railing',
      'skylight', 'fire_rated', 'blast_security'
    ],
    extracted_facts: [],
    notes: 'Normalized procurement document intelligence. Pricing is historical_scope_intelligence only. Not verified_pricing_authority unless document_type is purchase_order or subcontract_exhibit with confirmed award values.'
  },
];

// Lookup helper
export const getSourceById = (id: string): SourceRecord | undefined =>
  sources.find(s => s.id === id);

// Get only pricing-authority sources (used to validate benchmark data)
export const getPricingSources = (): SourceRecord[] =>
  sources.filter(s => s.source_type === 'pricing' || s.source_type === 'historical_project');

// Guard: validate that a fact can affect price only if source allows it
export const validatePriceAuthority = (sourceId: string): boolean => {
  const src = getSourceById(sourceId);
  if (!src) return false;
  return src.source_type === 'pricing' || src.source_type === 'historical_project';
};
