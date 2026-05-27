// ============================================================
// PROCUREMENT PARSER — Deterministic Normalization Engine
// Converts raw proposal / bid tab / scope text into structured
// ScopeIntelligence. No AI required for this layer.
//
// Authority: historical_scope_intelligence ONLY
// Pricing extracted here is PROPOSED, not verified_pricing_authority,
// unless document_type is 'purchase_order' or 'subcontract_exhibit'
// AND quantity + award values are confirmed.
// ============================================================

import type {
  ProcurementDocumentInput,
  ScopeIntelligence,
  ProcurementLineItem,
  FurnishInstallBreakdown,
  FurnishInstallType,
  LeadTimeEntry,
  MobilizationAssumption,
  AccessAssumption,
  WarrantyTerm,
  ProcurementRiskFlag,
  PriceConfidence,
} from '@/types';

// ── Work type keyword map ─────────────────────────────────────
// Maps natural language terms → WorkType IDs

const WORK_TYPE_KEYWORDS: Record<string, string[]> = {
  storefront: [
    'storefront', 'store front', 'aluminum storefront', 'commercial storefront',
    'thermally broken storefront', 'entrance storefront', 'kawneer 350',
    'ykk afs', '08 41', 'csi 08410', 'entrances and storefronts',
  ],
  stick_curtain_wall: [
    'stick curtain wall', 'stick-built curtain wall', 'field-glazed curtain wall',
    'field glazed', 'stick system', 'kawneer 1600', 'ykk 501t',
    '08 44', 'curtain wall system', 'aluminum curtain wall',
  ],
  unitized_curtain_wall: [
    'unitized curtain wall', 'unitized system', 'factory-glazed', 'factory glazed',
    'panel system', 'unitized panels', 'pre-glazed', 'pre-assembled panels',
    'unitized wall', 'unit system',
  ],
  window_wall: [
    'window wall', 'window-wall', 'punched window', 'ribbon window',
    'spandrel', 'window wall system', 'floor-to-floor window',
  ],
  interior_partition: [
    'interior glass', 'interior partition', 'glass partition', 'frameless glass',
    'office partition', 'demountable', 'sliding glass door', 'interior glazing',
    'conference room glass',
  ],
  glass_railing: [
    'glass railing', 'glass guardrail', 'frameless railing', 'point-supported railing',
    'tempered glass railing', 'laminated railing', 'glass balustrade',
  ],
  skylight: [
    'skylight', 'sky light', 'overhead glazing', 'sloped glazing', 'roof glazing',
    'atrium', 'barrel vault', 'structural silicone skylight',
  ],
  fire_rated: [
    'fire-rated', 'fire rated', 'fire glass', 'rated glazing', '20-minute',
    '45-minute', '60-minute', '90-minute', 'pilkington pyrostop', 'firelite',
    'contraflam', 'fire door lite', 'fire partition',
  ],
  blast_security: [
    'blast', 'blast-resistant', 'laminated security', 'ballistic', 'forced entry',
    'gsa pbs', 'isc criteria', 'forced entry resistant', 'interlayer',
    'security glazing', 'blast film', 'sgp interlayer',
  ],
  residential_window: [
    'residential window', 'window replacement', 'home window', 'replace window',
    'patio door', 'sliding glass door', 'sliding door', 'storm window',
    'storm door', 'double-hung', 'single-hung', 'casement window',
    'picture window', 'rowhouse window', 'townhome window', 'house window',
  ],
  decorative_glass: [
    'shower enclosure', 'shower door', 'frameless shower', 'shower glass',
    'mirror', 'beveled mirror', 'bathroom mirror', 'vanity mirror',
    'table top', 'glass table', 'glass shelf', 'glass shelving', 'glass cabinet',
    'stained glass', 'patterned glass', 'decorative glass', 'tinted glass',
    'frosted glass', 'etched glass', 'leaded glass', 'art glass',
    'screen repair', 'diy glass', 'custom cut glass', 'cut glass',
  ],
};

// ── Inclusion patterns ────────────────────────────────────────

const INCLUSION_PATTERNS: RegExp[] = [
  /(?:includes?|including|scope includes?|included in (?:base |this )?(?:bid|price|proposal|scope)):?\s*([^.\n]{10,120})/gi,
  /(?:furnish(?:ing)?s? and install(?:ing)?s?|f&i|f\/i):?\s*([^.\n]{10,100})/gi,
  /(?:this (?:bid|proposal|price) includes?):?\s*([^.\n]{10,120})/gi,
  /(?:^|\n)\s*[•\-\*✓]\s*((?:aluminum|glass|glazing|framing|sealant|anchor|fastener|hardware|shop drawing)[^.\n]{0,100})/gi,
];

