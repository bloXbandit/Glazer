// ============================================================
// PROCUREMENT INTELLIGENCE — Seed Data
// Pre-normalized ScopeIntelligence entries from real-world-style
// glazing proposals and bid documents.
//
// Authority: historical_scope_intelligence
// These are NOT verified_pricing_authority. Price confidence is
// 'proposed' or 'awarded' as indicated per entry.
// ============================================================

import type { ScopeIntelligence } from '@/types';

export const procurementIntelligenceEntries: ScopeIntelligence[] = [
  // ──────────────────────────────────────────────────────────
  // ENTRY 1 — Unitized curtain wall proposal, DC office tower
  // ──────────────────────────────────────────────────────────
  {
    id: 'si-seed-001',
    document_id: 'seed-001',
    parsed_at: '2024-03-15T00:00:00.000Z',
    document_type: 'subcontractor_proposal',
    subcontractor_name: 'Capitol Glass & Glazing, Inc.',
    project_name: 'Meridian Office Tower — 1200 New York Ave NW',
    project_location: 'Washington, D.C.',
    bid_date: '2024-03-10',
    quote_valid_until: '2024-04-10',
    revision: 'Rev. 2',

    glazing_systems: ['unitized_curtain_wall', 'storefront'],
    total_sf_proposed: 42500,
    total_price_proposed: 5_355_000,
    price_confidence: 'proposed',

    furnish_install: {
      material_by: 'sub',
      install_by: 'sub',
      material_percentage: 62,
      labor_percentage: 38,
      notes: 'Full furnish and install. Factory-glazed unitized panels shipped from manufacturer. Sub responsible for shop drawings, engineering stamp, and installation labor.',
    },

    inclusions: [
      'Aluminum unitized curtain wall framing, factory-glazed, Kawneer 1600UT or approved equal',
      'High-performance 1" insulated glass units with triple silver low-e coating',
      'Perimeter sealant and backing rod at all heads, sills, and jambs',
      'Shop drawings, delegated structural engineering (PE stamp)',
      'Anchor system design and installation at all floor slabs',
      'Aluminum ground-floor storefront with thermally broken framing',
      'Swing stage mobilization and rigging for floors 4 through 22',
      'All substrate blocking and backing at perimeter conditions',
      'Water infiltration test per AAMA 501.2 (two locations per floor, spot check)',
      'Standard 2-year workmanship warranty',
    ],

    exclusions: [
      'Permits and permit fees — by General Contractor',
      'Concrete slab edge preparation and tolerance corrections — by GC',
      'Fire safing insulation at floor lines — by GC',
      'Glass cleaning after installation — by Owner',
      'Operable windows (not in scope)',
      'Mechanical louvers and vents',
      'Interior reveals and trim — by GC',
      'Touch-up painting of aluminum after other trades',
      'Glass breakage after substantial completion',
      'Rebar installation at anchor embed locations — by GC structural',
    ],

    line_items: [
      {
        id: 'li-001',
        description: 'Unitized curtain wall system — Floors 4–22',
        normalized_description: 'Unitized curtain wall — upper floors',
        glazing_system_category: 'unitized_curtain_wall',
        quantity: 38_200,
        unit: 'SF',
        unit_price: 126,
        extended_price: 4_813_200,
        price_confidence: 'proposed',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
      },
      {
        id: 'li-002',
        description: 'Ground floor aluminum storefront — Lobby entries and retail',
        normalized_description: 'Ground floor storefront',
        glazing_system_category: 'storefront',
        quantity: 4_300,
        unit: 'SF',
        unit_price: 79,
        extended_price: 339_700,
        price_confidence: 'proposed',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
      },
      {
        id: 'li-003',
        description: 'Alternate ADD: Upgrade to triple-glazed IGU, R-value enhancement',
        normalized_description: 'Alt. 1 — Triple-glazed IGU upgrade',
        glazing_system_category: 'unitized_curtain_wall',
        quantity: 38_200,
        unit: 'SF',
        unit_price: 18,
        extended_price: 687_600,
        price_confidence: 'proposed',
        furnish_install: 'furnish_and_install',
        included_in_base: false,
        is_alternate: true,
        alternate_description: 'Add-alternate for triple-glazed IGU across all upper floor CW panels',
      },
      {
        id: 'li-004',
        description: 'Deduct ALT: Delete storefront, NIC (GC self-perform)',
        normalized_description: 'Deduct Alt. — storefront by GC',
        glazing_system_category: 'storefront',
        quantity: 1,
        unit: 'LS',
        unit_price: -339_700,
        extended_price: -339_700,
        price_confidence: 'proposed',
        furnish_install: 'furnish_and_install',
        included_in_base: false,
        is_alternate: true,
        alternate_description: 'Deduct alternate if storefront is self-performed by GC',
      },
    ],

    lead_times: [
      {
        item: 'Unitized curtain wall panels',
        weeks_min: 14,
        weeks_max: 18,
        weeks_typical: 16,
        clock_start: 'from approved shop drawings',
        notes: 'Manufacturer: Kawneer Springdale. Lead time subject to order volume at time of release.',
      },
      {
        item: 'Specialty low-e glass IGUs',
        weeks_min: 8,
        weeks_max: 10,
        weeks_typical: 9,
        clock_start: 'from approved shop drawings',
        notes: 'Guardian Glass source. Order concurrent with panel fabrication.',
      },
    ],

    mobilization: {
      included: true,
      trips_assumed: 3,
      phasing_notes: 'Three mobilizations assumed: initial setup (floors 4–10), mid-tower (11–17), upper (18–22). Demob at project completion.',
      notes: 'Swing stage mobilization included in base price. Assumes GC provides swing stage header beam welding at roof.',
    },

    access_assumptions: [
      {
        method: 'swing stage',
        provided_by: 'sub',
        floor_range: 'Floors 4–22',
        included_in_price: true,
        assumptions_stated: [
          'Swing stage rental, rigging, and operation by sub',
          'GC to provide header beam welding access at roof parapet',
          'OSHA 1926.502 certified operators',
        ],
      },
      {
        method: 'scissor lift',
        provided_by: 'gc',
        floor_range: 'Floors 1–3',
        included_in_price: false,
        assumptions_stated: [
          'GC to provide scissor lift access for storefront at ground and mezzanine',
        ],
      },
    ],

    warranty: {
      scope: 'Glazing system workmanship and weathertightness',
      years: 2,
      labor_included: true,
      material_included: true,
      glass_breakage_excluded: true,
      notes: '2-year workmanship warranty. Glass seal failure covered under separate IGU manufacturer warranty (5 years). Glass breakage excluded.',
    },

    risks: [
      {
        id: 'prf-001',
        category: 'schedule',
        severity: 'High',
        description: 'Panel lead time of 14–18 weeks from approved shop drawings creates critical path exposure. Late approvals compress install schedule.',
        source_text: 'Lead time: 14–18 weeks from approved shop drawings',
        recommendation: 'Submit shop drawings within 2 weeks of NTP. Target approval within 4 weeks of submission to protect procurement schedule.',
      },
      {
        id: 'prf-002',
        category: 'price_escalation',
        severity: 'Medium',
        description: 'Proposal valid 30 days only. Aluminum market pricing has been volatile.',
        source_text: 'Quote valid for 30 days from date of proposal',
        recommendation: 'Issue Letter of Intent before bid expiration. Lock in pricing before award.',
      },
      {
        id: 'prf-003',
        category: 'scope_gap',
        severity: 'Medium',
        description: 'Fire safing at floor lines is excluded. This is a common scope gap between glazing sub and GC in unitized CW projects.',
        recommendation: 'Confirm fire safing responsibility and detail with GC before subcontract execution. Show clearly on drawings.',
      },
    ],

    parse_method: 'manual',
    parse_confidence: 'high',
    raw_text_snippet: 'Capitol Glass & Glazing, Inc. — Proposal for Unitized Curtain Wall & Storefront — Meridian Office Tower, 1200 New York Ave NW, Washington D.C. — Rev. 2 dated March 10, 2024...',
    notes: 'Seed entry. High-quality proposal with clear scope, line items, and lead times.',
  },

  // ──────────────────────────────────────────────────────────
  // ENTRY 2 — Stick curtain wall bid tab (leveled, 3 subs)
  // ──────────────────────────────────────────────────────────
  {
    id: 'si-seed-002',
    document_id: 'seed-002',
    parsed_at: '2023-11-08T00:00:00.000Z',
    document_type: 'bid_tab',
    subcontractor_name: 'Bid Tab — 3 Bidders (Alpha, Bravo, Capitol)',
    project_name: 'Tysons Corner Mixed-Use Phase 2 — Building B',
    project_location: 'Tysons, Virginia',
    bid_date: '2023-11-01',

    glazing_systems: ['stick_curtain_wall', 'storefront', 'glass_railing'],
    total_sf_proposed: 28_600,
    total_price_proposed: 3_058_200,
    price_confidence: 'leveled',

    furnish_install: {
      material_by: 'sub',
      install_by: 'sub',
      notes: 'All three bidders priced full F&I. Engineering delegated to sub per spec Section 08 44 13.',
    },

    inclusions: [
      'Stick-built aluminum curtain wall — 2"×6" thermally broken system',
      'All framing, pressure plates, covers, and trims',
      'Insulated glass units — low-e, argon-filled',
      'Shop drawings and delegated structural engineering',
      'All labor, tools, and equipment for installation',
      'Scaffolding for floors 1 through 5 (all bidders included)',
      'Glass railing at Level 2 terraces (aluminum channel base)',
      'Perimeter sealant and backing rod',
    ],

    exclusions: [
      'Permits — by GC on all three bids',
      'Spandrel insulation — excluded by all three bidders',
      'Operable vents — noted as NIC (not in contract documents)',
      'Interior side perimeter drywall and trim — by GC',
      'Anchor testing by independent testing lab — by Owner',
    ],

    line_items: [
      {
        id: 'li-001',
        description: 'Stick curtain wall — Floors 1–5 (leveled average)',
        normalized_description: 'Stick curtain wall — leveled bid',
        glazing_system_category: 'stick_curtain_wall',
        quantity: 26_100,
        unit: 'SF',
        unit_price: 107,
        extended_price: 2_792_700,
        price_confidence: 'leveled',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
        notes: 'Alpha: $98/SF, Bravo: $112/SF, Capitol: $111/SF. Leveled mid-point used.',
      },
      {
        id: 'li-002',
        description: 'Glass railing at terraces — Level 2',
        normalized_description: 'Glass railing — Level 2 terraces',
        glazing_system_category: 'glass_railing',
        quantity: 680,
        unit: 'LF',
        unit_price: 385,
        extended_price: 261_800,
        price_confidence: 'leveled',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
        notes: 'All three bidders included rail. Range: $345–$420/LF.',
      },
      {
        id: 'li-003',
        description: 'Lobby storefront entries — 4 locations',
        normalized_description: 'Lobby storefront',
        glazing_system_category: 'storefront',
        quantity: 280,
        unit: 'SF',
        unit_price: 13,
        extended_price: 3_700,
        price_confidence: 'leveled',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
        notes: 'Small storefront scope included at nominal cost in all three bids.',
      },
    ],

    lead_times: [
      {
        item: 'Curtain wall framing extrusions',
        weeks_min: 10,
        weeks_max: 12,
        weeks_typical: 11,
        clock_start: 'from purchase order',
      },
      {
        item: 'Insulating glass units',
        weeks_min: 6,
        weeks_max: 8,
        weeks_typical: 7,
        clock_start: 'from approved shop drawings',
      },
    ],

    mobilization: {
      included: true,
      notes: 'Scaffolding and mob included by all three bidders. Alpha and Capitol included scaffold in base; Bravo added $18,000 scaffold line item.',
    },

    access_assumptions: [
      {
        method: 'scaffold',
        provided_by: 'sub',
        floor_range: 'Floors 1–5',
        included_in_price: true,
        assumptions_stated: ['Scaffolding included by all three bidders for floors 1–5 access.'],
      },
    ],

    warranty: {
      scope: 'Workmanship and weathertightness',
      years: 2,
      labor_included: true,
      material_included: true,
      glass_breakage_excluded: true,
      notes: 'Standard 2-year workmanship warranty on all three proposals.',
    },

    risks: [
      {
        id: 'prf-001',
        category: 'scope_gap',
        severity: 'High',
        description: 'Spandrel insulation excluded by all three bidders. Creates thermal bridging risk if GC does not assign this scope.',
        recommendation: 'Assign spandrel insulation explicitly in subcontract or GC self-perform scope matrix. Check energy compliance documentation.',
      },
      {
        id: 'prf-002',
        category: 'exclusion_risk',
        severity: 'Medium',
        description: 'Bid spread of 14% ($98–$112/SF) on stick CW. Alpha\'s low number warrants scope clarification.',
        recommendation: 'Scope-level Alpha\'s bid before award. Verify scaffold, engineering, and warranty inclusions match Bravo and Capitol.',
      },
    ],

    parse_method: 'manual',
    parse_confidence: 'high',
    raw_text_snippet: 'Bid Tab — Tysons Corner Mixed-Use Phase 2 Building B — Stick Curtain Wall / Glass Railing. Three bidders. Bid date: November 1, 2023...',
    notes: 'Leveled bid tab. Alpha excluded scaffold per scope clarification — adjusted to match others.',
  },

  // ──────────────────────────────────────────────────────────
  // ENTRY 3 — Fire-rated glazing RFQ response, MD school
  // ──────────────────────────────────────────────────────────
  {
    id: 'si-seed-003',
    document_id: 'seed-003',
    parsed_at: '2023-06-20T00:00:00.000Z',
    document_type: 'rfq_response',
    subcontractor_name: 'Mid-Atlantic Fire Glass Specialists LLC',
    project_name: 'Montgomery County Public Schools — Whitman High School Modernization',
    project_location: 'Bethesda, Maryland',
    bid_date: '2023-06-15',
    quote_valid_until: '2023-07-15',

    glazing_systems: ['fire_rated', 'storefront'],
    total_sf_proposed: 3_840,
    total_price_proposed: 706_560,
    price_confidence: 'proposed',

    furnish_install: {
      material_by: 'sub',
      install_by: 'sub',
      notes: 'Full F&I including specialty framing. Prevailing wage applies per Maryland state law.',
    },

    inclusions: [
      'Fire-rated glazing assemblies — 20-minute and 45-minute ratings per schedule',
      'Specialty aluminum framing with intumescent seals',
      'Fire-rated glass: Pilkington Pyrostop and SuperLite II-XL per spec',
      'All labor at prevailing wage rates (Maryland PWA applies)',
      'Required fire protection testing per NFPA 257 (factory certification, not field test)',
      'Perimeter firestop sealant at all rated assemblies',
      'Hardware and closers for rated door lites — by sub',
      'Shop drawings and fire rating documentation package',
    ],

    exclusions: [
      'Permits — by GC',
      'Non-rated glazing (standard storefront) — by others unless noted',
      'Door frames (hollow metal) — by GC',
      'Drywall at perimeter of assemblies — by GC',
      'Field fire testing by third party — by Owner',
      'Future replacement glass — by Owner after warranty',
    ],

    line_items: [
      {
        id: 'li-001',
        description: '20-minute rated glazing assemblies — corridor locations',
        glazing_system_category: 'fire_rated',
        quantity: 2_640,
        unit: 'SF',
        unit_price: 162,
        extended_price: 427_680,
        price_confidence: 'proposed',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
      },
      {
        id: 'li-002',
        description: '45-minute rated glazing — stairwell enclosures and exit passageways',
        glazing_system_category: 'fire_rated',
        quantity: 1_200,
        unit: 'SF',
        unit_price: 190,
        extended_price: 228_000,
        price_confidence: 'proposed',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
        notes: '45-min assemblies use SuperLite II-XL. Higher cost reflects specialty glass and framing.',
      },
      {
        id: 'li-003',
        description: 'Standard storefront at main entry — included per RFQ scope',
        glazing_system_category: 'storefront',
        quantity: 480,
        unit: 'SF',
        unit_price: 105,
        extended_price: 50_400,
        price_confidence: 'proposed',
        furnish_install: 'furnish_and_install',
        included_in_base: false,
        is_alternate: true,
        alternate_description: 'Added as separate line per RFQ — may be deleted if storefront by other sub',
      },
    ],

    lead_times: [
      {
        item: 'Pilkington Pyrostop rated glass',
        weeks_min: 14,
        weeks_max: 18,
        weeks_typical: 16,
        clock_start: 'from approved shop drawings',
        notes: 'Limited North American sourcing for Pyrostop. Single US distributor (TGP). Early order critical.',
      },
      {
        item: 'SuperLite II-XL 45-min rated glass',
        weeks_min: 12,
        weeks_max: 16,
        weeks_typical: 14,
        clock_start: 'from purchase order',
        notes: 'O\'Keeffe\'s / Technical Glass Products. Lead time fluctuates.',
      },
    ],

    mobilization: {
      included: true,
      notes: 'Mobilization included. Occupied school — work restricted to summer months and evening/weekend windows per owner schedule.',
      phasing_notes: 'Phase 1 (summer 2023): corridors 1–3. Phase 2 (winter break 2023): stairwells.',
    },

    access_assumptions: [
      {
        method: 'scissor lift',
        provided_by: 'gc',
        included_in_price: false,
        assumptions_stated: [
          'Scissor lift by GC for high corridor locations above 10 ft',
          'Sub assumes safe, unobstructed access during scheduled work windows',
        ],
      },
    ],

    warranty: {
      scope: 'Fire-rated glazing assembly workmanship',
      years: 1,
      labor_included: true,
      material_included: false,
      glass_breakage_excluded: true,
      notes: '1-year workmanship warranty only. Glass manufacturer warranty covers seal failure separately. Note: fire-rated glass has no breakage warranty.',
    },

    risks: [
      {
        id: 'prf-001',
        category: 'schedule',
        severity: 'Critical',
        description: 'Specialty fire-rated glass lead times of 14–18 weeks leave zero float if procurement is delayed past June 15.',
        recommendation: 'Release Pyrostop order immediately upon award. Do not wait for permit or complete shop drawing approval — issue interim approval for glass procurement.',
      },
      {
        id: 'prf-002',
        category: 'compliance',
        severity: 'High',
        description: 'Maryland Prevailing Wage Act applies. All glazier labor must comply with current DLLR wage determinations.',
        recommendation: 'Confirm sub\'s payroll compliance program. Require certified payroll submittals monthly. Non-compliance on a school project carries significant owner liability.',
      },
      {
        id: 'prf-003',
        category: 'scope_gap',
        severity: 'High',
        description: 'Occupied school with restricted access windows. Work confined to summer and winter break. Any schedule slip extends project by a full academic semester.',
        recommendation: 'Build access window schedule into subcontract milestone dates with liquidated damages. Verify school calendar with owner before execution.',
      },
    ],

    parse_method: 'manual',
    parse_confidence: 'high',
    raw_text_snippet: 'Mid-Atlantic Fire Glass Specialists LLC — RFQ Response — Montgomery County Public Schools Whitman High School Modernization — Fire-Rated Glazing...',
    notes: 'Fire-rated specialty scope. High procurement risk due to long lead specialty glass. Maryland prevailing wage confirmed.',
  },

  // ──────────────────────────────────────────────────────────
  // ENTRY 4 — Subcontract exhibit (awarded scope, confirmed F&I)
  // ──────────────────────────────────────────────────────────
  {
    id: 'si-seed-004',
    document_id: 'seed-004',
    parsed_at: '2024-01-22T00:00:00.000Z',
    document_type: 'subcontract_exhibit',
    subcontractor_name: 'Chesapeake Glazing Systems, Inc.',
    project_name: 'Bethesda Metro Plaza — Mixed-Use Tower',
    project_location: 'Bethesda, Maryland',
    bid_date: '2023-10-15',
    revision: 'Executed Subcontract — January 2024',

    glazing_systems: ['unitized_curtain_wall', 'storefront', 'glass_railing', 'skylight'],
    total_sf_proposed: 67_200,
    total_price_proposed: 8_292_000,
    price_confidence: 'awarded',

    furnish_install: {
      material_by: 'sub',
      install_by: 'sub',
      material_percentage: 61,
      labor_percentage: 39,
      notes: 'Executed subcontract. Full F&I scope. Maryland prevailing wage confirmed in subcontract Section 4.3.',
    },

    inclusions: [
      'Unitized curtain wall — full building envelope floors 3–18',
      'Ground level aluminum storefront — lobby and retail base',
      'Glass railing at roof terrace (Level 19)',
      'Skylight at Level 19 amenity deck — structural silicone set',
      'All delegated engineering (PE stamp, wind/gravity/seismic)',
      'AAMA 501.2 water infiltration test — 5 locations minimum',
      'Swing stage rigging and operation — all upper floor elevations',
      'Material staging area on Level P1 per GC logistics plan',
      'MDW-compliant installation for Davis-Bacon scope',
      '2-year weathertightness warranty, 5-year manufacturer IGU warranty assigned to Owner',
    ],

    exclusions: [
      'Slab edge tolerances greater than ±3/4" — GC to correct prior to glazing start',
      'Firestopping at slab lines — by GC (spec section 07 84 13)',
      'Spandrel insulation behind opaque spandrel panels — by GC',
      'Building permits and glazing subpermit — by GC',
      'Aluminum finish touch-up from other trade damage after sub\'s punch list acceptance',
      'Replacement of glass broken by others after sub\'s substantial completion',
      'Skylight drainage modification if roofing membrane changes after skylight installation',
    ],

    line_items: [
      {
        id: 'li-001',
        description: 'Unitized curtain wall — Floors 3–18 (64,200 SF)',
        glazing_system_category: 'unitized_curtain_wall',
        quantity: 64_200,
        unit: 'SF',
        unit_price: 122,
        extended_price: 7_832_400,
        price_confidence: 'awarded',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
      },
      {
        id: 'li-002',
        description: 'Ground floor storefront — Lobby and retail (1,840 SF)',
        glazing_system_category: 'storefront',
        quantity: 1_840,
        unit: 'SF',
        unit_price: 88,
        extended_price: 161_920,
        price_confidence: 'awarded',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
      },
      {
        id: 'li-003',
        description: 'Glass railing — Level 19 roof terrace (920 LF)',
        glazing_system_category: 'glass_railing',
        quantity: 920,
        unit: 'LF',
        unit_price: 195,
        extended_price: 179_400,
        price_confidence: 'awarded',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
      },
      {
        id: 'li-004',
        description: 'Skylight — Level 19 amenity deck (240 SF)',
        glazing_system_category: 'skylight',
        quantity: 240,
        unit: 'SF',
        unit_price: 245,
        extended_price: 58_800,
        price_confidence: 'awarded',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
      },
      {
        id: 'li-005',
        description: 'Allowance — slab edge tolerance repairs (unforeseen)',
        quantity: 1,
        unit: 'LS',
        extended_price: 59_480,
        price_confidence: 'awarded',
        furnish_install: 'furnish_and_install',
        included_in_base: true,
        notes: 'Negotiated allowance for anticipated substrate corrections. Unused balance returned to GC at close.',
      },
    ],

    lead_times: [
      {
        item: 'Unitized curtain wall panels',
        weeks_min: 16,
        weeks_max: 20,
        weeks_typical: 18,
        clock_start: 'from approved shop drawings',
        notes: 'YKK AP factory. 18-week target built into construction schedule milestone.',
      },
      {
        item: 'Skylight structural silicone kit',
        weeks_min: 6,
        weeks_max: 8,
        weeks_typical: 7,
        clock_start: 'from purchase order',
      },
    ],

    mobilization: {
      included: true,
      trips_assumed: 4,
      phasing_notes: 'Four phased mobilizations per floor sequence. Level P1 staging area locked per GC logistics plan.',
      notes: 'Swing stage mobilization included. GC responsible for roof header beam welding points prior to sub mobilization.',
    },

    access_assumptions: [
      {
        method: 'swing stage',
        provided_by: 'sub',
        floor_range: 'Floors 3–18',
        included_in_price: true,
        assumptions_stated: [
          'All swing stage rigging, certification, and operation by sub',
          'GC to provide roof anchor/header beam welding per sub\'s engineering drawing',
          'Ground-level barricade and pedestrian protection by GC',
        ],
      },
      {
        method: 'scissor lift',
        provided_by: 'gc',
        floor_range: 'Ground floor',
        included_in_price: false,
        assumptions_stated: ['GC to provide aerial lift for Level 1 storefront and Level 19 skylight'],
      },
    ],

    warranty: {
      scope: 'System weathertightness, workmanship, and finish',
      years: 2,
      labor_included: true,
      material_included: true,
      glass_breakage_excluded: true,
      notes: '2-year system warranty. 5-year IGU manufacturer warranty (Guardian) assigned to Owner at project closeout. Finish warranty per manufacturer schedule.',
    },

    risks: [
      {
        id: 'prf-001',
        category: 'schedule',
        severity: 'Medium',
        description: 'Panel lead time 16–20 weeks. GC schedule shows Level 3 install start 22 weeks from NTP — 4-week float only.',
        recommendation: 'Submit shop drawings within 1 week of NTP. Track approval response times. Escalate to GC PM if reviews exceed 10 business days.',
      },
      {
        id: 'prf-002',
        category: 'scope_gap',
        severity: 'Low',
        description: 'Skylight drainage coordination with roofing membrane not addressed until Level 19 GMP scope is finalized.',
        recommendation: 'Confirm roofing contractor\'s membrane termination detail at skylight curb before skylight shop drawing submission.',
      },
    ],

    parse_method: 'manual',
    parse_confidence: 'high',
    raw_text_snippet: 'SUBCONTRACT EXHIBIT A — Scope of Work — Chesapeake Glazing Systems, Inc. — Bethesda Metro Plaza — January 2024 Executed...',
    notes: 'Executed subcontract. Pricing is awarded/verified. $122/SF unitized CW is strong MD benchmark for 2023–2024 market. Maryland prevailing wage confirmed.',
  },
];

// ── Lookup helpers ────────────────────────────────────────────

export const getProcurementIntelligenceById = (id: string): ScopeIntelligence | undefined =>
  procurementIntelligenceEntries.find(e => e.id === id);

export const getProcurementIntelligenceByWorkType = (workTypeId: string): ScopeIntelligence[] =>
  procurementIntelligenceEntries.filter(e => e.glazing_systems.includes(workTypeId));

export const getProcurementIntelligenceByRegion = (region: string): ScopeIntelligence[] => {
  const regionKeywords: Record<string, string[]> = {
    dc: ['washington', 'd.c.', 'district of columbia'],
    maryland: ['maryland', 'bethesda', 'montgomery', 'silver spring', 'rockville', 'baltimore'],
    nova: ['virginia', 'tysons', 'arlington', 'fairfax', 'reston', 'loudoun', 'mclean'],
  };
  const keywords = regionKeywords[region] ?? [region];
  return procurementIntelligenceEntries.filter(e =>
    keywords.some(kw =>
      e.project_location?.toLowerCase().includes(kw)
    )
  );
};

export const getAwardedProcurementEntries = (): ScopeIntelligence[] =>
  procurementIntelligenceEntries.filter(e => e.price_confidence === 'awarded');
