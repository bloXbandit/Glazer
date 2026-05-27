// ============================================================
// PARSE PROCUREMENT API ROUTE
// Two-layer extraction:
//   Layer 1 — deterministic (regex/keyword, no AI)
//   Layer 2 — AI-assisted gap-fill (OpenAI, optional)
//
// Authority: ALL extracted data is historical_scope_intelligence
// Pricing is 'proposed' unless document_type is purchase_order
// or subcontract_exhibit with confirmed quantities.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import type { ProcurementDocumentInput, ScopeIntelligence } from '@/types';
import { parseProcurementDocument, mergeAIParsedFields } from '@/lib/procurementParser';

const AI_EXTRACTION_PROMPT = `You are a commercial glazing estimating expert. A user has provided a procurement document (subcontractor proposal, bid tab, scope exhibit, or similar). Extract structured data from the text below.

Return ONLY valid JSON matching this exact schema — no prose, no markdown fences:
{
  "subcontractor_name": string | null,
  "project_name": string | null,
  "project_location": string | null,
  "bid_date": string | null,
  "quote_valid_until": string | null,
  "glazing_systems": string[],  // use these IDs only: storefront, stick_curtain_wall, unitized_curtain_wall, window_wall, interior_partition, glass_railing, skylight, fire_rated, blast_security
  "total_sf_proposed": number | null,
  "total_price_proposed": number | null,
  "inclusions": string[],       // scope items explicitly included — verbatim or cleaned
  "exclusions": string[],       // scope items explicitly excluded — verbatim or cleaned
  "lead_times": [{ "item": string, "weeks_min": number | null, "weeks_max": number | null, "clock_start": string }],
  "warranty_years": number | null,
  "warranty_labor_included": boolean,
  "warranty_glass_breakage_excluded": boolean,
  "mobilization_included": boolean,
  "mobilization_cost": number | null,
  "access_methods": [{ "method": string, "provided_by": "sub"|"gc"|"owner"|"unspecified", "included_in_price": boolean }],
  "line_items": [{
    "description": string,
    "quantity": number | null,
    "unit": string | null,
    "unit_price": number | null,
    "extended_price": number | null,
    "is_alternate": boolean,
    "furnish_install": "furnish_and_install"|"install_only"|"furnish_only"|"design_assist"|"delegated_design"
  }],
  "additional_risks": [{ "category": "scope_gap"|"exclusion_risk"|"price_escalation"|"schedule"|"access"|"compliance"|"subcontractor_capacity", "severity": "Critical"|"High"|"Medium"|"Low", "description": string, "recommendation": string }],
  "parse_confidence": "high"|"medium"|"low",
  "notes": string | null
}

RULES:
- Do NOT invent prices. Only extract values that appear in the text.
- Mark total_price_proposed as null if only a $/SF rate is given without total area.
- For glazing_systems, only use the exact IDs listed above.
- Keep inclusions and exclusions as distinct, actionable items (not paragraph summaries).
- Flag risks that a senior estimator would catch reviewing a proposal for the first time.
- If a field is not in the text, return null or [].

DOCUMENT TEXT:
`;