// ── Exclusion patterns ────────────────────────────────────────

const EXCLUSION_PATTERNS: RegExp[] = [
  /(?:excludes?|excluding|not included|not in(?:cluded)?(?: in)? (?:this )?(?:bid|price|proposal|scope)|n\.?i\.?c\.?|by others?|owner furnished|gfco|gfce|by (?:gc|general contractor|owner)):?\s*([^.\n]{10,120})/gi,
  /(?:this (?:bid|proposal|price) (?:does not include|excludes?)):?\s*([^.\n]{10,120})/gi,
  /(?:^|\n)\s*(?:exclude[sd]?|not included):?\s*([^.\n]{10,120})/gi,
];

// ── Lead time patterns ────────────────────────────────────────

const LEAD_TIME_PATTERNS: RegExp[] = [
  /(?:lead time|delivery|material lead|fabrication|manufacturing):?\s*(?:is\s+)?(?:approximately\s+)?(\d+)[\s-]+(?:to[\s-]+(\d+))?\s*weeks?/gi,
  /(\d+)[\s-]+(?:to[\s-]+(\d+))?\s*weeks?\s+(?:lead|delivery|fabrication|from (?:approved )?shop drawings?|from (?:notice to proceed|ntp)|from (?:purchase order|p\.?o\.?))/gi,
  /(?:lead time|delivery):?\s*(\d+)\s*-\s*(\d+)\s*weeks?/gi,
];

// ── Warranty patterns ─────────────────────────────────────────

const WARRANTY_PATTERNS: RegExp[] = [
  /(\d+)[- ]?year\s+(?:workmanship\s+)?warranty/gi,
  /warranty:?\s+(\d+)\s+years?/gi,
  /(?:guarantee|guaranty):?\s+(\d+)\s+years?/gi,
];

// ── Mobilization patterns ─────────────────────────────────────

const MOB_PATTERNS: RegExp[] = [
  /mob(?:ilization)?\/demob(?:ilization)?:?\s*\$?([\d,]+(?:\.\d{2})?)?/gi,
  /mobilization(?:\s+(?:and|\/)\s+demobilization)?:?\s*(?:included|included in (?:base|price)|lump sum|ls)?/gi,
  /(?:\$|dollar)\s*([\d,]+(?:\.\d{2})?)\s*(?:mob|mobilization)/gi,
];

// ── Access patterns ───────────────────────────────────────────

const ACCESS_PATTERNS: RegExp[] = [
  /(swing\s*stage|mast\s*climber|scissor\s*lift|boom\s*lift|scaffold(?:ing)?|rope\s*access|suspended\s*platform|aerial\s*lift|man\s*lift|articulating\s*lift)/gi,
  /(?:access|rigging|lift equipment|staging):?\s*(?:by\s+)?(gc|general contractor|owner|sub|subcontractor|included|not included)/gi,
  /(?:all\s*)?(?:access\s*)?equipment\s+(?:provided|furnished|by)\s+(gc|general contractor|owner|sub)/gi,
];

// ── Pricing patterns ──────────────────────────────────────────

const PRICE_PATTERNS: RegExp[] = [
  /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:\/\s*(sf|lf|ea|ls|each|per sf|per lf))?(?:\s+[-–]\s+([^$\n]{5,80}))?/gi,
  /([\d,]+(?:\.\d{2})?)\s*(?:sf|lf|ea)\s*[@×x]\s*\$?\s*([\d.]+)/gi,
];

// ── F&I split detection ───────────────────────────────────────

