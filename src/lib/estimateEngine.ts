// ============================================================
// ESTIMATE ENGINE - Core deterministic calculator
// The LLM does NOT touch this logic. No AI in this file.
// All pricing flows from data library only.
// ============================================================

import type {
  EstimateInput, EstimateResult, EstimatePacket,
  EstimateLineItem, MultiplierSummary, AIAdvisorContext, LiveDataFactor,
  PricingBenchmark, BgcGlassPricing
} from '@/types';
import { syncRepo } from '@/lib/repository';
import { BGC_MARKUPS, BGC_REPAIR_LABOR, computeBgcLiteGeometry } from '@/data/bgcPricing';
import { calculateConfidence } from '@/lib/confidenceEngine';
import { evaluateRisks } from '@/lib/riskEngine';
import { generateNarrative } from '@/lib/narrativeEngine';

// Standard markup defaults (can be overridden by user input)
const DEFAULTS = {
  overhead: 0.15,
  contingency: 0.05,
  profit: 0.10,
  tax: 0.00,    // Applied when contract structure requires it
  bond: 0.01,
  equipment_pct_of_labor: 0.15,
};

export function runEstimate(input: EstimateInput, liveFactors: LiveDataFactor[] = [], benchmarkOverride?: PricingBenchmark): EstimatePacket {
  // 1. Resolve data objects
  const workType = syncRepo.getWorkTypeById(input.work_type_id);
  const glassType = syncRepo.getGlassTypeById(input.glass_type_id);
  const region = syncRepo.getRegionById(input.region_id);
  const laborRate = syncRepo.getLaborRateForRegion(input.region_id);
  const productivity = syncRepo.getLaborProductivityForWorkType(input.work_type_id);
  const benchmark = benchmarkOverride ?? syncRepo.getBenchmark(input.work_type_id, input.region_id);

  if (!workType || !glassType || !region || !laborRate || !productivity || !benchmark) {
    throw new Error('Missing required data for estimate calculation. Verify all inputs are selected.');
  }

  // 2. Resolve condition multipliers
  const projectTypeMul = syncRepo.getConditionMultiplier('project_type', input.project_type);
  const buildingTypeMul = syncRepo.getConditionMultiplier('building_type', input.building_type);
  const workConditionMul = syncRepo.getConditionMultiplier('work_condition', input.work_condition);
  const accessMul = syncRepo.getConditionMultiplier('access', input.access_condition);

  const wageMul = projectTypeMul?.wage_multiplier ?? 1.0;
  const complexityMul = buildingTypeMul?.complexity_multiplier ?? 1.0;
  const difficultyMul = workConditionMul?.difficulty_multiplier ?? 1.0;
  const accessMultiplier = accessMul?.access_multiplier ?? 1.0;

  // 2b. BGC shop pricing — when the selected glass carries the company's
  // price-sheet rates, the estimate follows the BGC Pricing Document
  // formulas exactly. Manual pricing override still takes precedence.
  const bgcPricing = !input.use_manual_pricing ? glassType.bgc_pricing : undefined;
  const bgcCalc = bgcPricing
    ? computeBgcTotals(input, bgcPricing, glassType.name, input.work_type_id === 'residential_window')
    : null;

  // 3. Effective labor rate (wage multiplier + benefits burden applied to DB/PW rate)
  let effectiveLaborRate: number;
  if (input.custom_labor_rate) {
    effectiveLaborRate = input.custom_labor_rate;
  } else if (wageMul >= 1.45 && laborRate.davis_bacon_rate) {
    effectiveLaborRate = laborRate.davis_bacon_rate * laborRate.benefits_burden;
  } else if (wageMul >= 1.35 && laborRate.maryland_pw_rate) {
    effectiveLaborRate = laborRate.maryland_pw_rate * laborRate.benefits_burden;
  } else if (wageMul >= 1.30 && laborRate.virginia_pw_rate) {
    effectiveLaborRate = laborRate.virginia_pw_rate * laborRate.benefits_burden;
  } else {
    effectiveLaborRate = laborRate.base_rate_per_hour * laborRate.benefits_burden * region.labor_cost_multiplier;
  }

  // 4. Base costs (before location and condition multipliers)
  let baseMatCostPerSF = 0;
  let adjustedMatCostPerSF: number;
  let laborCostPerSF: number;
  let hoursPerSF: number;
  let equipCostPerSF: number;

  if (bgcCalc) {
    // BGC price-sheet path — totals come straight from the PDF formulas
    adjustedMatCostPerSF = bgcCalc.material_total / input.total_sf;
    laborCostPerSF = bgcCalc.labor_total / input.total_sf;
    hoursPerSF = 0;
    equipCostPerSF = 0;
  } else if (input.use_manual_pricing && input.manual_material_cost_per_sf && input.manual_labor_cost_per_sf) {
    // Manual override — bypass all data table lookups
    adjustedMatCostPerSF = input.manual_material_cost_per_sf;
    laborCostPerSF = input.manual_labor_cost_per_sf;
    hoursPerSF = 0; // Unknown when using manual labor cost/SF
    equipCostPerSF = laborCostPerSF * DEFAULTS.equipment_pct_of_labor;
  } else {
    baseMatCostPerSF = getBaseMaterialCost(input.work_type_id);
    adjustedMatCostPerSF = baseMatCostPerSF * glassType.cost_multiplier * region.material_cost_multiplier;

    hoursPerSF = productivity.hours_per_sf * difficultyMul * accessMultiplier * complexityMul;
    laborCostPerSF = hoursPerSF * effectiveLaborRate;
    equipCostPerSF = laborCostPerSF * DEFAULTS.equipment_pct_of_labor;
  }

  const totalMatCost = bgcCalc ? bgcCalc.material_total : adjustedMatCostPerSF * input.total_sf;
  const totalLaborCost = bgcCalc ? bgcCalc.labor_total : laborCostPerSF * input.total_sf;
  const totalEquipCost = equipCostPerSF * input.total_sf;
  const totalDirectCost = totalMatCost + totalLaborCost + totalEquipCost;

  // 5. Markups — the BGC path uses the price sheet's own markup + tax + FSC;
  // overhead/contingency/profit/bond only apply on the commercial path.
  const overheadPct = bgcCalc ? 0 : DEFAULTS.overhead;
  const contingencyPct = bgcCalc ? 0 : (input.custom_contingency_pct ?? DEFAULTS.contingency);
  const profitPct = bgcCalc ? 0 : (input.custom_profit_pct ?? DEFAULTS.profit);
  const bondPct = !bgcCalc && input.include_bond ? DEFAULTS.bond : 0;

  const overheadAmt = totalDirectCost * overheadPct;
  const contingencyAmt = totalDirectCost * contingencyPct;
  const profitAmt = bgcCalc ? bgcCalc.markup_amt : (totalDirectCost + overheadAmt + contingencyAmt) * profitPct;
  const bondAmt = (totalDirectCost + overheadAmt + contingencyAmt + profitAmt) * bondPct;
  const taxAmt = bgcCalc ? bgcCalc.tax_amt + bgcCalc.fsc_amt : 0; // Commercial path: only when contract type specifies

  const grandTotal = bgcCalc
    ? bgcCalc.grand_total
    : totalDirectCost + overheadAmt + contingencyAmt + profitAmt + bondAmt + taxAmt;
  const effectivePerSF = grandTotal / input.total_sf;
  const totalHours = hoursPerSF * input.total_sf;

  // 6. Market position
  const marketPosition = resolveMarketPosition(effectivePerSF, benchmark.price_low, benchmark.price_mid, benchmark.price_high);

  // 7. Line items — BGC path emits the price sheet's own breakdown
  const lineItems: EstimateLineItem[] = bgcCalc ? bgcCalc.line_items : [
    {
      label: 'Materials — Framing & Glass',
      category: 'material',
      base_value: baseMatCostPerSF * input.total_sf,
      adjusted_value: totalMatCost,
      per_sf: adjustedMatCostPerSF,
      multipliers_applied: [`Glass type ×${glassType.cost_multiplier}`, `Regional ×${region.material_cost_multiplier}`],
    },
    {
      label: 'Labor — Installation',
      category: 'labor',
      base_value: productivity.hours_per_sf * laborRate.base_rate_per_hour * input.total_sf,
      adjusted_value: totalLaborCost,
      per_sf: laborCostPerSF,
      multipliers_applied: [
        `Access ×${accessMultiplier}`,
        `Difficulty ×${difficultyMul}`,
        `Complexity ×${complexityMul}`,
        `Wage rate $${effectiveLaborRate.toFixed(0)}/hr`
      ],
    },
    {
      label: 'Equipment & Access',
      category: 'equipment',
      base_value: productivity.hours_per_sf * laborRate.base_rate_per_hour * DEFAULTS.equipment_pct_of_labor * input.total_sf,
      adjusted_value: totalEquipCost,
      per_sf: equipCostPerSF,
      multipliers_applied: ['15% of labor cost'],
    },
    {
      label: `Overhead (${(overheadPct * 100).toFixed(0)}%)`,
      category: 'markup',
      base_value: overheadAmt,
      adjusted_value: overheadAmt,
      per_sf: overheadAmt / input.total_sf,
      multipliers_applied: [],
    },
    {
      label: `Contingency (${(contingencyPct * 100).toFixed(0)}%)`,
      category: 'markup',
      base_value: contingencyAmt,
      adjusted_value: contingencyAmt,
      per_sf: contingencyAmt / input.total_sf,
      multipliers_applied: [],
    },
    {
      label: `Profit / Fee (${(profitPct * 100).toFixed(0)}%)`,
      category: 'markup',
      base_value: profitAmt,
      adjusted_value: profitAmt,
      per_sf: profitAmt / input.total_sf,
      multipliers_applied: [],
    },
  ];

  if (bondAmt > 0) {
    lineItems.push({
      label: `Bond (${(bondPct * 100).toFixed(1)}%)`,
      category: 'markup',
      base_value: bondAmt,
      adjusted_value: bondAmt,
      per_sf: bondAmt / input.total_sf,
      multipliers_applied: [],
    });
  }

  // 8. Multipliers audit trail
  const multipliersSummary: MultiplierSummary[] = bgcCalc ? bgcCalc.multipliers : [
    { name: 'Regional Material', value: region.material_cost_multiplier, source: 'RSMeans 2024' },
    { name: 'Regional Labor', value: region.labor_cost_multiplier, source: 'RSMeans 2024' },
    { name: 'Wage/Prevailing', value: wageMul, source: 'Project Type' },
    { name: 'Building Complexity', value: complexityMul, source: 'Building Type' },
    { name: 'Work Difficulty', value: difficultyMul, source: 'Work Condition' },
    { name: 'Access', value: accessMultiplier, source: 'Access Condition' },
    { name: 'Glass Type', value: glassType.cost_multiplier, source: 'Glass Type Selection' },
  ];

  const result: EstimateResult = {
    line_items: lineItems,
    total_material: totalMatCost,
    total_labor: totalLaborCost,
    total_equipment: totalEquipCost,
    total_direct: totalDirectCost,
    total_overhead: overheadAmt,
    total_contingency: contingencyAmt,
    total_profit: profitAmt,
    total_tax: taxAmt,
    total_bond: bondAmt,
    grand_total: grandTotal,
    effective_per_sf: effectivePerSF,
    total_labor_hours: totalHours,
    use_manual_pricing: input.use_manual_pricing,
    pricing_basis: bgcCalc ? 'bgc_sheet' : input.use_manual_pricing ? 'manual' : 'rsmeans',
    market_position: marketPosition,
    benchmark_low: benchmark.price_low,
    benchmark_mid: benchmark.price_mid,
    benchmark_high: benchmark.price_high,
    multipliers_summary: multipliersSummary,
  };

  // 9. Confidence
  const confidenceReport = calculateConfidence({
    region_id: input.region_id,
    work_type_id: input.work_type_id,
    glass_type_id: input.glass_type_id,
    total_sf: input.total_sf,
    project_type: input.project_type,
    building_type: input.building_type,
    work_condition: input.work_condition,
    access_condition: input.access_condition,
    mode: input.mode,
    num_openings: input.num_openings ?? 0,
    has_fire_rating: input.has_fire_rating ?? false,
    has_blast_security: input.has_blast_security ?? false,
  });

  // 10. Risk flags
  const riskFlags = evaluateRisks(input, result);

  // 11. Assumptions and exclusions
  const assumptions = bgcCalc
    ? bgcCalc.assumptions
    : buildAssumptions(input, effectiveLaborRate, productivity.hours_per_sf, contingencyPct, profitPct);
  const exclusions = buildExclusions(input);

  // 12. AI context packet (structured — no prices invented by AI)
  const aiContext: AIAdvisorContext = {
    work_type_name: workType.name,
    region_name: region.name,
    project_type_label: projectTypeMul?.label ?? input.project_type,
    total_sf: input.total_sf,
    effective_per_sf: Math.round(effectivePerSF),
    benchmark_range: { low: benchmark.price_low, mid: benchmark.price_mid, high: benchmark.price_high },
    market_position: marketPosition,
    confidence_level: confidenceReport.level,
    confidence_score: confidenceReport.score,
    confidence_factors: confidenceReport.factors.map(f => `${f.satisfied ? '✓' : '✗'} ${f.label}: ${f.note}`),
    risk_flag_messages: riskFlags.map(r => `[${r.severity}] ${r.message}`),
    key_assumptions: assumptions.slice(0, 6),
    special_requirements: [
      ...(input.has_fire_rating ? ['Fire-rated glazing required'] : []),
      ...(input.has_blast_security ? ['Blast/security glazing required'] : []),
      ...(input.has_acoustic_requirement ? ['Acoustic glazing requirement'] : []),
    ],
    grand_total: Math.round(grandTotal),
  };

  const basePacket = {
    id: `est-${Date.now()}`,
    created_at: new Date().toISOString(),
    mode: input.mode,
    work_type_name: workType.name,
    glass_type_name: glassType.name,
    region_name: region.name,
    project_type_label: projectTypeMul?.label ?? input.project_type,
    building_type_label: buildingTypeMul?.label ?? input.building_type,
    work_condition_label: workConditionMul?.label ?? input.work_condition,
    access_condition_label: accessMul?.label ?? input.access_condition,
    total_sf: input.total_sf,
    num_openings: input.num_openings ?? 0,
    result,
    confidence: confidenceReport,
    risk_flags: riskFlags,
    assumptions,
    exclusions,
    ai_context: aiContext,
    live_data_factors: liveFactors,
  } as Omit<EstimatePacket, 'narrative'>;

  const narrative = generateNarrative(basePacket as EstimatePacket, liveFactors);

  return { ...basePacket, narrative } as EstimatePacket;
}

