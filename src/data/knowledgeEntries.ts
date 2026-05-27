// ============================================================
// KNOWLEDGE BASE — Structured domain knowledge entries
// Feeds: narrative engine, risk engine, AI advisor context
// RULE: can_affect_price=true only for historical_bid entries
//       with a verified pricing SourceRecord
// ============================================================

import type { KnowledgeEntry, ScopeIntelligence } from '@/types';
import { procurementIntelligenceEntries } from '@/data/procurementIntelligence';

export const knowledgeEntries: KnowledgeEntry[] = [

  // ──────────────────────────────────────────
  // HISTORICAL BID ACTUALS — DMV Market
  // ──────────────────────────────────────────
  {
    id: 'kb-bid-001',
    category: 'historical_bid',
    title: 'DC Office Tower Unitized Curtain Wall — 2023 Bid',
    body: 'A 22-story Class A office tower in downtown Washington D.C. received three competitive bids for unitized curtain wall in Q3 2023. Bid range was $118–$134/SF installed for a standard high-performance unitized system with triple silver low-e glass. The spread reflected differing labor strategies and framing steel procurement lead times. The awarded contractor priced at $121/SF. Project was Davis-Bacon with prevailing wage for DC jurisdiction.',
    applies_to_work_types: ['unitized_curtain_wall'],
    applies_to_regions: ['dc'],
    source_id: 'src-cdc-dmv-bid-data-2023',
    can_affect_price: true,
    effective_date: '2023-09-01',
    expiry_date: '2026-09-01',
    tags: ['unitized', 'dc', 'davis-bacon', 'office', 'high-rise'],
  },
  {
    id: 'kb-bid-002',
    category: 'historical_bid',
    title: 'Northern Virginia Corporate Campus — Storefront & Curtain Wall — 2024',
    body: 'A three-building corporate campus in Tysons Corner, Virginia, was bid in early 2024. Storefront systems (ground level) came in at $68–$82/SF installed. Stick-frame curtain wall for floors 2–8 ranged from $95–$112/SF. The lower end of both ranges reflects private wage (non-prevailing) with efficient new construction access. Virginia does not impose state prevailing wage for private projects.',
    applies_to_work_types: ['storefront', 'stick_curtain_wall'],
    applies_to_regions: ['nova'],
    source_id: 'src-cdc-dmv-bid-data-2023',
    can_affect_price: true,
    effective_date: '2024-02-01',
    expiry_date: '2027-02-01',
    tags: ['storefront', 'curtain-wall', 'nova', 'private', 'corporate', 'new-construction'],
  },
  {
    id: 'kb-bid-003',
    category: 'historical_bid',
    title: 'Maryland Public School — Fire-Rated Glazing — 2023',
    body: 'A Maryland public school modernization project required fire-rated glazing in corridor and stairwell locations. Bids for 20-minute and 45-minute rated assemblies ranged from $148–$195/SF installed, significantly above standard storefront due to specialty framing requirements and limited supplier availability in the Mid-Atlantic. Maryland prevailing wage applied. Lead times were 14–18 weeks from three specialty fabricators.',
    applies_to_work_types: ['fire_rated'],
    applies_to_regions: ['maryland'],
    source_id: 'src-cdc-dmv-bid-data-2023',
    can_affect_price: true,
    effective_date: '2023-05-01',
    expiry_date: '2026-05-01',
    tags: ['fire-rated', 'maryland', 'public', 'school', 'prevailing-wage'],
  },
  {
    id: 'kb-bid-004',
    category: 'historical_bid',
    title: 'DC Federal Office Building — Blast-Resistant Glazing — 2024',
    body: 'A federal office modernization project in Washington D.C. required blast-resistant glazing per GSA PBS-P100 and ISC Security Design Criteria. Final contract value for blast-resistant curtain wall was $248/SF installed, reflecting the premium for blast-film laminated glass, specialized silicone-set framing, and the limited number of contractors with GSA security clearance. Davis-Bacon prevailing wage applied.',
    applies_to_work_types: ['blast_security'],
    applies_to_regions: ['dc'],
    source_id: 'src-cdc-dmv-bid-data-2023',
    can_affect_price: true,
    effective_date: '2024-01-01',
    expiry_date: '2027-01-01',
    tags: ['blast', 'federal', 'dc', 'davis-bacon', 'GSA', 'security'],
  },

  // ──────────────────────────────────────────
  // MARKET INTELLIGENCE
  // ──────────────────────────────────────────
  {
    id: 'kb-mkt-001',
    category: 'market_intel',
    title: 'DMV Glazing Market Conditions — 2024–2025',
    body: 'The DMV commercial glazing market entered 2024 with sustained demand driven by federal leasehold improvements, data center construction in Northern Virginia, and ongoing mixed-use development in the D.C. suburbs. Subcontractor capacity remained tight through mid-2024 due to workforce shortages in the glazier trades. Estimators should apply a 3–5% market premium for projects bidding in competitive windows (Q2 and Q4). Material lead times have stabilized but aluminum extrusion pricing remains elevated approximately 8–12% above 2022 baseline levels.',
    applies_to_work_types: [],
    applies_to_regions: ['dc', 'maryland', 'nova'],
    source_id: 'src-cdc-dmv-bid-data-2023',
    can_affect_price: false,
    effective_date: '2024-01-01',
    expiry_date: '2025-12-31',
    tags: ['market', 'dmv', '2024', 'capacity', 'lead-times'],
  },
  {
    id: 'kb-mkt-002',
    category: 'market_intel',
    title: 'Aluminum Extrusion Pricing Trend — 2023–2025',
    body: 'Aluminum extrusion pricing for architectural grades (6063-T5, 6061-T6) peaked in late 2022 at roughly 40% above pre-pandemic levels, then corrected to approximately 12–18% above 2019 baseline through 2023–2024. Curtain wall and storefront system pricing tracked this movement with a 3–6 month lag due to manufacturer quoting cycles. As of mid-2024, market pricing has largely stabilized. The RSMeans 2024 benchmark data captures this stabilized pricing, but contractors should verify current mill quotes for projects with estimated start dates beyond 12 months.',
    applies_to_work_types: ['storefront', 'stick_curtain_wall', 'unitized_curtain_wall', 'window_wall'],
    applies_to_regions: [],
    source_id: 'src-rsmeans-2024',
    can_affect_price: false,
    effective_date: '2024-01-01',
    expiry_date: '2025-12-31',
    tags: ['aluminum', 'material', 'escalation', 'extrusion', 'pricing'],
  },
  {
    id: 'kb-mkt-003',
    category: 'market_intel',
    title: 'Northern Virginia Data Center Glazing Demand',
    body: 'The Northern Virginia data center corridor (Loudoun County, Prince William County) represents one of the highest-density construction markets in the eastern United States. While data centers typically use limited exterior glazing, associated campus buildings and administrative facilities frequently require high-performance curtain wall systems. Contractor capacity in this submarket is frequently constrained, and competitive premiums of 10–15% above standard DMV pricing are not uncommon. Factor in extended lead times for projects in the I-95 corridor data center zone.',
    applies_to_work_types: ['stick_curtain_wall', 'unitized_curtain_wall'],
    applies_to_regions: ['nova'],
    source_id: 'src-cdc-dmv-bid-data-2023',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['nova', 'data-center', 'capacity', 'premium'],
  },

  // ──────────────────────────────────────────
  // CODE & COMPLIANCE REQUIREMENTS
  // ──────────────────────────────────────────
  {
    id: 'kb-code-001',
    category: 'code_requirement',
    title: 'DC Building Code — DCMR Title 12 Glazing Requirements',
    body: 'Washington D.C. adopts the International Building Code (IBC) with local amendments under DCMR Title 12. Glazed assemblies in D.C. must comply with ASTM E1300 for wind load performance and ASTM E2112 for sealant installation. D.C. enforces ASHRAE 90.1 energy compliance, requiring minimum visible transmittance (VT) and solar heat gain coefficient (SHGC) performance for commercial buildings. Third-party special inspection is required for curtain wall and storefront systems on structures over 35 feet. Estimators should include allowances for DCRA permit fees and the mandatory third-party inspection program.',
    applies_to_work_types: ['storefront', 'stick_curtain_wall', 'unitized_curtain_wall'],
    applies_to_regions: ['dc'],
    source_id: 'src-ibc-2021',
    can_affect_price: false,
    effective_date: '2023-01-01',
    tags: ['dc', 'code', 'IBC', 'ASHRAE', 'inspection', 'permit'],
  },
  {
    id: 'kb-code-002',
    category: 'code_requirement',
    title: 'Maryland Prevailing Wage Act — Glazing Scope',
    body: 'The Maryland Prevailing Wage Act (Labor & Employment Article §17-201 et seq.) applies to public works contracts with a contract value exceeding $500,000 where 25% or more of the funding comes from the State of Maryland. Glazing subcontractors on covered projects must pay glaziers the published Maryland prevailing wage rate for the applicable county. As of 2024, glazier rates in Montgomery, Prince George\'s, and Anne Arundel counties range from $58–$68/hour (including fringes). Certified payroll, apprenticeship requirements, and wage determination posting apply.',
    applies_to_work_types: [],
    applies_to_regions: ['maryland'],
    source_id: 'src-davis-bacon',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['maryland', 'prevailing-wage', 'compliance', 'labor', 'public-works'],
  },
  {
    id: 'kb-code-003',
    category: 'code_requirement',
    title: 'GSA PBS-P100 — Federal Facility Security for Glazing',
    body: 'The GSA Facilities Standards for the Public Buildings Service (PBS-P100) sets minimum physical security requirements for federal buildings. For glazing, the ISC Security Design Criteria defines five security levels (I–V) with corresponding blast and forced-entry resistance requirements. Level III and above typically require blast-resistant glazing with interlayer laminated glass and specialized framing. Delegated structural engineering and blast consulting are mandatory for all Level III+ projects. Glazing contractors must demonstrate relevant experience and may require facility security clearance for construction access.',
    applies_to_work_types: ['blast_security'],
    applies_to_regions: ['dc'],
    source_id: 'src-ibc-2021',
    can_affect_price: false,
    effective_date: '2023-01-01',
    tags: ['federal', 'GSA', 'blast', 'security', 'PBS-P100', 'ISC'],
  },

  // ──────────────────────────────────────────
  // LABOR MARKET INTELLIGENCE
  // ──────────────────────────────────────────
  {
    id: 'kb-labor-001',
    category: 'labor_market',
    title: 'DMV Glazier Trade Availability — 2024',
    body: 'The DC metropolitan area glazier market (represented by IUPAT District Council 51 and local unions including Glaziers Local 1075 and Glass Workers Local 252) maintained a tightened labor supply through 2024. New apprenticeship enrollments have increased but journeyman glaziers remain in high demand, particularly for high-rise and occupied building work requiring specialized rigging and swing stage experience. Contractors bidding occupied building or high-rise projects should verify crew availability before committing to compressed schedules. Non-union shops face additional competition for experienced glaziers who may command wage premiums above base rates.',
    applies_to_work_types: [],
    applies_to_regions: ['dc', 'maryland', 'nova'],
    source_id: 'src-cdc-dmv-bid-data-2023',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['labor', 'glazier', 'dmv', 'availability', 'union', 'capacity'],
  },
  {
    id: 'kb-labor-002',
    category: 'labor_market',
    title: 'Occupied Building Labor Premium Justification',
    body: 'Work in occupied buildings imposes measurable productivity losses that are well-documented in industry data. RSMeans and MCAA both quantify occupied building inefficiency at 20–35% additional labor hours depending on access restriction severity, noise/dust control requirements, and shift work mandates. In a hospital or school, access windows may be limited to nights and weekends, effectively doubling the calendar duration for equivalent work. Estimators must verify the occupied building protocol with the owner or GC before bid — "occupied" ranges from mild (daytime work, minor occupant coordination) to extreme (night shifts, hermetic dust barriers, security escort).',
    applies_to_work_types: [],
    applies_to_regions: [],
    source_id: 'src-rsmeans-2024',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['labor', 'occupied', 'productivity', 'inefficiency', 'hospital', 'school'],
  },

  // ──────────────────────────────────────────
  // MATERIAL MARKET INTELLIGENCE
  // ──────────────────────────────────────────
  {
    id: 'kb-mat-001',
    category: 'material_market',
    title: 'High-Performance Glass Lead Times — 2024',
    body: 'Insulating glass units (IGUs) with high-performance coatings — triple silver low-e, electrochromic, or PDLC switchable glass — carry fabrication lead times of 10–16 weeks from domestic fabricators and 16–22 weeks from European sources as of 2024. Specialty glass (fire-rated, blast-resistant, acoustic laminated) from specialist fabricators may extend to 18–26 weeks. These lead times directly impact project schedule and require early procurement coordination. Failure to buy out glass within 4 weeks of contract award on a fast-track project is a recognized schedule risk. Cost premiums for expediting specialty glass are typically 15–30% above standard lead time pricing.',
    applies_to_work_types: ['unitized_curtain_wall', 'fire_rated', 'blast_security'],
    applies_to_regions: [],
    source_id: 'src-nfrc-technical',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['glass', 'lead-time', 'IGU', 'specialty', 'procurement', 'schedule'],
  },
  {
    id: 'kb-mat-002',
    category: 'material_market',
    title: 'Structural Silicone and Sealant Material Costs',
    body: 'Structural silicone sealants (Dow 795, Sika SG-20 type) are a significant cost component in curtain wall and storefront assemblies. Material costs for structural silicone have increased approximately 18–22% over 2021 baseline pricing due to raw silicone supply chain disruptions. A typical mid-rise curtain wall project consumes 0.05–0.10 gallons of structural silicone per SF of glazed area. Unit sealant costs should be verified with current distributor pricing for large projects. Weatherseal and cap bead silicone (GE SCS2000 type) follows a similar pricing trend.',
    applies_to_work_types: ['stick_curtain_wall', 'unitized_curtain_wall', 'storefront'],
    applies_to_regions: [],
    source_id: 'src-rsmeans-2024',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['silicone', 'sealant', 'material', 'cost', 'curtain-wall'],
  },

  // ──────────────────────────────────────────
  // SPEC NOTES & LESSONS LEARNED
  // ──────────────────────────────────────────
  {
    id: 'kb-spec-001',
    category: 'spec_note',
    title: 'Delegated Design Requirements in Curtain Wall Specs',
    body: 'Many contemporary architectural curtain wall specifications require the glazing subcontractor to provide delegated structural engineering (EOR of record defers curtain wall structural design to the contractor\'s engineer). This means the subcontractor must engage a licensed PE to produce stamped shop drawings and calculations. Delegated design fees for a mid-rise curtain wall project typically range from $25,000–$80,000 depending on system complexity and jurisdictional requirements. This cost is frequently overlooked in competitive bids and should be explicitly included as a line item or confirmed as an exclusion. Do not assume the design is fully engineered by the architect.',
    applies_to_work_types: ['stick_curtain_wall', 'unitized_curtain_wall'],
    applies_to_regions: [],
    source_id: 'src-nfrc-technical',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['spec', 'delegated-design', 'engineering', 'shop-drawings', 'PE'],
  },
  {
    id: 'kb-spec-002',
    category: 'spec_note',
    title: 'Water Infiltration Testing Requirements — AAMA 501.2',
    body: 'Curtain wall and storefront specifications on most commercial projects require field water infiltration testing per AAMA 501.2 (spray rack method) or AAMA 502 (uniform static air pressure difference method). Testing is typically required at a minimum of one bay per floor or at least 10% of total glazed area. Third-party testing firms in the DMV market charge $3,500–$7,500 per testing day inclusive of mobilization and reporting. Failure rates on first test are not uncommon in complex renovation or fast-tracked projects; budget for one re-test per project. Testing is an owner-directed activity but the contractor bears the cost of failed assemblies.',
    applies_to_work_types: ['stick_curtain_wall', 'unitized_curtain_wall', 'storefront'],
    applies_to_regions: [],
    source_id: 'src-nfrc-technical',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['testing', 'water-infiltration', 'AAMA', 'quality', 'spec'],
  },
  {
    id: 'kb-spec-003',
    category: 'spec_note',
    title: 'Interior Glazed Partition Acoustic Performance',
    body: 'Interior glazed partitions (demountable or fixed) specified for open office and conference environments frequently require STC ratings of 38–50. Meeting these ratings requires laminated glass, properly gasketed frames, and careful acoustic detailing at the head and sill conditions. Contractors often find that standard partition systems meeting visual requirements fail acoustic tests when the perimeter sealing is inadequate. Include allowances for acoustic consultant review and potential remediation (typically $2–$5/SF of partition area) when STC ratings above 42 are required. Budget for a minimum of one acoustic test per distinct partition type.',
    applies_to_work_types: ['interior_partition'],
    applies_to_regions: [],
    source_id: 'src-nfrc-technical',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['interior', 'acoustic', 'STC', 'partition', 'testing'],
  },

  // ──────────────────────────────────────────
  // RISK INTELLIGENCE (Lessons Learned)
  // ──────────────────────────────────────────
  {
    id: 'kb-risk-001',
    category: 'risk_intel',
    title: 'Renovation Scope Creep — Existing Condition Discovery',
    body: 'Renovation glazing projects in the DMV carry a consistent pattern of scope growth driven by existing condition discovery. In buildings constructed before 2000, substrates behind existing curtain wall frequently contain deteriorated waterproofing, corroded embedments, and non-conforming structural backup. A reasonable contingency for renovation glazing is 12–18% (versus the standard 5–8% for new construction). Projects in occupied federal buildings or historic structures should budget 15–20% contingency. Best practice: require a pre-bid survey of at least 5–10% of existing openings before committing to a firm price on a lump-sum renovation contract.',
    applies_to_work_types: [],
    applies_to_regions: [],
    source_id: 'src-cdc-dmv-bid-data-2023',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['renovation', 'risk', 'contingency', 'existing-conditions', 'scope-creep'],
  },
  {
    id: 'kb-risk-002',
    category: 'risk_intel',
    title: 'High-Rise Swing Stage Risk and Insurance',
    body: 'Exterior glazing above the 7th floor requiring swing stage or powered industrial rope descent systems carries significantly higher insurance costs, OSHA compliance burden, and productivity factors than platform or scissor lift work. Glaziers certified for rope descent must maintain current OSHA 1926.502 training. In the DMV market, swing stage glazing crews command a labor premium of $8–$15/hour above standard glazier rates. General liability and workers compensation premiums increase substantially for high-rise work. Verify with your insurance broker before bid. Do not underestimate the daily setup/teardown time for swing stage operations — it can consume 1.5–2.5 hours of crew time per day.',
    applies_to_work_types: ['stick_curtain_wall', 'unitized_curtain_wall'],
    applies_to_regions: [],
    source_id: 'src-rsmeans-2024',
    can_affect_price: false,
    effective_date: '2024-01-01',
    tags: ['high-rise', 'swing-stage', 'risk', 'insurance', 'OSHA', 'labor'],
  },
];