function detectFurnishInstall(text: string): FurnishInstallBreakdown {
  const lower = text.toLowerCase();

  const installOnly = /(install\s+only|installation\s+only|install-only|owner\s+furnished|gfco|gfce|sub\s+to\s+install|materials?\s+by\s+(gc|owner))/.test(lower);
  const furnishOnly = /(furnish\s+only|supply\s+only|material\s+only|no\s+install)/.test(lower);
  const designAssist = /(design[- ]assist|da\s+phase)/.test(lower);
  const delegated = /(delegated\s+design|engineer\s+of\s+record|pe\s+stamp|structural\s+engineer\s+of\s+record)/.test(lower);

  // Try to detect split percentages (e.g. "65% material / 35% labor")
  const splitMatch = lower.match(/(\d{2})\s*%\s*(?:material|mat(?:erials?)?)\s*[/,]\s*(\d{2})\s*%\s*(?:labor|labour|install)/);
  const materialPct = splitMatch ? parseInt(splitMatch[1]) : undefined;
  const laborPct = splitMatch ? parseInt(splitMatch[2]) : undefined;

  // Owner-furnished detection
  const ownerFurnished = /(owner[\s-]furnished|owner[\s-]supplied|o\.f\.|o\.s\.|materials?\s+by\s+owner)/.test(lower);
  const gcFurnished = /(gc[\s-]furnished|gc[\s-]supplied|materials?\s+by\s+(?:gc|general\s+contractor))/.test(lower);

  if (delegated) {
    return { material_by: 'sub', install_by: 'sub', notes: 'Delegated design scope — sub responsible for engineering, material, and install.' };
  }
  if (designAssist) {
    return { material_by: 'unspecified', install_by: 'unspecified', notes: 'Design-assist phase — pricing to be confirmed after design development.' };
  }
  if (installOnly || ownerFurnished) {
    return { material_by: ownerFurnished ? 'owner' : gcFurnished ? 'gc' : 'gc', install_by: 'sub', material_percentage: materialPct, labor_percentage: laborPct, notes: 'Install-only scope. Material furnished by others.' };
  }
  if (furnishOnly) {
    return { material_by: 'sub', install_by: 'gc', notes: 'Furnish-only scope. Installation by GC or others.' };
  }

  return {
    material_by: 'sub',
    install_by: 'sub',
    material_percentage: materialPct,
    labor_percentage: laborPct,
    notes: 'Full furnish and install scope assumed unless exclusions specify otherwise.',
  };
}

// ── F&I type for individual line items ────────────────────────

function detectLineItemFI(description: string): FurnishInstallType {
  const d = description.toLowerCase();
  if (/(install\s+only|installation\s+only|owner[\s-]furnished|gfco|gfce)/.test(d)) return 'install_only';
  if (/(furnish\s+only|supply\s+only|material\s+only)/.test(d)) return 'furnish_only';
  if (/(design[\s-]assist)/.test(d)) return 'design_assist';
  if (/(delegated\s+design)/.test(d)) return 'delegated_design';
  return 'furnish_and_install';
}

// ── Price confidence from document type ──────────────────────

function docTypeToPriceConfidence(docType: ProcurementDocumentInput['document_type']): PriceConfidence {
  switch (docType) {
    case 'purchase_order':
    case 'subcontract_exhibit':
      return 'awarded';
    case 'scope_exhibit':
      return 'leveled';
    case 'bid_tab':
      return 'leveled';
    case 'change_order_proposal':
      return 'proposed';
    case 'rfq_response':
    case 'subcontractor_proposal':
    case 'submittal_cover':
    default:
      return 'proposed';
  }
}

// ── Extract inclusions ────────────────────────────────────────

function extractInclusions(text: string): string[] {
  const found: string[] = [];
  for (const pattern of INCLUSION_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1]?.trim().replace(/[;,]+$/, '');
      if (item && item.length > 8 && !found.includes(item)) {
        found.push(item);
      }
    }
  }
  return found.slice(0, 30);
}

// ── Extract exclusions ────────────────────────────────────────

function extractExclusions(text: string): string[] {
  const found: string[] = [];
  for (const pattern of EXCLUSION_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1]?.trim().replace(/[;,]+$/, '');
      if (item && item.length > 8 && !found.includes(item)) {
        found.push(item);
      }
    }
  }
  return found.slice(0, 30);
}

// ── Detect glazing systems ────────────────────────────────────

function detectGlazingSystems(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [workTypeId, keywords] of Object.entries(WORK_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        if (!found.includes(workTypeId)) found.push(workTypeId);
        break;
      }
    }
  }
  return found;
}

// ── Extract lead times ────────────────────────────────────────

