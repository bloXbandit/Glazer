// Regression check: engine output vs BGC Pricing Document worked examples
// Run with: npx tsx scripts/verify-bgc.ts
import { runEstimate } from '../src/lib/estimateEngine';
import type { EstimateInput } from '../src/types';

const base: Omit<EstimateInput, 'work_type_id' | 'glass_type_id' | 'total_sf'> = {
  region_id: 'baltimore',
  project_type: 'private' as EstimateInput['project_type'],
  building_type: 'retail' as EstimateInput['building_type'],
  work_condition: 'renovation' as EstimateInput['work_condition'],
  access_condition: 'ground_level' as EstimateInput['access_condition'],
  num_openings: 1,
  mode: 'Detailed' as EstimateInput['mode'],
};

function check(label: string, actual: number, expected: number, tol = 0.01) {
  const ok = Math.abs(actual - expected) <= tol;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: got ${actual.toFixed(2)}, expected ${expected.toFixed(2)}`);
  if (!ok) process.exitCode = 1;
}

// 1. PDF example — DS glass 24"x36" = 6 sqft × $9 = $54 × 1.11 = $59.94
{
  const r = runEstimate({ ...base, work_type_id: 'decorative_glass', glass_type_id: 'bgc_ds_1_8', total_sf: 6 });
  check('DS 24x36 shop sale total', r.result.grand_total, 59.94);
  check('DS sale pre-tax (material)', r.result.total_material, 54);
}

// 2. PDF example — window repair, 5/8" clear IG 24"x32" = 5.33 sqft
//    (5.3333×10 + 30) × 1.75 × 1.11 — PDF rounds glass to $50 → $155.40; unrounded = $161.88
{
  const r = runEstimate({ ...base, work_type_id: 'residential_window', glass_type_id: 'bgc_ig_5_8_clear', total_sf: 768 / 144 });
  const glass = (768 / 144) * 10;
  const expected = (glass + 30) * 1.75 * 1.11;
  check('IG repair total (unrounded formula)', r.result.grand_total, expected);
  check('IG repair labor', r.result.total_labor, 30);
}

// 3. PDF formula — 3/8" heavy glass 48"x32" = 10.67 sqft cost-plus
//    (sqft×7.78 + 160"×0.15) × 1.13 × 2.0 × 1.11
{
  const sf = 1536 / 144;
  const r = runEstimate({ ...base, work_type_id: 'decorative_glass', glass_type_id: 'bgc_heavy_3_8', total_sf: sf });
  const expected = (sf * 7.78 + 160 * 0.15) * 1.13 * 2.0 * 1.11;
  check('3/8 heavy cost-plus total', r.result.grand_total, expected);
}

// 4. Minimum 1 sqft per lite
{
  const r = runEstimate({ ...base, work_type_id: 'decorative_glass', glass_type_id: 'bgc_ss_3_32', total_sf: 0.5 });
  check('SS min 1 sqft billed ($8 × 1.11)', r.result.grand_total, 8 * 1.11);
}

// 5. SS/DS window repair formula: sqft × $5 + $20 labor × 1.75 × 1.11
{
  const r = runEstimate({ ...base, work_type_id: 'residential_window', glass_type_id: 'bgc_ss_3_32', total_sf: 4 });
  check('SS repair total', r.result.grand_total, (4 * 5 + 20) * 1.75 * 1.11);
}

// 6. Commercial path regression — storefront unchanged (overhead 15% still applies)
{
  const r = runEstimate({
    ...base, work_type_id: 'storefront', glass_type_id: 'standard_clear_igs',
    total_sf: 2500, num_openings: 40, work_condition: 'new_construction' as EstimateInput['work_condition'],
    building_type: 'office' as EstimateInput['building_type'],
  });
  const ok = r.result.grand_total > 0 && Math.abs(r.result.total_overhead - r.result.total_direct * 0.15) < 0.01 && r.result.total_tax === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  storefront commercial path intact (grand=$${r.result.grand_total.toFixed(0)}, overhead=15% of direct, no tax)`);
  if (!ok) process.exitCode = 1;
}

// ---- Shop quote path (real W×H dimensions) ----
import { runShopQuote } from '../src/lib/shopQuote';
import type { ShopQuoteInput } from '../src/lib/shopQuote';

