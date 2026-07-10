// ============================================================
// BGC PRICING — Baltimore Glass Company, Inc. Products & Pricing
// Transcribed 1:1 from the "BGC Pricing Document" (company pricing
// sheet, incl. handwritten rates). This is the company's TRUE
// retail/shop pricing. All dollar figures live here — the engine
// only applies these formulas.
//
// Document rules:
//   - Glass is sold by every 2" increment (round up)
//   - Each pane is a "glass lite", one per opening
//   - 144 sq. in. = 1 sq. ft.; minimum 1 sq. ft. per lite
//   - Formula General (shop): W×H = sqft × selling price
//       = sale price + tax + fuel surcharge = Total
//   - Formula Linear Inches: (L+W)×2 = linear inches × edgework
//       price = cost of edging
//   - Window repair: sqft × glass rate = glass cost + labor
//       = total cost × 1.75 = Total (then + tax + FSC)
//   - Heavy glass (3/8, 1/2, 3/4) is "cost plus" from Oldcastle
//       (OBE): cost × sqft + edging = subtotal × 1.13 (OBE FSC)
//       = cost × 2.0 markup (1.85 if customer complains)
//       = sale + tax + FSC
// ============================================================

// ---- Markups, tax, surcharges ----
export const BGC_MARKUPS = {
  sales_tax: 0.06,             // MD sales tax
  fuel_surcharge: 0.05,        // BGC fuel surcharge (FSC)
  tax_fsc_shortcut: 1.11,      // "Short cut is using 1.11 multiplier for 0.05 + 0.06 tax and FSC"
  repair_markup: 1.75,         // window repair: total cost × 1.75
  heavy_glass_markup: 2.0,     // cost-plus markup on heavy glass
  heavy_glass_markup_floor: 1.85, // "If customer complains about price, re-calculate using 1.85"
  obe_fuel_surcharge: 1.13,    // Oldcastle Building Envelope fuel surcharge
  shape_charge_low: 1.30,      // shape charge (ovals, circles) — Bel Pre
  shape_charge_high: 1.35,
  bel_pre_fsc: 1.1,            // Bel Pre fuel surcharge on shapes
};

// ---- Geometry / rounding rules ----
export const BGC_RULES = {
  min_sf_per_lite: 1,          // "Minimum: 1 sq. ft."
  size_increment_in: 2,        // "Glass is sold by every 2\" increment (round up)"
  sq_in_per_sf: 144,           // "144\" equals one sq. ft."
};

// ---- Edgework, per linear inch (already marked up per document) ----
export const BGC_EDGEWORK_PER_INCH = {
  thin: 0.15,     // up to 1/4"
  medium: 0.20,   // 3/8" – 1/2"
  thick: 0.30,    // 3/4" and up
};

// ---- Repair labor (per lite) ----
export const BGC_REPAIR_LABOR = {
  push_in_vinyl: 30,   // "$30 Labor is for push in vinyl"
  wrap_around: 35,     // "use $35 as Labor for wrap around glazing (marine glazing, vinyl replacement windows, patio doors)"
  ss_ds_window: 20,    // SS/DS window repair formula uses $20 labor
  putty_adder: 30,     // "(+$30 for putty)"
};

// ---- Glass sq. ft. sell rates (flat-rate shop pricing, marked up) ----
// CC = clean cut; polished = polished edges (PE)
export const BGC_GLASS_SELL_RATES = {
  ss_3_32: { cc: 8, polished: 8 },        // SS sell @ $8 sqft CC or w/ swiped edges
  ds_1_8: { cc: 9, polished: 9 },         // "We use $9.00 for all 1/8 DS glass"
  plate_3_16_1_4: { cc: 14, polished: 16 },
  mirror: { cc: 16, polished: 18 },       // 1/8 and 1/4 mirror share rates
  lami_1_4: { cc: 18, polished: 18 },     // "1/4 cl lami — $18 square"
  lami_1_8: { cc: 25, polished: 25 },     // "1/8 cl lami — $25 square"
  ig_5_8_clear: { cc: 10, polished: 10 },
  ig_other: { cc: 11.5, polished: 11.5 }, // "Other types of IG's 11.50"
  ig_low_e: { cc: 12, polished: 12 },
  ig_clear_mullions: { cc: 13, polished: 13 },  // clear w/ up to 3 mullions
  ig_low_e_mullions: { cc: 14, polished: 14 },  // Low-E w/ up to 3 mullions; >3 check OBE
};

// ---- Heavy glass cost-plus (OBE = Oldcastle Building Envelope) ----
export const BGC_HEAVY_GLASS = {
  heavy_3_8: { obe_cost_per_sf: 7.78, edge_cost_per_inch: 0.15 },
  heavy_1_2: { obe_cost_per_sf: 8.35, edge_cost_per_inch: 0.17 },
  // 3/4" also cost-plus — cost from OBE quote at time of order
};

// ---- Shapes (ovals, circles) — Bel Pre supplier ----
export const BGC_SHAPES = {
  bel_pre_3_8_cost_per_sf: 6.75,   // "$6.75 is Bel Pre's price per sq. ft."
  bel_pre_edge_per_inch: 0.14,     // "0.14 is Bel Pre's edge work price (our cost)"
};

// Lite geometry from total SF + opening count.
// Billable area uses the entered SF directly (min 1 sqft per lite) so the
// engine reproduces the price sheet's worked examples exactly. The 2"
// round-up applies to lite DIMENSIONS, which the estimator doesn't collect;
// lites are assumed square and the rounded side is used only to estimate
// edgework perimeter ((L+W)×2).
export function computeBgcLiteGeometry(totalSF: number, numOpenings?: number) {
  const lites = Math.max(1, Math.floor(numOpenings || 1));
  const liteSF = Math.max(totalSF / lites, BGC_RULES.min_sf_per_lite);
  const rawSideIn = Math.sqrt(liteSF * BGC_RULES.sq_in_per_sf);
  const sideIn = Math.ceil(rawSideIn / BGC_RULES.size_increment_in) * BGC_RULES.size_increment_in;
  return {
    lites,
    side_in: sideIn, // assumed square side, rounded up to 2" increment
    lite_sf: liteSF,
    billable_sf: liteSF * lites,
    perimeter_in_per_lite: sideIn * 4, // (L+W)×2
  };
}
