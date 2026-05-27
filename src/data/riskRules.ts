// ============================================================
// RISK RULES - Deterministic trigger conditions
// Source references inform rule rationale only — zero price authority.
// Each rule is evaluated by riskEngine.ts against estimate inputs/output.
// ============================================================

import type { RiskRule } from '@/types';

export const riskRules: RiskRule[] = [
  // ----------------------------------------------------------
  // PRICING RISKS
  // ----------------------------------------------------------
  {
    id: 'risk-below-market',
    category: 'Pricing',
    severity: 'High',
    trigger_condition: 'effective_per_sf < benchmark_low',
    message: 'Estimate is below the market low benchmark for this system and region.',
    recommendation: 'Review all inputs for missing scope items or understated multipliers. Pricing this low risks a loss-leader bid.',
    applicable_work_types: [],
    source_ids: ['src-cdc-dmv-bid-data-2023']
  },
  {
    id: 'risk-over-market',
    category: 'Market',
    severity: 'Medium',
    trigger_condition: 'effective_per_sf > benchmark_high * 1.15',
    message: 'Estimate is significantly above the market high benchmark.',
    recommendation: 'Ensure premium pricing is justifiable. Consider whether scope, conditions, or multipliers are overstated.',
    applicable_work_types: [],
    source_ids: ['src-cdc-dmv-bid-data-2023']
  },
  {
    id: 'risk-low-contingency',
    category: 'Pricing',
    severity: 'High',
    trigger_condition: 'contingency_pct < 0.03',
    message: 'Contingency is below the recommended 3% minimum for commercial glazing.',
    recommendation: 'Increase contingency to at least 3-5% for standard projects, 7-10% for renovation or occupied-building work.',
    applicable_work_types: [],
    source_ids: ['src-rsmeans-2024']
  },
  {
    id: 'risk-low-profit',
    category: 'Pricing',
    severity: 'Medium',
    trigger_condition: 'profit_pct < 0.08',
    message: 'Profit margin is below the industry standard minimum of 8% for specialty glazing.',
    recommendation: 'Commercial glazing contractors typically target 8-12% net profit. Review your cost structure.',
    applicable_work_types: [],
    source_ids: ['src-rsmeans-2024']
  },
  {
    id: 'risk-no-bond-federal',
    category: 'Compliance',
    severity: 'High',
    trigger_condition: 'project_type === federal_davis_bacon AND include_bond === false',
    message: 'Federal/Davis-Bacon projects typically require a performance and payment bond.',
    recommendation: 'Confirm bonding requirements in bid documents. Add bond cost (typically 0.5–1.5% of contract value).',
    applicable_work_types: [],
    source_ids: ['src-csi-div08-2024']
  },

  // ----------------------------------------------------------
  // PREVAILING WAGE RISKS
  // ----------------------------------------------------------
  {
    id: 'risk-davis-bacon-understate',
    category: 'Compliance',
    severity: 'Critical',
    trigger_condition: 'project_type === federal_davis_bacon AND labor_rate < davis_bacon_rate',
    message: 'Labor rate appears below Davis-Bacon prevailing wage for this jurisdiction.',
    recommendation: 'Verify current WD (Wage Determination) for this county. Underpaying Davis-Bacon wages is a federal violation with severe penalties.',
    applicable_work_types: [],
    source_ids: ['src-rsmeans-2024']
  },
  {
    id: 'risk-md-pw-understate',
    category: 'Compliance',
    severity: 'High',
    trigger_condition: 'project_type === maryland_public AND region IN [dc, montgomery_county, prince_georges, baltimore]',
    message: 'Maryland prevailing wage rates apply to this public project. Verify rates are included.',
    recommendation: 'Obtain current Maryland prevailing wage schedule from DLLR. Apply to all glazing trades.',
    applicable_work_types: [],
    source_ids: ['src-rsmeans-2024']
  },

  // ----------------------------------------------------------
  // SCHEDULE / PROCUREMENT RISKS
  // ----------------------------------------------------------
  {
    id: 'risk-unitized-lead-time',
    category: 'Schedule',
    severity: 'High',
    trigger_condition: 'work_type_id === unitized_curtain_wall',
    message: 'Unitized curtain wall requires 12-20 week lead time after approved shop drawings.',
    recommendation: 'Submit shop drawings immediately after contract award. Delays in approval directly push installation start.',
    applicable_work_types: ['unitized_curtain_wall'],
    source_ids: ['src-kawneer-2024']
  },
  {
    id: 'risk-blast-long-lead',
    category: 'Schedule',
    severity: 'High',
    trigger_condition: 'work_type_id === blast_security',
    message: 'Blast/security glazing requires 14-24 week lead time and pre-qualification.',
    recommendation: 'Identify and engage blast-rated glazing supplier immediately. Pre-qualification may be required for federal projects.',
    applicable_work_types: ['blast_security'],
    source_ids: ['src-kawneer-2024']
  },
  {
    id: 'risk-fire-rated-lead',
    category: 'Schedule',
    severity: 'Medium',
    trigger_condition: 'work_type_id === fire_rated',
    message: 'UL-listed fire-rated assemblies require 8-14 weeks lead time and cannot be modified after fabrication.',
    recommendation: 'Confirm all opening sizes and hourly ratings before ordering. No field cutting of fire-rated glass is permitted.',
    applicable_work_types: ['fire_rated'],
    source_ids: ['src-ibc-2021']
  },
  {
    id: 'risk-custom-glass-lead',
    category: 'Procurement',
    severity: 'Medium',
    trigger_condition: 'glass_type_id IN [blast_resistant, laminated_sgp, fire_rated_glass]',
    message: 'Specialty glass type selected has extended lead time and no substitution options.',
    recommendation: 'Confirm glass specification with owner/architect before ordering. Lead time can delay the entire project.',
    applicable_work_types: [],
    source_ids: ['src-gana-2023']
  },

  // ----------------------------------------------------------
  // TECHNICAL RISKS
  // ----------------------------------------------------------
  {
    id: 'risk-high-rise-complexity',
    category: 'Technical',
    severity: 'Medium',
    trigger_condition: 'access_condition IN [high_rise, swing_stage]',
    message: 'High-rise or swing-stage access adds significant complexity, cost, and schedule risk.',
    recommendation: 'Verify swing stage rigging points, building tie-in, and wind monitoring plan. Weather delays can be costly.',
    applicable_work_types: [],
    source_ids: ['src-gana-2023']
  },
  {
    id: 'risk-occupied-contingency',
    category: 'Technical',
    severity: 'Medium',
    trigger_condition: 'work_condition === occupied_building AND contingency_pct < 0.07',
    message: 'Occupied building work requires higher contingency — recommend 7-10% minimum.',
    recommendation: 'After-hours work, protection requirements, and owner coordination add significant unplanned cost in occupied buildings.',
    applicable_work_types: [],
    source_ids: ['src-rsmeans-2024']
  },
  {
    id: 'risk-renovation-unknowns',
    category: 'Technical',
    severity: 'Medium',
    trigger_condition: 'work_condition === renovation',
    message: 'Renovation work introduces existing condition unknowns not captured in this estimate.',
    recommendation: 'Conduct a pre-bid site visit. Identify existing frame conditions, substrate, and interface with adjacent work before finalizing price.',
    applicable_work_types: [],
    source_ids: ['src-rsmeans-2024']
  },
  {
    id: 'risk-skylight-drainage',
    category: 'Technical',
    severity: 'High',
    trigger_condition: 'work_type_id === skylight',
    message: 'Overhead glazing requires coordinated drainage design — not included in base estimate.',
    recommendation: 'Confirm drainage scope, overflow provisions, and structural support with GC before submitting price.',
    applicable_work_types: ['skylight'],
    source_ids: ['src-gana-2023']
  },
  {
    id: 'risk-fire-rated-assembly-mix',
    category: 'Compliance',
    severity: 'Critical',
    trigger_condition: 'work_type_id === fire_rated',
    message: 'Fire-rated glass and frame must be from the same UL-listed assembly.',
    recommendation: 'Do not mix manufacturers for fire-rated assemblies. Substitutions void the UL listing and create a code violation.',
    applicable_work_types: ['fire_rated'],
    source_ids: ['src-ibc-2021']
  },

  // ----------------------------------------------------------
  // MARKET / COMPETITIVE RISKS
  // ----------------------------------------------------------
  {
    id: 'risk-dc-prevailing-wage',
    category: 'Compliance',
    severity: 'High',
    trigger_condition: 'region_id === dc AND project_type === private',
    message: 'Washington D.C. has high union labor presence. Verify whether project requires DC prevailing wage.',
    recommendation: 'DC private projects often use union-rate glaziers even without a legal prevailing wage requirement. Verify with GC.',
    applicable_work_types: [],
    source_ids: ['src-cdc-dmv-bid-data-2023']
  },
  {
    id: 'risk-generic-quantities',
    category: 'Pricing',
    severity: 'Low',
    trigger_condition: 'mode === Quick AND total_sf > 5000',
    message: 'Quick estimate mode on a large project reduces pricing accuracy.',
    recommendation: 'For projects over 5,000 SF, switch to Detailed mode and perform a unit-by-unit takeoff for a defensible quote.',
    applicable_work_types: [],
    source_ids: ['src-rsmeans-2024']
  }
];

export const getAllRiskRules = (): RiskRule[] => riskRules;