// ---- Private helpers ----

interface BgcCalc {
  material_total: number;
  labor_total: number;
  markup_amt: number;
  tax_amt: number;
  fsc_amt: number;
  grand_total: number;
  line_items: EstimateLineItem[];
  multipliers: MultiplierSummary[];
  assumptions: string[];
}

// Baltimore Glass Co. price-sheet math — mirrors the BGC Pricing Document:
//   Shop sale:   sqft × sell rate = sale + 6% tax + 5% FSC = Total
//   Repair:      sqft × glass rate + labor/lite = cost × 1.75 + tax + FSC
//   Heavy glass: OBE cost × sqft + edging × $/inch = subtotal × 1.13 (OBE FSC)
//                = cost × 2.0 markup + tax + FSC
// Lites are assumed square (the estimator collects total SF + openings, not
// W×H); sides round up to 2" increments with a 1 sqft minimum per lite.
function computeBgcTotals(
  input: EstimateInput,
  bgc: BgcGlassPricing,
  glassName: string,
  isRepair: boolean
): BgcCalc {
  const geo = computeBgcLiteGeometry(input.total_sf, input.num_openings);
  const sf = input.total_sf;
  const geometryNote = `${geo.lites} lite${geo.lites === 1 ? '' : 's'} @ ~${geo.side_in}"×${geo.side_in}" (${geo.billable_sf.toFixed(1)} sqft billable)`;

  const lineItems: EstimateLineItem[] = [];
  const multipliers: MultiplierSummary[] = [];
  const assumptions: string[] = [
    'Priced per Baltimore Glass Co. price sheet — the company\'s true shop pricing',
    `Lites assumed square: ${geometryNote}; minimum 1 sqft per lite`,
    'Final shop quote rounds each lite dimension up to the next 2" increment — confirm exact W×H at order',
  ];

  let materialTotal: number;
  let laborTotal = 0;
  let markupAmt = 0;
  let preTax: number;

  if (bgc.method === 'cost_plus') {
    // Heavy glass (3/8", 1/2", 3/4") — cost plus from Oldcastle (OBE)
    const obeCostPerSF = bgc.obe_cost_per_sf ?? 0;
    const edgePerInch = bgc.edge_cost_per_inch ?? 0;
    const glassCost = geo.billable_sf * obeCostPerSF;
    const edgingCost = geo.perimeter_in_per_lite * geo.lites * edgePerInch;
    materialTotal = glassCost + edgingCost;
    const obeFscAmt = materialTotal * (BGC_MARKUPS.obe_fuel_surcharge - 1);
    const cost = materialTotal + obeFscAmt;
    preTax = cost * BGC_MARKUPS.heavy_glass_markup;
    markupAmt = preTax - materialTotal;

    lineItems.push(
      {
        label: `Glass — ${glassName} (OBE cost)`,
        category: 'material',
        base_value: glassCost,
        adjusted_value: glassCost,
        per_sf: glassCost / sf,
        multipliers_applied: [`$${obeCostPerSF.toFixed(2)}/sqft OBE cost`, geometryNote],
      },
      {
        label: 'Edgework',
        category: 'material',
        base_value: edgingCost,
        adjusted_value: edgingCost,
        per_sf: edgingCost / sf,
        multipliers_applied: [`(L+W)×2 linear inches × $${edgePerInch.toFixed(2)}/inch`],
      },
      {
        label: `OBE Fuel Surcharge (×${BGC_MARKUPS.obe_fuel_surcharge})`,
        category: 'markup',
        base_value: obeFscAmt,
        adjusted_value: obeFscAmt,
        per_sf: obeFscAmt / sf,
        multipliers_applied: [],
      },
      {
        label: `Shop Markup (×${BGC_MARKUPS.heavy_glass_markup.toFixed(1)})`,
        category: 'markup',
        base_value: preTax - cost,
        adjusted_value: preTax - cost,
        per_sf: (preTax - cost) / sf,
        multipliers_applied: [`${BGC_MARKUPS.heavy_glass_markup_floor} floor if customer pushes back`],
      },
    );
    multipliers.push(
      { name: 'OBE Fuel Surcharge', value: BGC_MARKUPS.obe_fuel_surcharge, source: 'BGC Price Sheet' },
      { name: 'Heavy Glass Markup', value: BGC_MARKUPS.heavy_glass_markup, source: 'BGC Price Sheet' },
    );
    assumptions.push(
      `Heavy glass cost-plus: $${obeCostPerSF.toFixed(2)}/sqft OBE cost + $${edgePerInch.toFixed(2)}/inch edging × ${BGC_MARKUPS.obe_fuel_surcharge} OBE FSC × ${BGC_MARKUPS.heavy_glass_markup.toFixed(1)} markup`,
      `Markup floor ×${BGC_MARKUPS.heavy_glass_markup_floor} available if customer pushes back on price`,
      `Shapes (ovals/circles) not included — add ×${BGC_MARKUPS.shape_charge_low}–${BGC_MARKUPS.shape_charge_high} shape charge via Bel Pre`,
    );
  } else if (isRepair) {
    // Window repair: sqft × glass rate + labor per lite, × 1.75 markup
    const glassRate = bgc.repair_rate_per_sf ?? bgc.sell_per_sf ?? 0;
    const laborPerLite = bgc.repair_labor_per_lite ?? BGC_REPAIR_LABOR.push_in_vinyl;
    materialTotal = geo.billable_sf * glassRate;
    laborTotal = laborPerLite * geo.lites;
    const cost = materialTotal + laborTotal;
    preTax = cost * BGC_MARKUPS.repair_markup;
    markupAmt = preTax - cost;

    lineItems.push(
      {
        label: `Glass — ${glassName}`,
        category: 'material',
        base_value: materialTotal,
        adjusted_value: materialTotal,
        per_sf: materialTotal / sf,
        multipliers_applied: [`$${glassRate.toFixed(2)}/sqft repair glass rate`, geometryNote],
      },
      {
        label: 'Labor — Glazing Repair',
        category: 'labor',
        base_value: laborTotal,
        adjusted_value: laborTotal,
        per_sf: laborTotal / sf,
        multipliers_applied: [`$${laborPerLite}/lite × ${geo.lites}`],
      },
      {
        label: `Repair Markup (×${BGC_MARKUPS.repair_markup})`,
        category: 'markup',
        base_value: markupAmt,
        adjusted_value: markupAmt,
        per_sf: markupAmt / sf,
        multipliers_applied: [],
      },
    );
    multipliers.push({ name: 'Repair Markup', value: BGC_MARKUPS.repair_markup, source: 'BGC Price Sheet' });
    assumptions.push(
      `Window repair formula: sqft × $${glassRate.toFixed(2)} glass + $${laborPerLite}/lite labor, × ${BGC_MARKUPS.repair_markup} markup`,
      `Labor assumes push-in vinyl stop; use $${BGC_REPAIR_LABOR.wrap_around}/lite for wrap-around glazing (marine, vinyl replacement windows, patio doors)`,
      `Add $${BGC_REPAIR_LABOR.putty_adder}/lite when putty glazing is required`,
    );
  } else {
    // Shop sale (Formula General): sqft × selling price — rate already marked up
    const sellRate = bgc.sell_per_sf ?? 0;
    materialTotal = geo.billable_sf * sellRate;
    preTax = materialTotal;

    lineItems.push({
      label: `Glass — ${glassName}`,
      category: 'material',
      base_value: materialTotal,
      adjusted_value: materialTotal,
      per_sf: materialTotal / sf,
      multipliers_applied: [`$${sellRate.toFixed(2)}/sqft sell rate (markup built in)`, geometryNote],
    });
    assumptions.push(
      `Shop sale (Formula General): sqft × $${sellRate.toFixed(2)}/sqft sell rate — edging and markup built into rate`,
      ...(bgc.sell_per_sf_polished && bgc.sell_per_sf_polished !== bgc.sell_per_sf
        ? [`Polished edges (PE): use $${bgc.sell_per_sf_polished.toFixed(2)}/sqft instead of $${sellRate.toFixed(2)} clean-cut`]
        : []),
      `Shapes (ovals/circles) not included — add ×${BGC_MARKUPS.shape_charge_low}–${BGC_MARKUPS.shape_charge_high} shape charge via Bel Pre`,
    );
  }

  const taxAmt = preTax * BGC_MARKUPS.sales_tax;
  const fscAmt = preTax * BGC_MARKUPS.fuel_surcharge;
  const grandTotal = preTax + taxAmt + fscAmt;

  lineItems.push(
    {
      label: `MD Sales Tax (${(BGC_MARKUPS.sales_tax * 100).toFixed(0)}%)`,
      category: 'tax',
      base_value: taxAmt,
      adjusted_value: taxAmt,
      per_sf: taxAmt / sf,
      multipliers_applied: [],
    },
    {
      label: `Fuel Surcharge (${(BGC_MARKUPS.fuel_surcharge * 100).toFixed(0)}%)`,
      category: 'tax',
      base_value: fscAmt,
      adjusted_value: fscAmt,
      per_sf: fscAmt / sf,
      multipliers_applied: [],
    },
  );
  multipliers.push(
    { name: 'MD Sales Tax', value: 1 + BGC_MARKUPS.sales_tax, source: 'BGC Price Sheet' },
    { name: 'Fuel Surcharge', value: 1 + BGC_MARKUPS.fuel_surcharge, source: 'BGC Price Sheet' },
  );
  assumptions.push(
    `Total includes ${(BGC_MARKUPS.sales_tax * 100).toFixed(0)}% MD sales tax and ${(BGC_MARKUPS.fuel_surcharge * 100).toFixed(0)}% fuel surcharge (×${BGC_MARKUPS.tax_fsc_shortcut} shortcut)`,
    'Contingency, profit, overhead, and bond inputs do not apply — BGC sheet pricing is all-in',
  );

  return {
    material_total: materialTotal,
    labor_total: laborTotal,
    markup_amt: markupAmt,
    tax_amt: taxAmt,
    fsc_amt: fscAmt,
    grand_total: grandTotal,
    line_items: lineItems,
    multipliers,
    assumptions,
  };
}