// ── Convert a ScopeIntelligence entry to a KnowledgeEntry ────
// Inline conversion avoids importing the full procurementParser module

function procurementToKnowledge(si: ScopeIntelligence): KnowledgeEntry {
  const systemNames = si.glazing_systems.join(', ') || 'glazing';
  const priceNote = si.total_price_proposed
    ? ` Total ${si.price_confidence} price: $${si.total_price_proposed.toLocaleString()}.`
    : '';
  const sfNote = si.total_sf_proposed
    ? ` Scope: ${si.total_sf_proposed.toLocaleString()} SF.`
    : '';
  const subNote = si.subcontractor_name ? ` Sub: ${si.subcontractor_name}.` : '';

  const inclText = si.inclusions.length > 0
    ? ` Inclusions: ${si.inclusions.slice(0, 4).join('; ')}.`
    : '';
  const exclText = si.exclusions.length > 0
    ? ` Exclusions: ${si.exclusions.slice(0, 4).join('; ')}.`
    : '';
  const ltText = si.lead_times.length > 0
    ? ` Lead times: ${si.lead_times.map(lt => `${lt.item} ${lt.weeks_min}–${lt.weeks_max ?? lt.weeks_typical}w`).join('; ')}.`
    : '';
  const riskText = si.risks.filter(r => r.severity === 'Critical' || r.severity === 'High').length > 0
    ? ` Risks: ${si.risks.filter(r => r.severity === 'Critical' || r.severity === 'High').map(r => r.description).slice(0, 2).join('; ')}.`
    : '';

  const locationToRegion = (loc?: string): string => {
    if (!loc) return '';
    const l = loc.toLowerCase();
    if (l.includes('virginia') || l.includes('tysons') || l.includes('arlington') || l.includes('fairfax')) return 'nova';
    if (l.includes('maryland') || l.includes('bethesda') || l.includes('montgomery')) return 'maryland';
    if (l.includes('d.c.') || l.includes('washington') || l.includes('district')) return 'dc';
    return '';
  };

  const region = locationToRegion(si.project_location);

  return {
    id: `kb-proc-${si.document_id}`,
    category: 'historical_scope_intelligence',
    title: `${si.document_type.replace(/_/g, ' ')} — ${si.project_name ?? 'Unnamed Project'}${subNote}`,
    body: [
      `${si.document_type.replace(/_/g, ' ')} for ${si.project_name ?? 'an unnamed project'}.${subNote}`,
      `Systems: ${systemNames}.${sfNote}${priceNote}`,
      inclText, exclText, ltText, riskText,
    ].filter(Boolean).join(' '),
    applies_to_work_types: si.glazing_systems,
    applies_to_regions: region ? [region] : [],
    source_id: si.price_confidence === 'awarded' || si.price_confidence === 'historical'
      ? 'src-cdc-dmv-bid-data-2023'
      : 'src-proc-intel',
    can_affect_price: si.price_confidence === 'awarded' || si.price_confidence === 'historical',
    effective_date: si.bid_date ?? si.parsed_at.slice(0, 10),
    tags: ['procurement', si.document_type, si.price_confidence, ...si.glazing_systems],
  };
}

// ── Procurement intelligence as KnowledgeEntry array ─────────

const procurementKnowledge: KnowledgeEntry[] =
  procurementIntelligenceEntries.map(procurementToKnowledge);

// ── Helper: get knowledge entries relevant to a specific estimate ──

export function getRelevantKnowledge(
  work_type_id: string,
  region_id: string,
  categories?: KnowledgeEntry['category'][]
): KnowledgeEntry[] {
  const allEntries = [...knowledgeEntries, ...procurementKnowledge];
  return allEntries.filter(entry => {
    const workTypeMatch = entry.applies_to_work_types.length === 0 ||
      entry.applies_to_work_types.includes(work_type_id);
    const regionMatch = entry.applies_to_regions.length === 0 ||
      entry.applies_to_regions.includes(region_id);
    const categoryMatch = !categories || categories.includes(entry.category);
    const notExpired = !entry.expiry_date || new Date(entry.expiry_date) > new Date();
    return workTypeMatch && regionMatch && categoryMatch && notExpired;
  });
}