const shopBase: Omit<ShopQuoteInput, 'glass_type_id' | 'width_in' | 'height_in'> = {
  qty: 1,
  edge_finish: 'clean_cut',
  is_repair: false,
  repair_labor: 'push_in_vinyl',
  add_putty: false,
  is_shape: false,
};

// 7. PDF example — DS 24"x36" shop sale = $59.94
{
  const q = runShopQuote({ ...shopBase, glass_type_id: 'bgc_ds_1_8', width_in: 24, height_in: 36 });
  check('shop: DS 24x36 out the door', q.total, 59.94);
}

// 8. 2" increment rounding — 23x35 bills as 24x36
{
  const q = runShopQuote({ ...shopBase, glass_type_id: 'bgc_ds_1_8', width_in: 23, height_in: 35 });
  check('shop: 23x35 rounds to 24x36 (same price)', q.total, 59.94);
  check('shop: rounded width', q.rounded_width_in, 24);
}

// 9. Min 1 sqft — 10x10 SS
{
  const q = runShopQuote({ ...shopBase, glass_type_id: 'bgc_ss_3_32', width_in: 10, height_in: 10 });
  check('shop: SS 10x10 min 1 sqft', q.total, 8 * 1.11);
}

// 10. Polished plate — 24x36 = 6 sqft × $16 vs $14 CC
{
  const cc = runShopQuote({ ...shopBase, glass_type_id: 'bgc_plate_3_16_1_4', width_in: 24, height_in: 36 });
  const pe = runShopQuote({ ...shopBase, glass_type_id: 'bgc_plate_3_16_1_4', width_in: 24, height_in: 36, edge_finish: 'polished' });
  check('shop: plate CC', cc.total, 6 * 14 * 1.11);
  check('shop: plate polished', pe.total, 6 * 16 * 1.11);
}

// 11. PDF example — IG repair 24x32: (5.333×$10 + $30) × 1.75 × 1.11
{
  const q = runShopQuote({ ...shopBase, glass_type_id: 'bgc_ig_5_8_clear', width_in: 24, height_in: 32, is_repair: true });
  check('shop: IG repair 24x32', q.total, ((768 / 144) * 10 + 30) * 1.75 * 1.11);
}

// 12. Repair options — DS wrap-around + putty: (6×$6 + $35 + $30) × 1.75 × 1.11
{
  const q = runShopQuote({
    ...shopBase, glass_type_id: 'bgc_ds_1_8', width_in: 24, height_in: 36,
    is_repair: true, repair_labor: 'wrap_around', add_putty: true,
  });
  check('shop: DS repair wrap-around + putty', q.total, (6 * 6 + 35 + 30) * 1.75 * 1.11);
}

// 13. PDF formula — 3/8" heavy rectangle 48x32 cost-plus
{
  const q = runShopQuote({ ...shopBase, glass_type_id: 'bgc_heavy_3_8', width_in: 48, height_in: 32 });
  check('shop: 3/8 heavy 48x32', q.total, ((1536 / 144) * 7.78 + 160 * 0.15) * 1.13 * 2.0 * 1.11);
}

// 14. PDF example — 3/8" oval 48x24 (Bel Pre): (8×6.75 + 144×0.14) × 1.35 × 2.0 = $200.23 pre-tax
{
  const q = runShopQuote({ ...shopBase, glass_type_id: 'bgc_heavy_3_8', width_in: 48, height_in: 24, is_shape: true });
  check('shop: 3/8 oval pre-tax (PDF $200.23)', q.pre_tax, (8 * 6.75 + 144 * 0.14) * 1.35 * 2.0);
  check('shop: 3/8 oval out the door', q.total, (8 * 6.75 + 144 * 0.14) * 1.35 * 2.0 * 1.11);
}

// 15. PDF example — 48" circle (Bel Pre) at 1.85 floor markup
{
  const q = runShopQuote({ ...shopBase, glass_type_id: 'bgc_heavy_3_8', width_in: 48, height_in: 48, is_shape: true });
  const expectedFloor = (16 * 6.75 + 192 * 0.14) * 1.35 * 1.85 * 1.11;
  check('shop: 48" circle floor total', q.floor_total ?? 0, expectedFloor);
}

console.log('\nDone.');