function getBaseMaterialCost(work_type_id: string): number {
  // Base material cost per SF — sourced from RSMeans 2024
  // These are material-only costs (no labor, no markup)
  const costs: Record<string, number> = {
    storefront: 22,
    stick_curtain_wall: 42,
    unitized_curtain_wall: 62,
    window_wall: 32,
    interior_partition: 18,
    glass_railing: 52,
    skylight: 65,
    fire_rated: 78,
    blast_security: 118,
    residential_window: 14,
    decorative_glass: 16,
  };
  return costs[work_type_id] ?? 30;
}

function resolveMarketPosition(
  effectivePerSF: number,
  low: number,
  mid: number,
  high: number
): EstimateResult['market_position'] {
  if (effectivePerSF < low) return 'Below Market';
  if (effectivePerSF <= mid * 1.05) return 'Competitive';
  if (effectivePerSF <= high * 1.10) return 'Premium';
  return 'High Risk / Over Market';
}

function buildAssumptions(
  input: EstimateInput,
  laborRate: number,
  hoursPerSF: number,
  contingencyPct: number,
  profitPct: number
): string[] {
  const list = [
    `System: ${input.work_type_id.replace(/_/g, ' ')} — base productivity ${hoursPerSF.toFixed(2)} hrs/SF`,
    `Glass: ${input.glass_type_id.replace(/_/g, ' ')} — material multiplier applied`,
    `Labor rate: $${laborRate.toFixed(0)}/hr all-in (includes benefits burden)`,
    `Region: ${input.region_id.replace(/_/g, ' ')} — regional cost multipliers applied`,
    `Project type: ${input.project_type.replace(/_/g, ' ')} — wage requirements applied`,
    `Work condition: ${input.work_condition.replace(/_/g, ' ')} — difficulty multiplier applied`,
    `Access: ${input.access_condition.replace(/_/g, ' ')} — access multiplier applied`,
    `Building type: ${input.building_type.replace(/_/g, ' ')} — complexity multiplier applied`,
    `Overhead: 15% of direct cost`,
    `Contingency: ${(contingencyPct * 100).toFixed(0)}% of direct cost`,
    `Profit/fee: ${(profitPct * 100).toFixed(0)}% applied to cost + overhead + contingency`,
    `Equipment: 15% of labor cost (scaffolding, lifts, small tools)`,
    input.mode === 'Quick' ? 'Quick estimate mode — ROM only, not for final bid' : 'Detailed estimate mode',
    'Estimate is installed cost. GC overhead and profit not included unless noted.',
    'Pricing based on RSMeans 2024 and DMV regional bid data.',
  ];
  return list;
}