function extractLeadTimes(text: string): LeadTimeEntry[] {
  const found: LeadTimeEntry[] = [];
  for (const pattern of LEAD_TIME_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const weeksMin = parseInt(match[1]);
      const weeksMax = match[2] ? parseInt(match[2]) : undefined;
      const contextStart = Math.max(0, match.index - 60);
      const contextEnd = Math.min(text.length, match.index + match[0].length + 60);
      const context = text.slice(contextStart, contextEnd);

      const clockStart = /from\s+approved\s+shop\s+drawings?/i.test(context)
        ? 'from approved shop drawings'
        : /from\s+(?:purchase\s+order|p\.?o\.?)/i.test(context)
          ? 'from purchase order'
          : /from\s+(?:notice\s+to\s+proceed|ntp)/i.test(context)
            ? 'from NTP'
            : 'from order placement';

      const itemMatch = context.match(/(unitized\s+panels?|curtain\s+wall|storefront|glass|framing|specialty\s+glass|igt?u?s?|insulating\s+glass)/i);
      const item = itemMatch ? itemMatch[0].trim() : 'Glazing system';

      found.push({
        item,
        weeks_min: isNaN(weeksMin) ? undefined : weeksMin,
        weeks_max: weeksMax && !isNaN(weeksMax) ? weeksMax : undefined,
        weeks_typical: weeksMax ? Math.round((weeksMin + weeksMax) / 2) : weeksMin,
        clock_start: clockStart,
      });
    }
  }
  // Deduplicate by weeks_min + item
  const seen = new Set<string>();
  return found.filter(lt => {
    const key = `${lt.item}-${lt.weeks_min}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Extract warranty ──────────────────────────────────────────

function extractWarranty(text: string): WarrantyTerm | null {
  for (const pattern of WARRANTY_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const years = parseInt(match[1]);
      const lower = text.toLowerCase();
      const laborIncluded = !/(labor\s+(?:not|excluded)|no\s+labor\s+warranty)/.test(lower);
      const glassExcluded = /(glass\s+breakage\s+excluded|glass\s+not\s+warranted|breakage\s+excluded)/.test(lower);
      return {
        scope: 'Glazing workmanship and weathertightness',
        years: isNaN(years) ? 1 : years,
        labor_included: laborIncluded,
        material_included: true,
        glass_breakage_excluded: glassExcluded,
        notes: `${years}-year warranty detected from proposal text.`,
      };
    }
  }
  return null;
}

// ── Extract mobilization ──────────────────────────────────────

function extractMobilization(text: string): MobilizationAssumption {
  const lower = text.toLowerCase();
  const hasMob = /(mob(?:ilization)?|demob(?:ilization)?)/.test(lower);
  if (!hasMob) {
    return { included: false, notes: 'No mobilization line item detected in proposal.' };
  }
  const isIncluded = /(mob(?:ilization)?\s+included|included\s+in\s+(?:base|price)|lump\s+sum\s+(?:includes?|incl))/.test(lower);
  const costMatch = text.match(/mob(?:ilization)?\s*[:\-]?\s*\$\s*([\d,]+(?:\.\d{2})?)/i);
  const mobCost = costMatch ? parseFloat(costMatch[1].replace(/,/g, '')) : undefined;
  const tripsMatch = text.match(/(\d+)\s+(?:trip|mobilization)/i);
  const phasingMatch = text.match(/(?:phase[sd]?|phasing):?\s*([^.\n]{10,80})/i);

  return {
    included: isIncluded || !!costMatch,
    mob_cost: mobCost,
    trips_assumed: tripsMatch ? parseInt(tripsMatch[1]) : undefined,
    phasing_notes: phasingMatch ? phasingMatch[1].trim() : undefined,
    notes: costMatch
      ? `Mobilization/demob lump sum of $${mobCost?.toLocaleString()} detected.`
      : 'Mobilization referenced; confirm if included in base price or billed separately.',
  };
}

// ── Extract access assumptions ────────────────────────────────

function extractAccessAssumptions(text: string): AccessAssumption[] {
  const found: AccessAssumption[] = [];
  for (const pattern of ACCESS_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const method = match[1]?.toLowerCase() ?? 'unspecified';
      const contextStart = Math.max(0, match.index - 80);
      const contextEnd = Math.min(text.length, match.index + match[0].length + 80);
      const context = text.slice(contextStart, contextEnd).toLowerCase();

      const providedByGC = /(by\s+gc|by\s+general\s+contractor|gc\s+(?:to\s+)?provide|gc\s+furnished)/.test(context);
      const providedByOwner = /(by\s+owner|owner\s+(?:to\s+)?provide|owner\s+furnished)/.test(context);
      const includedInPrice = /(included|incl\.?|in\s+(?:base|price|bid))/.test(context);
      const notIncluded = /(not\s+included|excluded|not\s+in\s+(?:scope|bid|price))/.test(context);

      const floorMatch = context.match(/(?:floor(?:s)?\s+\d+|levels?\s+\d+|\d+(?:st|nd|rd|th)\s+floor)[^.]{0,30}/i);

      found.push({
        method: method.replace(/\s+/g, ' ').trim(),
        provided_by: providedByOwner ? 'owner' : providedByGC ? 'gc' : 'sub',
        floor_range: floorMatch ? floorMatch[0].trim() : undefined,
        included_in_price: notIncluded ? false : includedInPrice,
        assumptions_stated: [match[0].trim()],
      });
    }
  }
  // Deduplicate by method
  const seen = new Set<string>();
  return found.filter(a => {
    if (seen.has(a.method)) return false;
    seen.add(a.method);
    return true;
  });
}

// ── Extract line items ────────────────────────────────────────

function extractLineItems(text: string, priceConfidence: PriceConfidence): ProcurementLineItem[] {
  const found: ProcurementLineItem[] = [];
  let counter = 0;

  // Pattern: "$XXX,XXX SF description" or "description ... $XXX,XXX"
  const linePattern = /^.*\$\s*([\d,]+(?:\.\d{2})?).*$/gm;
  let match: RegExpExecArray | null;

  while ((match = linePattern.exec(text)) !== null && counter < 25) {
    const fullLine = match[0].trim();
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (isNaN(price) || price < 100) continue; // filter noise

    // Try to extract quantity and unit
    const qtyMatch = fullLine.match(/([\d,]+)\s*(sf|lf|ea|each|ls|lump\s+sum)/i);
    const quantity = qtyMatch ? parseFloat(qtyMatch[1].replace(/,/g, '')) : undefined;
    const unit = qtyMatch ? qtyMatch[2].toUpperCase() : 'LS';

    // Derive unit price
    const unitPrice = quantity && quantity > 0 ? price / quantity : price;

    // Clean the description (remove price and qty noise)
    const rawDesc = fullLine
      .replace(/\$\s*[\d,]+(?:\.\d{2})?/g, '')
      .replace(/[\d,]+\s*(sf|lf|ea|each|ls)/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 100);

    // Map to glazing system
    const systems = detectGlazingSystems(fullLine);

    found.push({
      id: `li-${++counter}`,
      description: rawDesc || fullLine.slice(0, 80),
      normalized_description: rawDesc || undefined,
      glazing_system_category: systems[0] ?? undefined,
      quantity,
      unit,
      unit_price: unitPrice,
      extended_price: price,
      price_confidence: priceConfidence,
      furnish_install: detectLineItemFI(fullLine),
      included_in_base: !/(alternate|add\/deduct|deduct|add alt)/i.test(fullLine),
      is_alternate: /(alternate|alt\s*\d)/i.test(fullLine),
    });
  }
  return found;
}

// ── Infer total SF ────────────────────────────────────────────

function extractTotalSF(text: string): number | undefined {
  const patterns = [
    /total\s+(?:glazed?\s+)?area:?\s*([\d,]+)\s*(?:s\.?f\.?|square\s+feet)/i,
    /([\d,]+)\s*(?:s\.?f\.?|square\s+feet)\s+(?:total|of\s+glazing|of\s+curtain\s+wall|of\s+storefront)/i,
    /(?:approx(?:imately)?\.?\s+)?([\d,]+)\s*sf/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const v = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(v) && v > 50 && v < 5_000_000) return v;
    }
  }
  return undefined;
}

// ── Infer total price ─────────────────────────────────────────

function extractTotalPrice(text: string): number | undefined {
  const patterns = [
    /(?:total|lump\s+sum|grand\s+total|contract\s+(?:amount|value|price)|base\s+bid):?\s*\$\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:our\s+)?(?:base\s+)?(?:bid|price|proposal)\s+(?:amount|total)?:?\s*\$\s*([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:total|lump\s+sum|ls)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const v = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(v) && v > 1000) return v;
    }
  }
  return undefined;
}

// ── Risk flag generation ──────────────────────────────────────

function generateRiskFlags(
  inclusions: string[],
  exclusions: string[],
  accessAssumptions: AccessAssumption[],
  lineItems: ProcurementLineItem[],
  text: string,
  docType: ProcurementDocumentInput['document_type'],
): ProcurementRiskFlag[] {
  const flags: ProcurementRiskFlag[] = [];
  const lower = text.toLowerCase();
  let flagId = 0;
  const id = () => `prf-${String(++flagId).padStart(3, '0')}`;

  // 1. No exclusions listed at all
  if (exclusions.length === 0) {
    flags.push({
      id: id(),
      category: 'scope_gap',
      severity: 'High',
      description: 'No exclusions were detected in this proposal. Scope gaps are likely.',
      recommendation: 'Request a detailed exclusions list from the subcontractor before bid leveling. Assume all scope is included until confirmed excluded.',
    });
  }

  // 2. Permits excluded
  if (/(permit(?:s)?\s+(?:by\s+others|excluded|not\s+included)|permit(?:s)?\s+n\.?i\.?c\.?)/.test(lower)) {
    flags.push({
      id: id(),
      category: 'compliance',
      severity: 'Medium',
      description: 'Permits are excluded from this proposal.',
      source_text: exclusions.find(e => /permit/.test(e.toLowerCase())),
      recommendation: 'Confirm permit responsibility and cost with GC before finalizing subcontract. Glazing permits in DC/MD/VA can run $2,000–$15,000 depending on jurisdiction and scope.',
    });
  }

  // 3. Engineering / PE stamp excluded
  if (/(engineer(?:ing)?\s+(?:by\s+others|excluded|not\s+included)|delegated\s+design\s+(?:by\s+others|excluded)|shop\s+drawing\s+engineering\s+excluded)/.test(lower)) {
    flags.push({
      id: id(),
      category: 'compliance',
      severity: 'High',
      description: 'Delegated design / PE engineering is excluded. Who stamps the shop drawings?',
      recommendation: 'Identify whether GC\'s structural engineer or a third-party PE covers the glazing delegation. Budget $8,000–$25,000 for glazing engineering if not covered.',
    });
  }

  // 4. Prevailing wage / Davis-Bacon not acknowledged
  if (/(government|federal|public\s+work|davis.?bacon|prevailing\s+wage)/.test(lower)) {
    if (!/(prevailing\s+wage\s+(?:included|applied|compliant)|davis.?bacon\s+(?:included|compliant|applied))/.test(lower)) {
      flags.push({
        id: id(),
        category: 'compliance',
        severity: 'High',
        description: 'Government/public project detected but prevailing wage compliance is not explicitly stated.',
        recommendation: 'Require written confirmation that labor rates comply with applicable Davis-Bacon or state prevailing wage determinations. Non-compliance creates owner liability.',
      });
    }
  }

  // 5. Price escalation clause
  if (/(price(?:s)?\s+(?:subject\s+to\s+)?escalation|material\s+price\s+(?:escalation|increase)|price\s+(?:valid|firm)\s+for\s+(\d+)\s+days?)/.test(lower)) {
    const validMatch = lower.match(/price\s+valid\s+for\s+(\d+)\s+days?/);
    flags.push({
      id: id(),
      category: 'price_escalation',
      severity: 'Medium',
      description: validMatch
        ? `Proposal price is valid for ${validMatch[1]} days only. Material escalation clause present.`
        : 'Material escalation clause or limited price validity detected.',
      recommendation: 'Lock in pricing before bid submission. Request firm price through award plus 90 days. Aluminum pricing has been volatile.',
    });
  }

  // 6. Access not clearly defined
  if (accessAssumptions.length === 0 && /(high.?rise|above\s+(?:3rd|4th|5th|6th|7th|8|9|10)\s+floor|curtain\s+wall|swing\s+stage)/.test(lower)) {
    flags.push({
      id: id(),
      category: 'access',
      severity: 'High',
      description: 'Access equipment is not clearly specified in this proposal despite apparent high-elevation scope.',
      recommendation: 'Confirm whether swing stage, mast climber, or aerial lift is included. Access can represent $15–$40/SF on high-rise scopes.',
    });
  }

  // 7. Glass breakage / damage not addressed
  if (!/(glass\s+breakage|broken\s+glass|glass\s+damage|glass\s+replacement)/.test(lower)) {
    flags.push({
      id: id(),
      category: 'scope_gap',
      severity: 'Low',
      description: 'Glass breakage responsibility during construction is not addressed.',
      recommendation: 'Add a clause to the subcontract specifying who bears the cost of glass broken after installation and before substantial completion.',
    });
  }

  // 8. Long lead items without schedule coordination noted
  if (lower.includes('lead time') && !/(schedule|submittal\s+date|approval\s+date|ntp|notice\s+to\s+proceed|milestone)/.test(lower)) {
    flags.push({
      id: id(),
      category: 'schedule',
      severity: 'Medium',
      description: 'Lead times are stated but no submittal/approval milestone is referenced.',
      recommendation: 'Coordinate submittal submission and approval dates with GC\'s procurement schedule. Late approvals shift the procurement clock and create schedule float exposure.',
    });
  }

  // 9. No warranty stated and document is a proposal
  if (docType === 'subcontractor_proposal' && !(/(warranty|warranted|guaranty|guarantee)/.test(lower))) {
    flags.push({
      id: id(),
      category: 'scope_gap',
      severity: 'Low',
      description: 'No warranty terms are stated in this proposal.',
      recommendation: 'Request warranty terms before executing subcontract. Minimum expectation: 2-year workmanship warranty on glazing systems. GANA recommends 1-year weathertightness minimum.',
    });
  }

  // 10. Unit prices missing for large scope
  const hasUnitPrices = lineItems.some(li => li.unit_price !== undefined && li.unit !== 'LS');
  if (!hasUnitPrices && lineItems.length > 0) {
    flags.push({
      id: id(),
      category: 'scope_gap',
      severity: 'Medium',
      description: 'No unit prices ($/SF or $/LF) detected — scope is priced as lump sum only.',
      recommendation: 'Request unit prices for all glazing system categories to support quantity adjustments and change order pricing during construction.',
    });
  }

  return flags;
}

// ── Compute parse confidence ──────────────────────────────────

function computeParseConfidence(
  inclusions: string[],
  exclusions: string[],
  lineItems: ProcurementLineItem[],
  text: string,
): 'high' | 'medium' | 'low' {
  let score = 0;
  if (inclusions.length >= 3) score++;
  if (exclusions.length >= 2) score++;
  if (lineItems.length >= 2) score++;
  if (text.length > 500) score++;
  if (text.length > 2000) score++;
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

// ============================================================
// MAIN EXPORT — deterministic parse
// ============================================================

export function parseProcurementDocument(
  input: ProcurementDocumentInput,
  documentId?: string,
): ScopeIntelligence {
  const { raw_text, document_type } = input;
  const priceConfidence = docTypeToPriceConfidence(document_type);

  const inclusions = extractInclusions(raw_text);
  const exclusions = extractExclusions(raw_text);
  const glazingSystems = detectGlazingSystems(raw_text);
  const leadTimes = extractLeadTimes(raw_text);
  const warranty = extractWarranty(raw_text);
  const mobilization = extractMobilization(raw_text);
  const accessAssumptions = extractAccessAssumptions(raw_text);
  const lineItems = extractLineItems(raw_text, priceConfidence);
  const furnishInstall = detectFurnishInstall(raw_text);
  const totalSF = extractTotalSF(raw_text);
  const totalPrice = extractTotalPrice(raw_text);
  const risks = generateRiskFlags(inclusions, exclusions, accessAssumptions, lineItems, raw_text, document_type);
  const parseConfidence = computeParseConfidence(inclusions, exclusions, lineItems, raw_text);

  const docId = documentId ?? `doc-${Date.now()}`;

  return {
    id: `si-${docId}`,
    document_id: docId,
    parsed_at: new Date().toISOString(),
    document_type,
    subcontractor_name: input.subcontractor_name,
    project_name: input.project_name,
    project_location: input.project_location,
    bid_date: input.bid_date,
    glazing_systems: glazingSystems,
    total_sf_proposed: totalSF,
    total_price_proposed: totalPrice,
    price_confidence: priceConfidence,
    furnish_install: furnishInstall,
    inclusions,
    exclusions,
    line_items: lineItems,
    lead_times: leadTimes,
    mobilization,
    access_assumptions: accessAssumptions,
    warranty,
    risks,
    parse_method: 'deterministic',
    parse_confidence: parseConfidence,
    raw_text_snippet: raw_text.slice(0, 500),
  };
}

// ── Merge AI-parsed fields into a deterministic result ───────
// Used by the API route: deterministic runs first, AI fills gaps

export function mergeAIParsedFields(
  deterministic: ScopeIntelligence,
  aiParsed: Partial<ScopeIntelligence>,
): ScopeIntelligence {
  return {
    ...deterministic,
    // Only use AI values if deterministic found nothing
    inclusions: deterministic.inclusions.length > 0
      ? deterministic.inclusions
      : (aiParsed.inclusions ?? []),
    exclusions: deterministic.exclusions.length > 0
      ? deterministic.exclusions
      : (aiParsed.exclusions ?? []),
    line_items: deterministic.line_items.length > 0
      ? deterministic.line_items
      : (aiParsed.line_items ?? []),
    lead_times: deterministic.lead_times.length > 0
      ? deterministic.lead_times
      : (aiParsed.lead_times ?? []),
    warranty: deterministic.warranty ?? aiParsed.warranty ?? null,
    glazing_systems: deterministic.glazing_systems.length > 0
      ? deterministic.glazing_systems
      : (aiParsed.glazing_systems ?? []),
    total_sf_proposed: deterministic.total_sf_proposed ?? aiParsed.total_sf_proposed,
    total_price_proposed: deterministic.total_price_proposed ?? aiParsed.total_price_proposed,
    subcontractor_name: deterministic.subcontractor_name ?? aiParsed.subcontractor_name,
    project_name: deterministic.project_name ?? aiParsed.project_name,
    // Merge risk flags (AI may add more)
    risks: [
      ...deterministic.risks,
      ...(aiParsed.risks ?? []).filter(
        ar => !deterministic.risks.some(dr => dr.description === ar.description)
      ),
    ],
    parse_method: 'ai_assisted',
    parse_confidence: aiParsed.parse_confidence ?? deterministic.parse_confidence,
    notes: aiParsed.notes ?? deterministic.notes,
  };
}

// ── Convert ScopeIntelligence → KnowledgeEntry for storage ───

export function scopeIntelligenceToKnowledgeEntry(
  si: ScopeIntelligence,
): import('@/types').KnowledgeEntry {
  const systemNames = si.glazing_systems.join(', ') || 'glazing';
  const priceNote = si.total_price_proposed
    ? ` Total ${si.price_confidence} price: $${si.total_price_proposed.toLocaleString()}.`
    : '';
  const sfNote = si.total_sf_proposed
    ? ` Scope: ${si.total_sf_proposed.toLocaleString()} SF.`
    : '';
  const subNote = si.subcontractor_name ? ` Subcontractor: ${si.subcontractor_name}.` : '';

  const body = [
    `${si.document_type.replace(/_/g, ' ')} document for ${si.project_name ?? 'an unnamed project'}.${subNote}`,
    `Systems: ${systemNames}.${sfNote}${priceNote}`,
    si.inclusions.length > 0 ? `Inclusions: ${si.inclusions.slice(0, 5).join('; ')}.` : '',
    si.exclusions.length > 0 ? `Exclusions: ${si.exclusions.slice(0, 5).join('; ')}.` : '',
    si.lead_times.length > 0 ? `Lead times: ${si.lead_times.map(lt => `${lt.item} ${lt.weeks_min}–${lt.weeks_max ?? lt.weeks_typical} weeks`).join('; ')}.` : '',
    si.risks.filter(r => r.severity === 'Critical' || r.severity === 'High').length > 0
      ? `Key risks: ${si.risks.filter(r => r.severity === 'Critical' || r.severity === 'High').map(r => r.description).slice(0, 3).join('; ')}.`
      : '',
  ].filter(Boolean).join(' ');

  return {
    id: `kb-proc-${si.document_id}`,
    category: 'historical_scope_intelligence',
    title: `${si.document_type.replace(/_/g, ' ')} — ${si.project_name ?? 'Unnamed Project'}${si.subcontractor_name ? ` (${si.subcontractor_name})` : ''}`,
    body,
    applies_to_work_types: si.glazing_systems,
    applies_to_regions: si.project_location
      ? [si.project_location.toLowerCase().includes('virginia') ? 'nova'
        : si.project_location.toLowerCase().includes('maryland') ? 'maryland'
        : si.project_location.toLowerCase().includes('d.c.') || si.project_location.toLowerCase().includes('washington') ? 'dc'
        : '']
      : [],
    source_id: si.price_confidence === 'awarded' ? 'src-cdc-dmv-bid-data-2023' : 'src-proc-intel',
    can_affect_price: si.price_confidence === 'awarded' || si.price_confidence === 'historical',
    effective_date: si.bid_date ?? si.parsed_at.slice(0, 10),
    tags: [
      'procurement',
      si.document_type,
      si.price_confidence,
      ...si.glazing_systems,
    ],
  };
}
