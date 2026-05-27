// ============================================================
// PROCESSED INTEL ADAPTER — server-side only
// Loads processed procurement records from the filesystem and
// converts them to KnowledgeEntry format for the narrative
// engine and AI advisor context.
//
// IMPORTANT: This module uses 'fs' and must NEVER be imported
// from client-side code or Next.js page components.
// Only use from: API routes, server components, scripts.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import type { KnowledgeEntry } from '@/types';
import type {
  ProjectRecord,
  PricingObservation,
  ExtractedScopeItem,
  IngestJurisdiction,
} from '@/types/ingest';

const PROCESSED_DIR = path.join(process.cwd(), 'data-ingest', 'processed');

function loadJson<T>(file: string, fallback: T): T {
  const filePath = path.join(PROCESSED_DIR, file);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

// ── Region ID → jurisdiction mapping ──────────────────────────

function regionToJurisdictions(regionId: string): IngestJurisdiction[] {
  const map: Record<string, IngestJurisdiction[]> = {
    dc:       ['dc', 'general'],
    nova:     ['virginia', 'general'],
    maryland: ['maryland', 'general'],
    federal:  ['federal', 'general'],
    dmv:      ['dc', 'virginia', 'maryland', 'general'],
  };
  return map[regionId] ?? ['general'];
}

// ── Convert ProjectRecord → KnowledgeEntry ─────────────────────

function projectToKnowledgeEntry(p: ProjectRecord): KnowledgeEntry {
  const systemNames = p.glazing_systems.join(', ') || 'glazing';
  const priceNote = p.total_price
    ? ` ${p.price_confidence} price: $${p.total_price.toLocaleString()}.`
    : '';
  const sfNote = p.total_sf
    ? ` Scope: ${p.total_sf.toLocaleString()} SF.`
    : '';
  const psfNote = p.effective_psf
    ? ` Effective $/SF: $${p.effective_psf.toFixed(0)}/SF.`
    : '';

  const inclText = p.scope_inclusions.slice(0, 3).join('; ');
  const exclText = p.scope_exclusions.slice(0, 3).join('; ');
  const ltText   = p.lead_time_summary.slice(0, 2).join('; ');
  const riskText = p.risk_flags
    .filter(r => r.severity === 'Critical' || r.severity === 'High')
    .slice(0, 2)
    .map(r => r.description)
    .join('; ');

  const body = [
    `Locally ingested ${p.source_jurisdiction.toUpperCase()} procurement document — ${p.project_name}.`,
    `Systems: ${systemNames}.${sfNote}${priceNote}${psfNote}`,
    inclText  && ` Inclusions: ${inclText}.`,
    exclText  && ` Exclusions: ${exclText}.`,
    ltText    && ` Lead times: ${ltText}.`,
    riskText  && ` Risks: ${riskText}.`,
    p.warranty_summary && ` Warranty: ${p.warranty_summary}.`,
  ].filter(Boolean).join('');

  return {
    id: `kb-ingest-${p.id}`,
    category: 'historical_scope_intelligence',
    title: `${p.project_name} (${p.source_jurisdiction.toUpperCase()} ingest — ${p.price_confidence})`,
    body,
    applies_to_work_types: p.glazing_systems,
    applies_to_regions: p.source_jurisdiction !== 'general' ? [p.source_jurisdiction] : [],
    source_id: p.authority === 'verified_pricing_authority'
      ? 'src-cdc-dmv-bid-data-2023'
      : 'src-proc-intel',
    can_affect_price: p.authority === 'verified_pricing_authority',
    effective_date: p.bid_date ?? p.last_updated.slice(0, 10),
    tags: ['ingested', p.source_jurisdiction, p.price_confidence, p.authority, ...p.glazing_systems],
  };
}

// ── Convert PricingObservation → KnowledgeEntry (benchmark) ───

function pricingObsToKnowledgeEntry(o: PricingObservation): KnowledgeEntry | null {
  if (!o.unit_price && !o.effective_psf) return null;

  const psfStr = o.effective_psf
    ? `$${o.effective_psf.toFixed(0)}/SF`
    : o.unit_price ? `$${o.unit_price.toFixed(0)} per ${o.unit ?? 'unit'}` : null;

  if (!psfStr) return null;

  const body = [
    `Ingested pricing observation: ${o.description}.`,
    ` ${o.glazing_system}, ${o.jurisdiction.toUpperCase()}, ${o.price_confidence} pricing.`,
    ` ${psfStr}.`,
    o.quantity ? ` Qty: ${o.quantity.toLocaleString()} ${o.unit ?? 'units'}.` : '',
    o.bidder   ? ` Bidder: ${o.bidder}.` : '',
    o.project_name ? ` Project: ${o.project_name}.` : '',
  ].filter(Boolean).join('');

  return {
    id: `kb-pricing-${o.id}`,
    category: o.authority === 'verified_pricing_authority' ? 'historical_bid' : 'historical_scope_intelligence',
    title: `Pricing — ${o.glazing_system} ${o.jurisdiction.toUpperCase()} ${psfStr}`,
    body,
    applies_to_work_types: [o.glazing_system],
    applies_to_regions: o.jurisdiction !== 'general' ? [o.jurisdiction] : [],
    source_id: o.authority === 'verified_pricing_authority'
      ? 'src-cdc-dmv-bid-data-2023'
      : 'src-proc-intel',
    can_affect_price: o.authority === 'verified_pricing_authority',
    effective_date: o.bid_date ?? new Date().toISOString().slice(0, 10),
    tags: ['ingested', 'pricing', o.jurisdiction, o.price_confidence, o.authority, o.glazing_system],
  };
}

// ── Main exported function ─────────────────────────────────────

export interface ProcessedIntelKnowledgeOptions {
  workTypeId?: string;
  regionId?: string;
  includeAllJurisdictions?: boolean;
  maxEntries?: number;
  authorityOnly?: boolean;
}

export function loadProcessedKnowledgeEntries(
  options: ProcessedIntelKnowledgeOptions = {}
): KnowledgeEntry[] {
  const {
    workTypeId,
    regionId,
    includeAllJurisdictions = false,
    maxEntries = 20,
    authorityOnly = false,
  } = options;

  const jurisdictions = regionId
    ? regionToJurisdictions(regionId)
    : includeAllJurisdictions
      ? ['dc', 'virginia', 'maryland', 'federal', 'university', 'general'] as IngestJurisdiction[]
      : ['general'] as IngestJurisdiction[];

  let projects = loadJson<ProjectRecord[]>('projectRecords.json', []);
  let pricingObs = loadJson<PricingObservation[]>('pricingObservations.json', []);
  const scopeItems = loadJson<ExtractedScopeItem[]>('extractedScopeItems.json', []);

  if (authorityOnly) {
    projects   = projects.filter(p => p.authority === 'verified_pricing_authority');
    pricingObs = pricingObs.filter(o => o.authority === 'verified_pricing_authority');
  }

  // Filter by jurisdiction
  if (!includeAllJurisdictions) {
    projects   = projects.filter(p => jurisdictions.includes(p.source_jurisdiction));
    pricingObs = pricingObs.filter(o => jurisdictions.includes(o.jurisdiction));
  }

  // Filter by work type
  if (workTypeId) {
    projects   = projects.filter(p => p.glazing_systems.length === 0 || p.glazing_systems.includes(workTypeId));
    pricingObs = pricingObs.filter(o => o.glazing_system === workTypeId || o.glazing_system === 'unknown');
  }

  const entries: KnowledgeEntry[] = [];

  // Add project records
  for (const p of projects.slice(0, Math.ceil(maxEntries * 0.6))) {
    entries.push(projectToKnowledgeEntry(p));
  }

  // Add pricing observations (deduplicate by glazing_system + effective_psf range)
  const seenPsfBuckets = new Set<string>();
  for (const o of pricingObs) {
    const psfBucket = o.effective_psf
      ? `${o.glazing_system}-${Math.floor(o.effective_psf / 10) * 10}`
      : `${o.glazing_system}-${o.unit_price}`;

    if (seenPsfBuckets.has(psfBucket)) continue;
    seenPsfBuckets.add(psfBucket);

    const entry = pricingObsToKnowledgeEntry(o);
    if (entry) entries.push(entry);
    if (entries.length >= maxEntries) break;
  }

  return entries.slice(0, maxEntries);
}

// ── Metadata summary for API responses ────────────────────────

export function getProcessedIntelSummary(): {
  total_projects: number;
  total_pricing_obs: number;
  verified_projects: number;
  jurisdictions: Record<string, number>;
  work_types: Record<string, number>;
  last_ingested?: string;
} {
  const projects   = loadJson<ProjectRecord[]>('projectRecords.json', []);
  const pricingObs = loadJson<PricingObservation[]>('pricingObservations.json', []);

  const jurisdictions: Record<string, number> = {};
  const workTypes: Record<string, number> = {};

  for (const p of projects) {
    jurisdictions[p.source_jurisdiction] = (jurisdictions[p.source_jurisdiction] ?? 0) + 1;
    for (const wt of p.glazing_systems) {
      workTypes[wt] = (workTypes[wt] ?? 0) + 1;
    }
  }

  return {
    total_projects:     projects.length,
    total_pricing_obs:  pricingObs.length,
    verified_projects:  projects.filter(p => p.authority === 'verified_pricing_authority').length,
    jurisdictions,
    work_types:         workTypes,
    last_ingested:      projects.sort((a, b) => b.last_updated.localeCompare(a.last_updated))[0]?.last_updated,
  };
}