function buildExclusions(input: EstimateInput): string[] {
  const base = [
    'Design, engineering, and shop drawing fees (unless scope includes delegated design)',
    'Building permits and permit fees',
    'GC overhead and profit',
    'Testing and special inspection fees',
    'Shipping and freight (included in material cost assumptions)',
    'Site utilities and temporary facilities',
    'Demolition and removal of existing glazing',
    'Structural steel backup, lintels, or embedments',
    'Waterproofing and roofing work beyond sealant joint',
    'Adjacent finishes: drywall, ceilings, floor work',
    'Hardware: door closers, locks, panic hardware (unless included in scope)',
    'Sales tax (add if applicable to your contract structure)',
  ];

  if (input.work_type_id === 'skylight') {
    base.push('Structural framing and roof deck (unless delegated design is in scope)');
    base.push('Drainage piping and overflow scuppers beyond glazing frame');
  }

  if (input.work_type_id === 'blast_security') {
    base.push('Security consultant fees for threat level specification');
    base.push('Electronic access control and security hardware');
  }

  if (input.work_type_id === 'fire_rated') {
    base.push('Fire door hardware beyond door and frame supplied by glazing contractor');
    base.push('Firestopping at adjacent construction interfaces');
  }

  if (input.work_condition === 'renovation') {
    base.push('Existing condition survey and as-built documentation');
    base.push('Hazardous material abatement (lead paint, caulk)');
  }

  return base;
}
