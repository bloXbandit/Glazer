// ============================================================
// SHOP QUOTE — counter-staff quick quoting, exact BGC price-sheet math
// Works from REAL lite dimensions (W×H in inches), unlike the SF-based
// commercial estimator. Deterministic: all rates come from
// src/data/bgcPricing.ts and the bgc_pricing fields on glass types.
//
// Formulas (BGC Pricing Document):
//   Shop sale:   W×H → sqft (each dim rounded UP to 2", min 1 sqft)
//                × sell rate = sale + 6% tax + 5% FSC = out the door
//   Repair:      sqft × glass rate + labor/lite (+putty) = cost × 1.75
//                + tax + FSC
//   Heavy glass: OBE cost × sqft + (L+W)×2 × $/inch = subtotal × 1.13
//                × 2.0 markup (1.85 floor) + tax + FSC
//   Shapes:      Bel Pre 3/8": $6.75 × sqft + $0.14/inch edging,
//                × 1.35 shape charge × markup + tax + FSC
//                (per the sheet's two worked examples — oval and circle)
// ============================================================

import type { GlassType } from '@/types';
import { glassTypes } from '@/data/glassTypes';
import {
  BGC_MARKUPS, BGC_RULES, BGC_REPAIR_LABOR, BGC_SHAPES,
} from '@/data/bgcPricing';

export type EdgeFinish = 'clean_cut' | 'polished';
export type RepairLaborType = 'push_in_vinyl' | 'wrap_around';

export interface ShopQuoteInput {
  glass_type_id: string;        // must be a glass type with bgc_pricing
  width_in: number;
  height_in: number;
  qty: number;                  // number of identical lites
  edge_finish: EdgeFinish;
  is_repair: boolean;           // window repair job (adds labor + ×1.75)
  repair_labor: RepairLaborType;
  add_putty: boolean;           // +$30/lite putty glazing
  is_shape: boolean;            // oval / circle — Bel Pre shape pricing
}

export interface ShopQuoteLine {
  label: string;
  amount: number;
  note?: string;
}