export async function POST(req: NextRequest) {
  let input: ProcurementDocumentInput;
  try {
    input = (await req.json()) as ProcurementDocumentInput;
    if (!input.raw_text || input.raw_text.trim().length < 20) {
      return NextResponse.json({ error: 'raw_text is required (min 20 characters).' }, { status: 400 });
    }
    if (input.raw_text.length > 30_000) {
      return NextResponse.json({ error: 'Document too large. Maximum 30,000 characters.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // ── Layer 1: Deterministic parse (always runs) ────────────────
  const docId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const deterministic = parseProcurementDocument(input, docId);

  // ── Layer 2: AI gap-fill (only if API key present) ────────────
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      intelligence: deterministic,
      ai_enhanced: false,
      note: 'AI enhancement unavailable — OPENAI_API_KEY not set. Deterministic parse only.',
    });
  }

  try {
    const truncatedText = input.raw_text.slice(0, 12_000); // keep within context
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: AI_EXTRACTION_PROMPT + truncatedText,
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      return NextResponse.json({
        intelligence: deterministic,
        ai_enhanced: false,
        note: `AI parse failed (HTTP ${aiResponse.status}). Deterministic result returned.`,
      });
    }

    const aiData = await aiResponse.json();
    const aiRaw = aiData.choices?.[0]?.message?.content;
    if (!aiRaw) {
      return NextResponse.json({
        intelligence: deterministic,
        ai_enhanced: false,
        note: 'AI returned empty response. Deterministic result returned.',
      });
    }

    let aiParsed: Record<string, unknown>;
    try {
      aiParsed = JSON.parse(aiRaw);
    } catch {
      return NextResponse.json({
        intelligence: deterministic,
        ai_enhanced: false,
        note: 'AI response was not valid JSON. Deterministic result returned.',
      });
    }

    // Map AI JSON → partial ScopeIntelligence
    const aiMapped: Partial<ScopeIntelligence> = {
      subcontractor_name: (aiParsed.subcontractor_name as string) ?? undefined,
      project_name: (aiParsed.project_name as string) ?? undefined,
      project_location: (aiParsed.project_location as string) ?? undefined,
      bid_date: (aiParsed.bid_date as string) ?? undefined,
      quote_valid_until: (aiParsed.quote_valid_until as string) ?? undefined,
      glazing_systems: (aiParsed.glazing_systems as string[]) ?? [],
      total_sf_proposed: (aiParsed.total_sf_proposed as number) ?? undefined,
      total_price_proposed: (aiParsed.total_price_proposed as number) ?? undefined,
      inclusions: (aiParsed.inclusions as string[]) ?? [],
      exclusions: (aiParsed.exclusions as string[]) ?? [],
      lead_times: ((aiParsed.lead_times ?? []) as Array<{item: string; weeks_min: number | null; weeks_max: number | null; clock_start: string}>).map(lt => ({
        item: lt.item,
        weeks_min: lt.weeks_min ?? undefined,
        weeks_max: lt.weeks_max ?? undefined,
        weeks_typical: lt.weeks_min && lt.weeks_max ? Math.round((lt.weeks_min + lt.weeks_max) / 2) : (lt.weeks_min ?? undefined),
        clock_start: lt.clock_start ?? 'from order placement',
      })),
      warranty: (aiParsed.warranty_years as number)
        ? {
            scope: 'Glazing workmanship and weathertightness',
            years: aiParsed.warranty_years as number,
            labor_included: (aiParsed.warranty_labor_included as boolean) ?? true,
            material_included: true,
            glass_breakage_excluded: (aiParsed.warranty_glass_breakage_excluded as boolean) ?? false,
          }
        : null,
      mobilization: {
        included: (aiParsed.mobilization_included as boolean) ?? false,
        mob_cost: (aiParsed.mobilization_cost as number) ?? undefined,
        notes: (aiParsed.mobilization_included as boolean)
          ? 'Mobilization confirmed included per AI extraction.'
          : 'Mobilization not detected or excluded.',
      },
      access_assumptions: ((aiParsed.access_methods ?? []) as Array<{method: string; provided_by: 'sub'|'gc'|'owner'|'unspecified'; included_in_price: boolean}>).map(a => ({
        method: a.method,
        provided_by: a.provided_by ?? 'unspecified',
        included_in_price: a.included_in_price ?? false,
        assumptions_stated: [a.method],
      })),
      line_items: ((aiParsed.line_items ?? []) as Array<{
        description: string;
        quantity: number | null;
        unit: string | null;
        unit_price: number | null;
        extended_price: number | null;
        is_alternate: boolean;
        furnish_install: string;
      }>).map((li, i) => ({
        id: `ai-li-${i + 1}`,
        description: li.description,
        quantity: li.quantity ?? undefined,
        unit: li.unit ?? 'LS',
        unit_price: li.unit_price ?? undefined,
        extended_price: li.extended_price ?? undefined,
        price_confidence: deterministic.price_confidence,
        furnish_install: (li.furnish_install as import('@/types').FurnishInstallType) ?? 'furnish_and_install',
        included_in_base: !li.is_alternate,
        is_alternate: li.is_alternate ?? false,
      })),
      risks: ((aiParsed.additional_risks ?? []) as Array<{
        category: import('@/types').ProcurementRiskFlag['category'];
        severity: import('@/types').ProcurementRiskFlag['severity'];
        description: string;
        recommendation: string;
      }>).map((r, i) => ({
        id: `ai-prf-${i + 1}`,
        category: r.category,
        severity: r.severity,
        description: r.description,
        recommendation: r.recommendation,
      })),
      parse_confidence: (aiParsed.parse_confidence as 'high' | 'medium' | 'low') ?? 'medium',
      notes: (aiParsed.notes as string) ?? undefined,
    };

    const merged = mergeAIParsedFields(deterministic, aiMapped);

    return NextResponse.json({
      intelligence: merged,
      ai_enhanced: true,
    });
  } catch (err) {
    console.error('[parse-procurement] AI parse error:', err);
    return NextResponse.json({
      intelligence: deterministic,
      ai_enhanced: false,
      note: 'AI parse threw an error. Deterministic result returned.',
    });
  }
}
