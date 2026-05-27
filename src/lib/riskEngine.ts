// ============================================================
// RISK ENGINE
// Evaluates risk rules against estimate inputs and results.
// Deterministic — no LLM involvement.
// ============================================================

import type { RiskFlag, EstimateInput, EstimateResult } from '@/types';
import { syncRepo } from '@/lib/repository';

export function evaluateRisks(input: EstimateInput, result: EstimateResult): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const laborRate = syncRepo.getLaborRateForRegion(input.region_id);
  const contingencyPct = input.custom_contingency_pct ?? 0.05;
  const profitPct = input.custom_profit_pct ?? 0.10;

  // ---- PRICING ----
  if (result.effective_per_sf < result.benchmark_low) {
    flags.push({
      id: 'risk-below-market',
      severity: 'High',
      category: 'Pricing',
      message: `Effective $/SF ($${result.effective_per_sf.toFixed(0)}) is below the market low benchmark ($${result.benchmark_low.toFixed(0)}/SF) for this system.`,
      recommendation: 'Review all inputs for missing scope, understated multipliers, or math error before submitting.'
    });
  }

  if (result.effective_per_sf > result.benchmark_high * 1.15) {
    flags.push({
      id: 'risk-over-market',
      severity: 'Medium',
      category: 'Market',
      message: `Effective $/SF ($${result.effective_per_sf.toFixed(0)}) is significantly above the market high ($${result.benchmark_high.toFixed(0)}/SF).`,
      recommendation: 'Justify the premium pricing or verify multipliers are not stacked excessively.'
    });
  }

  if (contingencyPct < 0.03) {
    flags.push({
      id: 'risk-low-contingency',
      severity: 'High',
      category: 'Pricing',
      message: `Contingency is ${(contingencyPct * 100).toFixed(1)}% — below the recommended 3% minimum.`,
      recommendation: 'Increase contingency to 3-5% minimum for commercial glazing. Use 7-10% for renovation or occupied-building work.'
    });
  }

  if (profitPct < 0.08) {
    flags.push({
      id: 'risk-low-profit',
      severity: 'Medium',
      category: 'Pricing',
      message: `Profit margin is ${(profitPct * 100).toFixed(1)}% — below the industry average of 8%.`,
      recommendation: 'Commercial glazing subcontractors typically target 8-12% net profit. Review your cost structure.'
    });
  }

  if (input.project_type === 'federal_davis_bacon' && !input.include_bond) {
    flags.push({
      id: 'risk-no-bond-federal',
      severity: 'High',
      category: 'Compliance',
      message: 'Federal/Davis-Bacon project selected but bond cost not included.',
      recommendation: 'Add performance and payment bond (typically 0.5–1.5% of contract value). Check bid documents for bonding requirements.'
    });
  }

  // ---- PREVAILING WAGE ----
  if (input.project_type === 'federal_davis_bacon') {
    const dbRate = laborRate?.davis_bacon_rate;
    const customRate = input.custom_labor_rate;
    if (dbRate && customRate && customRate < dbRate) {
      flags.push({
        id: 'risk-davis-bacon-understate',
        severity: 'Critical',
        category: 'Compliance',
        message: `Custom labor rate ($${customRate}/hr) is below the Davis-Bacon rate for this jurisdiction ($${dbRate}/hr).`,
        recommendation: 'Obtain current Wage Determination (WD) for this county from SAM.gov. Underpaying is a federal violation.'
      });
    } else if (!customRate) {
      flags.push({
        id: 'risk-davis-bacon-verify',
        severity: 'Medium',
        category: 'Compliance',
        message: 'Davis-Bacon project — verify current WD prevailing wage is applied.',
        recommendation: 'Pull the Wage Determination from SAM.gov for this county. Davis-Bacon rates change annually.'
      });
    }
  }

  if (['maryland_public', 'virginia_public'].includes(input.project_type)) {
    flags.push({
      id: 'risk-state-prevailing-wage',
      severity: 'Medium',
      category: 'Compliance',
      message: `Public works project — state prevailing wage rates apply for ${input.project_type === 'maryland_public' ? 'Maryland' : 'Virginia'}.`,
      recommendation: 'Verify current prevailing wage schedule from the state labor department before finalizing.'
    });
  }

  // ---- SCHEDULE / PROCUREMENT ----
  if (input.work_type_id === 'unitized_curtain_wall') {
    flags.push({
      id: 'risk-unitized-lead-time',
      severity: 'High',
      category: 'Schedule',
      message: 'Unitized curtain wall requires 12-20 weeks lead time after shop drawing approval.',
      recommendation: 'Submit shop drawings immediately after contract award. Any delay in architect approval directly pushes installation start.'
    });
  }

  if (input.work_type_id === 'blast_security') {
    flags.push({
      id: 'risk-blast-long-lead',
      severity: 'High',
      category: 'Schedule',
      message: 'Blast/security glazing: 14-24 week lead time, pre-qualification may be required.',
      recommendation: 'Identify blast-rated glazing supplier immediately. Confirm threat level spec before ordering.'
    });
  }

  if (input.work_type_id === 'fire_rated') {
    flags.push({
      id: 'risk-fire-rated-lead',
      severity: 'Medium',
      category: 'Schedule',
      message: 'UL-listed fire-rated assemblies: 8-14 weeks lead time. All dimensions must be final before fabrication.',
      recommendation: 'No field cutting of fire-rated glass allowed. Confirm all opening sizes before ordering.'
    });
  }

  if (['blast_resistant', 'laminated_sgp', 'fire_rated_glass'].includes(input.glass_type_id)) {
    flags.push({
      id: 'risk-specialty-glass-lead',
      severity: 'Medium',
      category: 'Procurement',
      message: 'Specialty glass selected — extended lead time, no standard substitutions.',
      recommendation: 'Confirm spec with architect before ordering. Lead time slippage can delay entire project.'
    });
  }

  // ---- TECHNICAL ----
  if (['high_rise', 'swing_stage'].includes(input.access_condition)) {
    flags.push({
      id: 'risk-high-rise-complexity',
      severity: 'Medium',
      category: 'Technical',
      message: 'High-rise or swing-stage access adds schedule and cost risk from weather delays and equipment coordination.',
      recommendation: 'Verify rigging points, building tie-in access, and wind monitoring plan. Budget for weather delay contingency.'
    });
  }

  if (input.work_condition === 'occupied_building' && contingencyPct < 0.07) {
    flags.push({
      id: 'risk-occupied-contingency',
      severity: 'Medium',
      category: 'Technical',
      message: 'Occupied building work requires higher contingency — minimum 7-10% recommended.',
      recommendation: 'After-hours labor, protection, and coordination add unplanned cost. Increase contingency accordingly.'
    });
  }

  if (input.work_condition === 'renovation') {
    flags.push({
      id: 'risk-renovation-unknowns',
      severity: 'Medium',
      category: 'Technical',
      message: 'Renovation work introduces unknown existing conditions not captured in this estimate.',
      recommendation: 'Conduct a pre-bid site visit. Document existing frame, substrate, and interface conditions before finalizing price.'
    });
  }

  if (input.work_type_id === 'skylight') {
    flags.push({
      id: 'risk-skylight-drainage',
      severity: 'High',
      category: 'Technical',
      message: 'Overhead glazing: drainage design, overflow, and structural support must be confirmed with GC.',
      recommendation: 'Clarify scope for drainage, structural framing, and waterproofing integration before submitting price.'
    });
  }

  if (input.work_type_id === 'fire_rated') {
    flags.push({
      id: 'risk-fire-rated-assembly',
      severity: 'Critical',
      category: 'Compliance',
      message: 'Fire-rated glass and frame must be from the same UL-listed assembly — no mixing manufacturers.',
      recommendation: 'Specify by UL design number. Any substitution voids the listing and creates a code violation.'
    });
  }

  // ---- MARKET / COMPETITIVE ----
  if (input.region_id === 'dc' && input.project_type === 'private') {
    flags.push({
      id: 'risk-dc-union-verify',
      severity: 'Low',
      category: 'Market',
      message: 'DC private project: verify whether union labor is required or typical for this GC.',
      recommendation: 'DC market has high union presence. Confirm labor requirements with GC before assuming open-shop rates.'
    });
  }

  if (input.mode === 'Quick' && input.total_sf > 5000) {
    flags.push({
      id: 'risk-generic-quantities',
      severity: 'Low',
      category: 'Pricing',
      message: `Quick estimate on ${input.total_sf.toLocaleString()} SF — accuracy is reduced for large projects in Quick mode.`,
      recommendation: 'Switch to Detailed mode and perform a unit-by-unit takeoff for a defensible bid.'
    });
  }

  // Sort: Critical → High → Medium → Low
  const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return flags.sort((a, b) => order[a.severity] - order[b.severity]);
}