export interface ShopQuoteResult {
  glass_name: string;
  // Geometry after BGC rounding rules
  rounded_width_in: number;
  rounded_height_in: number;
  sqft_per_lite: number;
  billable_sqft: number;
  perimeter_in_per_lite: number;
  qty: number;
  // Money
  lines: ShopQuoteLine[];
  pre_tax: number;
  tax: number;
  fsc: number;
  total: number;                // out the door
  floor_total?: number;         // heavy glass at the 1.85 complaint-floor markup
  warnings: string[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function runShopQuote(input: ShopQuoteInput): ShopQuoteResult {
  const glass = glassTypes.find(g => g.id === input.glass_type_id);
  if (!glass?.bgc_pricing) {
    throw new Error('Shop quotes require a BGC price-sheet glass product.');
  }
  const bgc = glass.bgc_pricing;
  const qty = Math.max(1, Math.floor(input.qty || 1));

  // Geometry — "Glass is sold by every 2\" increment (round up)", min 1 sqft
  const inc = BGC_RULES.size_increment_in;
  const w = Math.ceil(Math.max(input.width_in, 1) / inc) * inc;
  const h = Math.ceil(Math.max(input.height_in, 1) / inc) * inc;
  let sqftPerLite = (w * h) / BGC_RULES.sq_in_per_sf;
  const minApplied = sqftPerLite < BGC_RULES.min_sf_per_lite;
  sqftPerLite = Math.max(sqftPerLite, BGC_RULES.min_sf_per_lite);
  const billableSqft = sqftPerLite * qty;
  const perimeterIn = (w + h) * 2;

  const lines: ShopQuoteLine[] = [];
  const warnings: string[] = [];
  if (minApplied) warnings.push('Minimum 1 sq. ft. per lite applied.');

  let preTax: number;
  let floorPreTax: number | undefined;

  if (bgc.method === 'cost_plus') {
    if (input.is_repair) {
      warnings.push('Heavy glass is quoted cost-plus — repair labor/markup not applicable; repair toggle ignored.');
    }
    if (input.is_shape) {
      // Bel Pre shape path (3/8" documented; other thicknesses: email for pricing)
      if (glass.id !== 'bgc_heavy_3_8') {
        warnings.push('Shape pricing is only on the sheet for 3/8" (Bel Pre). Email OBE/Bel Pre to confirm cost for this thickness — using Bel Pre 3/8" rates.');
      }
      const glassCost = billableSqft * BGC_SHAPES.bel_pre_3_8_cost_per_sf;
      const edgeCost = perimeterIn * qty * BGC_SHAPES.bel_pre_edge_per_inch;
      const shaped = (glassCost + edgeCost) * BGC_MARKUPS.shape_charge_high;
      preTax = shaped * BGC_MARKUPS.heavy_glass_markup;
      floorPreTax = shaped * BGC_MARKUPS.heavy_glass_markup_floor;

      lines.push(
        { label: `Glass — Bel Pre shape ($${BGC_SHAPES.bel_pre_3_8_cost_per_sf.toFixed(2)}/sqft)`, amount: round2(glassCost) },
        { label: `Edgework (${perimeterIn}" × ${qty} × $${BGC_SHAPES.bel_pre_edge_per_inch.toFixed(2)}/in)`, amount: round2(edgeCost) },
        { label: `Shape charge (×${BGC_MARKUPS.shape_charge_high})`, amount: round2(shaped - glassCost - edgeCost) },
        { label: `Shop markup (×${BGC_MARKUPS.heavy_glass_markup.toFixed(1)})`, amount: round2(preTax - shaped) },
      );
    } else {
      const obeCost = bgc.obe_cost_per_sf ?? 0;
      const edgePerInch = bgc.edge_cost_per_inch ?? 0;
      const glassCost = billableSqft * obeCost;
      const edgeCost = perimeterIn * qty * edgePerInch;
      const cost = (glassCost + edgeCost) * BGC_MARKUPS.obe_fuel_surcharge;
      preTax = cost * BGC_MARKUPS.heavy_glass_markup;
      floorPreTax = cost * BGC_MARKUPS.heavy_glass_markup_floor;

      lines.push(
        { label: `Glass — OBE cost ($${obeCost.toFixed(2)}/sqft)`, amount: round2(glassCost) },
        { label: `Edgework (${perimeterIn}" × ${qty} × $${edgePerInch.toFixed(2)}/in)`, amount: round2(edgeCost) },
        { label: `OBE fuel surcharge (×${BGC_MARKUPS.obe_fuel_surcharge})`, amount: round2(cost - glassCost - edgeCost) },
        { label: `Shop markup (×${BGC_MARKUPS.heavy_glass_markup.toFixed(1)})`, amount: round2(preTax - cost) },
      );
    }
  } else if (input.is_repair) {
    // Window repair: sqft × glass rate + labor per lite, × 1.75
    const glassRate = bgc.repair_rate_per_sf ?? bgc.sell_per_sf ?? 0;
    const laborPerLite = input.repair_labor === 'wrap_around'
      ? BGC_REPAIR_LABOR.wrap_around
      : (bgc.repair_labor_per_lite ?? BGC_REPAIR_LABOR.push_in_vinyl);
    const puttyPerLite = input.add_putty ? BGC_REPAIR_LABOR.putty_adder : 0;

    const glassCost = billableSqft * glassRate;
    const laborCost = (laborPerLite + puttyPerLite) * qty;
    const cost = glassCost + laborCost;
    preTax = cost * BGC_MARKUPS.repair_markup;

    lines.push(
      { label: `Glass — ${glass.name} ($${glassRate.toFixed(2)}/sqft repair rate)`, amount: round2(glassCost) },
      {
        label: `Labor ($${laborPerLite}/lite${puttyPerLite ? ` + $${puttyPerLite} putty` : ''} × ${qty})`,
        amount: round2(laborCost),
        note: input.repair_labor === 'wrap_around' ? 'Wrap-around glazing (marine, vinyl replacement, patio doors)' : 'Push-in vinyl stop',
      },
      { label: `Repair markup (×${BGC_MARKUPS.repair_markup})`, amount: round2(preTax - cost) },
    );
    if (input.is_shape) warnings.push('Shapes on repair jobs: email Bel Pre/OBE for glass cost — shape charge not included.');
  } else {
    // Shop sale — sell rate already includes edging + markup
    const rate = input.edge_finish === 'polished'
      ? (bgc.sell_per_sf_polished ?? bgc.sell_per_sf ?? 0)
      : (bgc.sell_per_sf ?? 0);
    preTax = billableSqft * rate;

    lines.push({
      label: `Glass — ${glass.name} ($${rate.toFixed(2)}/sqft ${input.edge_finish === 'polished' ? 'polished edges' : 'clean cut'})`,
      amount: round2(preTax),
      note: 'Edging and markup built into the sell rate',
    });
    if (input.is_shape) {
      warnings.push('Shapes (ovals/circles) in this glass are quoted by email (Bel Pre/OBE) — price shown is for a rectangle.');
    }
  }

  const tax = preTax * BGC_MARKUPS.sales_tax;
  const fsc = preTax * BGC_MARKUPS.fuel_surcharge;
  const total = preTax + tax + fsc;

  lines.push(
    { label: `MD sales tax (${(BGC_MARKUPS.sales_tax * 100).toFixed(0)}%)`, amount: round2(tax) },
    { label: `Fuel surcharge (${(BGC_MARKUPS.fuel_surcharge * 100).toFixed(0)}%)`, amount: round2(fsc) },
  );

  if (glass.id === 'bgc_ig_clear_mullions' || glass.id === 'bgc_ig_low_e_mullions') {
    warnings.push('Rate covers up to 3 mullions. More than 3 (grid): check OBE.');
  }

  return {
    glass_name: glass.name,
    rounded_width_in: w,
    rounded_height_in: h,
    sqft_per_lite: round2(sqftPerLite),
    billable_sqft: round2(billableSqft),
    perimeter_in_per_lite: perimeterIn,
    qty,
    lines,
    pre_tax: round2(preTax),
    tax: round2(tax),
    fsc: round2(fsc),
    total: round2(total),
    floor_total: floorPreTax !== undefined
      ? round2(floorPreTax * BGC_MARKUPS.tax_fsc_shortcut)
      : undefined,
    warnings,
  };
}

// Glass products available for shop quoting (anything carrying sheet pricing)
export function getShopGlassProducts(): GlassType[] {
  return glassTypes.filter(g => g.bgc_pricing);
}
