// ============================================================
// INGEST PIPELINE
// Core engine for the local procurement intelligence system.
//
// Flow: scan → hash/dedup → extract text → classify → parse
//       → score authority → serialize → write processed outputs
//
// All records start as historical_scope_intelligence.
// Upgrade to verified_pricing_authority requires 6 conditions.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { extractFileText, hashFile, detectFileType } from '@/lib/fileExtractors';
import { parseProcurementDocument } from '@/lib/procurementParser';
import type {
  IngestDocumentType,
  IngestJurisdiction,
  IngestAuthority,
  IngestPriceConfidence,
  SourceDocument,
  ProjectRecord,
  ExtractedScopeItem,
  PricingObservation,
  IngestRunEntry,
  IngestLog,
  AuthorityCheckResult,
  FileExtractionResult,
} from '@/types/ingest';
import type { ProcurementDocumentInput } from '@/types';

// ── Path constants ─────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(process.cwd());
const RAW_DIR      = path.join(PROJECT_ROOT, 'data-ingest', 'raw');
const PROCESSED_DIR = path.join(PROJECT_ROOT, 'data-ingest', 'processed');

export const PROCESSED_FILES = {
  projectRecords:        path.join(PROCESSED_DIR, 'projectRecords.json'),
  sourceDocuments:       path.join(PROCESSED_DIR, 'sourceDocuments.json'),
  extractedScopeItems:   path.join(PROCESSED_DIR, 'extractedScopeItems.json'),
  pricingObservations:   path.join(PROCESSED_DIR, 'pricingObservations.json'),
  ingestionLog:          path.join(PROCESSED_DIR, 'ingestionLog.json'),
};

// ── Classification keyword maps ────────────────────────────────

const CLASSIFICATION_RULES: Array<{
  type: IngestDocumentType;
  weight: number;
  filename_patterns: RegExp[];
  content_patterns: RegExp[];
}> = [
  {
    type: 'award_notice',
    weight: 10,
    filename_patterns: [/award/i, /noa\b/i, /notice.*award/i, /letter.*award/i],
    content_patterns: [
      /notice\s+of\s+award/i,
      /is\s+hereby\s+awarded/i,
      /award\s+amount/i,
      /contract\s+award/i,
      /awarded\s+to/i,
      /executed\s+subcontract/i,
    ],
  },
  {
    type: 'bid_tab',
    weight: 9,
    filename_patterns: [/bid[\s_-]*tab/i, /bid[\s_-]*leveling/i, /bid[\s_-]*analysis/i, /bid[\s_-]*comparison/i],
    content_patterns: [
      /bid\s+tab/i,
      /bid\s+leveling/i,
      /bid\s+comparison/i,
      /bidder\s+\d/i,
      /\bbidder\s*[|:]/i,
      /low\s+bid(?:der)?/i,
      /apparent\s+low/i,
    ],
  },
  {
    type: 'rfp_specification',
    weight: 8,
    filename_patterns: [/spec/i, /rfp/i, /rfq/i, /itb/i, /division[\s_-]*08/i, /section[\s_-]*08/i],
    content_patterns: [
      /request\s+for\s+proposal/i,
      /request\s+for\s+qualifications/i,
      /invitation\s+to\s+bid/i,
      /section\s+08\s*\d{2}/i,
      /division\s+08/i,
      /glazing\s+specification/i,
      /work\s+shall\s+include/i,
      /contractor\s+shall/i,
    ],
  },
  {
    type: 'glazing_scope_sheet',
    weight: 8,
    filename_patterns: [/glass[\s_-]*schedule/i, /glazing[\s_-]*schedule/i, /window[\s_-]*schedule/i, /opening[\s_-]*schedule/i],
    content_patterns: [
      /glass\s+schedule/i,
      /glazing\s+schedule/i,
      /window\s+schedule/i,
      /opening\s+schedule/i,
      /type\s+\w+\s+\|\s+size/i,
      /mark\s+\|\s+quantity/i,
    ],
  },
  {
    type: 'pricing_backup',
    weight: 7,
    filename_patterns: [/price[\s_-]*break/i, /unit[\s_-]*price/i, /cost[\s_-]*break/i, /material[\s_-]*list/i],
    content_patterns: [
      /unit\s+price\s+breakdown/i,
      /material\s+list/i,
      /labor\s+analysis/i,
      /cost\s+breakdown/i,
      /takeoff/i,
      /quantity\s+survey/i,
    ],
  },
  {
    type: 'manufacturer_reference',
    weight: 6,
    filename_patterns: [/product[\s_-]*data/i, /submittal/i, /cut[\s_-]*sheet/i, /data[\s_-]*sheet/i],
    content_patterns: [
      /product\s+data/i,
      /manufacturer['']?s?\s+data/i,
      /\baama\s+\d{3}/i,
      /submittal\s+cover/i,
      /technical\s+data\s+sheet/i,
      /approved\s+equal/i,
    ],
  },
  {
    type: 'subcontractor_proposal',
    weight: 5,
    filename_patterns: [/proposal/i, /quote/i, /quotation/i, /bid[\s_-]*letter/i, /sub[\s_-]*proposal/i],
    content_patterns: [
      /hereby\s+submit/i,
      /we\s+are\s+pleased\s+to\s+(submit|provide|offer)/i,
      /scope\s+of\s+work/i,
      /our\s+(proposal|quote|bid)/i,
      /quote\s+number/i,
      /proposal\s+number/i,
      /valid\s+for\s+\d+\s+days/i,
      /inclusions?:/i,
      /exclusions?:/i,
      /lead\s+time/i,
    ],
  },
];

// ── Document classifier ────────────────────────────────────────

export function classifyDocument(
  fileName: string,
  text: string
): { type: IngestDocumentType; confidence: number } {
  const scores: Record<IngestDocumentType, number> = {
    subcontractor_proposal: 0,
    bid_tab: 0,
    award_notice: 0,
    rfp_specification: 0,
    glazing_scope_sheet: 0,
    pricing_backup: 0,
    manufacturer_reference: 0,
    unknown: 0,
  };

  for (const rule of CLASSIFICATION_RULES) {
    let score = 0;

    // Filename matches carry 3× weight
    for (const pattern of rule.filename_patterns) {
      if (pattern.test(fileName)) score += rule.weight * 3;
    }

    // Content matches
    for (const pattern of rule.content_patterns) {
      if (pattern.test(text)) score += rule.weight;
    }

    scores[rule.type] += score;
  }

  const best = (Object.entries(scores) as Array<[IngestDocumentType, number]>)
    .sort(([, a], [, b]) => b - a)[0];

  if (best[1] === 0) return { type: 'unknown', confidence: 0 };

  // Normalize confidence: best score vs theoretical max (all patterns match)
  const maxPossible = Math.max(...CLASSIFICATION_RULES.map(r =>
    r.filename_patterns.length * r.weight * 3 + r.content_patterns.length * r.weight
  ));
  const confidence = Math.min(best[1] / maxPossible, 1);

  return { type: best[0], confidence: Math.round(confidence * 100) / 100 };
}

// ── Jurisdiction from path ─────────────────────────────────────

export function jurisdictionFromPath(filePath: string): IngestJurisdiction {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('/federal/'))    return 'federal';
  if (normalized.includes('/university/')) return 'university';
  if (/\/(dc|washington)\//.test(normalized)) return 'dc';
  if (normalized.includes('/maryland/'))  return 'maryland';
  if (normalized.includes('/virginia/'))  return 'virginia';
  return 'general';
}

// ── Map IngestDocumentType → ProcurementDocumentInput type ────

function toProcurementDocType(
  t: IngestDocumentType
): ProcurementDocumentInput['document_type'] {
  const map: Partial<Record<IngestDocumentType, ProcurementDocumentInput['document_type']>> = {
    subcontractor_proposal: 'subcontractor_proposal',
    bid_tab:                'bid_tab',
    award_notice:           'subcontract_exhibit',
    rfp_specification:      'scope_exhibit',
    glazing_scope_sheet:    'scope_exhibit',
    pricing_backup:         'subcontractor_proposal',
    manufacturer_reference: 'submittal_cover',
  };
  return map[t] ?? 'subcontractor_proposal';
}

// ── Authority upgrade check ────────────────────────────────────

export function checkAuthority(
  docType: IngestDocumentType,
  si: ReturnType<typeof parseProcurementDocument>
): AuthorityCheckResult {
  const conditions: Array<{ key: string; label: string; met: boolean }> = [
    {
      key: 'awarded_value',
      label: 'Confirmed awarded value present',
      met: (si.price_confidence === 'awarded' || si.price_confidence === 'historical') &&
           (si.total_price_proposed ?? 0) > 0,
    },
    {
      key: 'confirmed_quantity',
      label: 'Confirmed quantity or measurable SF',
      met: (si.total_sf_proposed ?? 0) > 0 ||
           si.line_items.some(li => (li.quantity ?? 0) > 0 && li.unit?.toUpperCase() === 'SF'),
    },
    {
      key: 'project_location',
      label: 'Project location identified',
      met: !!(si.project_location || si.project_name),
    },
    {
      key: 'bid_date',
      label: 'Bid or award date present',
      met: !!(si.bid_date),
    },
    {
      key: 'glazing_scope',
      label: 'Clear glazing scope (≥1 system identified)',
      met: si.glazing_systems.length > 0,
    },
    {
      key: 'authoritative_source',
      label: 'Source is award notice, purchase order, or subcontract exhibit',
      met: ['award_notice', 'subcontract_exhibit', 'purchase_order'].includes(docType as string),
    },
  ];

  const met = conditions.filter(c => c.met).map(c => c.label);
  const missing = conditions.filter(c => !c.met).map(c => c.label);
  const score = met.length;

  return {
    authority: score >= 6 ? 'verified_pricing_authority' : 'historical_scope_intelligence',
    met_conditions: met,
    missing_conditions: missing,
    score,
  };
}

// ── ID helpers ─────────────────────────────────────────────────

function makeId(prefix: string, seed: string): string {
  const crypto = require('crypto') as typeof import('crypto');
  return `${prefix}-${crypto.createHash('sha256').update(seed).digest('hex').slice(0, 12)}`;
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── Load/save processed JSON files ────────────────────────────

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function saveJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Build SourceDocument from extraction result ────────────────

function buildSourceDocument(
  filePath: string,
  extraction: FileExtractionResult,
  classification: { type: IngestDocumentType; confidence: number },
  hash: string,
): SourceDocument {
  const relPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
  return {
    id: makeId('sd', relPath),
    file_path: relPath,
    file_name: path.basename(filePath),
    file_type: extraction.file_type,
    file_size_bytes: fs.statSync(filePath).size,
    jurisdiction: jurisdictionFromPath(relPath),
    document_type: classification.type,
    classification_confidence: classification.confidence,
    extracted_at: new Date().toISOString(),
    hash,
    extraction_char_count: extraction.char_count,
    parse_errors: extraction.error ? [extraction.error] : [],
    skipped: false,
  };
}

// ── Build ProjectRecord from parsed ScopeIntelligence ─────────

function buildProjectRecord(
  si: ReturnType<typeof parseProcurementDocument>,
  sourceDoc: SourceDocument,
  authority: AuthorityCheckResult,
): ProjectRecord {
  const effectivePsf =
    si.total_price_proposed && si.total_sf_proposed && si.total_sf_proposed > 0
      ? Math.round((si.total_price_proposed / si.total_sf_proposed) * 100) / 100
      : undefined;

  // Compute composite confidence
  const confidenceFactors = [
    si.parse_confidence === 'high' ? 1 : si.parse_confidence === 'medium' ? 0.6 : 0.3,
    sourceDoc.classification_confidence,
    si.glazing_systems.length > 0 ? 0.8 : 0.3,
    si.total_price_proposed ? 0.8 : 0.4,
    si.total_sf_proposed ? 0.8 : 0.4,
    si.bid_date ? 0.8 : 0.5,
  ];
  const compositeConfidence = Math.round(
    (confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length) * 100
  ) / 100;

  const bidders: string[] = [];
  if (si.subcontractor_name) bidders.push(si.subcontractor_name);

  return {
    id: makeId('pr', `${si.project_name ?? ''}${si.project_location ?? ''}${si.bid_date ?? ''}`),
    project_name: si.project_name ?? sourceDoc.file_name.replace(/\.[^.]+$/, ''),
    project_location: si.project_location ?? sourceDoc.jurisdiction,
    owner_client: undefined,
    source_jurisdiction: sourceDoc.jurisdiction,
    bid_date: si.bid_date,
    award_date: undefined,
    quote_valid_until: si.quote_valid_until,
    glazing_systems: si.glazing_systems,
    total_sf: si.total_sf_proposed,
    total_price: si.total_price_proposed,
    effective_psf: effectivePsf,
    price_confidence: si.price_confidence as IngestPriceConfidence,
    authority: authority.authority,
    authority_upgrade_reasons: authority.met_conditions,
    authority_missing_conditions: authority.missing_conditions,
    scope_inclusions: si.inclusions,
    scope_exclusions: si.exclusions,
    lead_time_summary: si.lead_times.map(lt =>
      `${lt.item}: ${lt.weeks_min}–${lt.weeks_max ?? lt.weeks_typical}w ${lt.clock_start}`
    ),
    warranty_summary: si.warranty
      ? `${si.warranty.years}-year, labor ${si.warranty.labor_included ? 'included' : 'excluded'}, glass breakage ${si.warranty.glass_breakage_excluded ? 'excluded' : 'covered'}`
      : undefined,
    mobilization_included: si.mobilization.included,
    access_methods: si.access_assumptions.map(a => `${a.method} (by ${a.provided_by})`),
    risk_flags: si.risks.map(r => ({
      severity: r.severity,
      description: r.description,
      category: r.category,
    })),
    bidders,
    source_document_ids: [sourceDoc.id],
    last_updated: new Date().toISOString(),
    confidence_score: compositeConfidence,
  };
}

// ── Build scope items from parsed SI ──────────────────────────

function buildScopeItems(
  si: ReturnType<typeof parseProcurementDocument>,
  sourceDoc: SourceDocument,
  projectRecordId: string,
): ExtractedScopeItem[] {
  const items: ExtractedScopeItem[] = [];

  for (const inc of si.inclusions) {
    items.push({
      id: makeId('si', `${sourceDoc.id}inc${inc.slice(0, 30)}`),
      source_document_id: sourceDoc.id,
      project_record_id: projectRecordId,
      type: 'inclusion',
      text: inc,
      jurisdiction: sourceDoc.jurisdiction,
      bid_date: si.bid_date,
      confidence: si.parse_confidence === 'high' ? 0.9 : si.parse_confidence === 'medium' ? 0.65 : 0.4,
    });
  }

  for (const exc of si.exclusions) {
    items.push({
      id: makeId('si', `${sourceDoc.id}exc${exc.slice(0, 30)}`),
      source_document_id: sourceDoc.id,
      project_record_id: projectRecordId,
      type: 'exclusion',
      text: exc,
      jurisdiction: sourceDoc.jurisdiction,
      bid_date: si.bid_date,
      confidence: si.parse_confidence === 'high' ? 0.9 : si.parse_confidence === 'medium' ? 0.65 : 0.4,
    });
  }

  return items;
}

// ── Build pricing observations from parsed SI ─────────────────

function buildPricingObservations(
  si: ReturnType<typeof parseProcurementDocument>,
  sourceDoc: SourceDocument,
  projectRecord: ProjectRecord,
  authority: AuthorityCheckResult,
): PricingObservation[] {
  const obs: PricingObservation[] = [];

  for (const li of si.line_items) {
    // Compute effective $/SF for line items with SF quantities
    const isSfUnit = li.unit?.toUpperCase() === 'SF';
    const effectivePsf =
      isSfUnit && li.unit_price
        ? li.unit_price
        : (isSfUnit && li.extended_price && li.quantity && li.quantity > 0)
          ? Math.round((li.extended_price / li.quantity) * 100) / 100
          : undefined;

    obs.push({
      id: makeId('po', `${sourceDoc.id}${li.id}`),
      source_document_id: sourceDoc.id,
      project_record_id: projectRecord.id,
      description: li.description,
      glazing_system: li.glazing_system_category ?? si.glazing_systems[0] ?? 'unknown',
      quantity: li.quantity,
      unit: li.unit,
      unit_price: li.unit_price,
      extended_price: li.extended_price,
      effective_psf: effectivePsf,
      price_confidence: li.price_confidence as IngestPriceConfidence,
      authority: authority.authority,
      jurisdiction: sourceDoc.jurisdiction,
      bid_date: si.bid_date,
      bidder: si.subcontractor_name,
      project_name: projectRecord.project_name,
      project_location: projectRecord.project_location,
    });
  }

  // Also log the aggregate $/SF if we have it
  if (projectRecord.effective_psf && si.glazing_systems.length > 0) {
    obs.push({
      id: makeId('po', `${sourceDoc.id}aggregate`),
      source_document_id: sourceDoc.id,
      project_record_id: projectRecord.id,
      description: `Aggregate $/SF — ${si.glazing_systems.join(', ')} (${projectRecord.project_name})`,
      glazing_system: si.glazing_systems[0],
      quantity: si.total_sf_proposed,
      unit: 'SF',
      unit_price: projectRecord.effective_psf,
      extended_price: si.total_price_proposed,
      effective_psf: projectRecord.effective_psf,
      price_confidence: si.price_confidence as IngestPriceConfidence,
      authority: authority.authority,
      jurisdiction: sourceDoc.jurisdiction,
      bid_date: si.bid_date,
      bidder: si.subcontractor_name,
      project_name: projectRecord.project_name,
      project_location: projectRecord.project_location,
    });
  }

  return obs;
}

// ── Main ingest options ────────────────────────────────────────

export interface IngestOptions {
  force?: boolean;             // ignore dedup hash cache
  jurisdictionFilter?: string; // only process this jurisdiction folder
  verbose?: boolean;
  log?: (msg: string) => void;
}

// ── Core ingest function ───────────────────────────────────────

export async function runIngestPipeline(options: IngestOptions = {}): Promise<IngestRunEntry> {
  const { force = false, jurisdictionFilter, verbose = false, log = console.log } = options;

  const runId = shortId();
  const startedAt = new Date().toISOString();

  if (verbose) log(`[ingest] Starting run ${runId}`);

  // ── Load existing processed data ──
  const existingSourceDocs = loadJson<SourceDocument[]>(PROCESSED_FILES.sourceDocuments, []);
  const existingProjects   = loadJson<ProjectRecord[]>(PROCESSED_FILES.projectRecords, []);
  const existingScopeItems = loadJson<ExtractedScopeItem[]>(PROCESSED_FILES.extractedScopeItems, []);
  const existingPricingObs = loadJson<PricingObservation[]>(PROCESSED_FILES.pricingObservations, []);

  const processedHashes = new Set(existingSourceDocs.filter(d => !d.skipped).map(d => d.hash));

  // ── Scan for files ──
  const rawBase = jurisdictionFilter
    ? path.join(RAW_DIR, jurisdictionFilter)
    : RAW_DIR;

  const pattern = path.join(rawBase, '**', '*.{pdf,xlsx,xls,docx,doc,csv,txt}').replace(/\\/g, '/');
  const allFiles = await glob(pattern, { nodir: true });

  if (verbose) log(`[ingest] Found ${allFiles.length} files to consider`);

  // ── Run counters ──
  let scanned = 0, processed = 0, skippedDedup = 0, skippedUnsupported = 0, errored = 0;
  let newSourceDocs = 0, newProjects = 0, updatedProjects = 0, newScopeItems = 0, newPricingObs = 0, upgrades = 0;
  const errors: Array<{ file: string; error: string }> = [];
  const warnings: Array<{ file: string; warning: string }> = [];

  // Mutable output arrays — start with existing data
  const sourceDocs = [...existingSourceDocs];
  const projects   = [...existingProjects];
  const scopeItems = [...existingScopeItems];
  const pricingObs = [...existingPricingObs];

  // ── Process each file ──
  for (const filePath of allFiles) {
    scanned++;
    const fileName = path.basename(filePath);

    // Skip unsupported
    if (!detectFileType(filePath)) {
      skippedUnsupported++;
      if (verbose) log(`[ingest] Skip (unsupported): ${fileName}`);
      continue;
    }

    // Hash for dedup
    let hash: string;
    try {
      hash = hashFile(filePath);
    } catch (err) {
      errored++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ file: fileName, error: `Hash failed: ${msg}` });
      continue;
    }

    if (!force && processedHashes.has(hash)) {
      skippedDedup++;
      if (verbose) log(`[ingest] Skip (dedup): ${fileName}`);
      continue;
    }

    // Extract text
    if (verbose) log(`[ingest] Extracting: ${fileName}`);
    let extraction: Awaited<ReturnType<typeof extractFileText>>;
    try {
      extraction = await extractFileText(filePath);
    } catch (err) {
      errored++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ file: fileName, error: `Extraction threw: ${msg}` });
      continue;
    }

    if (!extraction.success || extraction.char_count < 30) {
      errored++;
      const reason = extraction.error ?? 'Too little text extracted (<30 chars)';
      errors.push({ file: fileName, error: reason });
      if (verbose) log(`[ingest] Error: ${fileName} — ${reason}`);
      continue;
    }

    // Classify
    const classification = classifyDocument(fileName, extraction.text);
    if (verbose) log(`[ingest] Classified as: ${classification.type} (${(classification.confidence * 100).toFixed(0)}%)`);

    // Build source document record
    const sourceDoc = buildSourceDocument(filePath, extraction, classification, hash);

    // Parse procurement fields
    const procInput: ProcurementDocumentInput = {
      document_type: toProcurementDocType(classification.type),
      raw_text: extraction.text,
    };

    let si: ReturnType<typeof parseProcurementDocument>;
    try {
      si = parseProcurementDocument(procInput, sourceDoc.id);
    } catch (err) {
      errored++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ file: fileName, error: `Parse failed: ${msg}` });
      continue;
    }

    // Authority check
    const authorityResult = checkAuthority(classification.type, si);

    if (authorityResult.authority === 'verified_pricing_authority') {
      upgrades++;
      if (verbose) log(`[ingest] ✓ Upgraded to verified_pricing_authority: ${fileName}`);
    }

    // Build records
    const projectRecord = buildProjectRecord(si, sourceDoc, authorityResult);
    sourceDoc.project_record_id = projectRecord.id;

    const newScope = buildScopeItems(si, sourceDoc, projectRecord.id);
    const newPricing = buildPricingObservations(si, sourceDoc, projectRecord, authorityResult);

    // Merge into output arrays
    // Source docs: replace by id if exists (re-process case with --force), else append
    const existingDocIdx = sourceDocs.findIndex(d => d.id === sourceDoc.id);
    if (existingDocIdx >= 0) {
      sourceDocs[existingDocIdx] = sourceDoc;
    } else {
      sourceDocs.push(sourceDoc);
      newSourceDocs++;
    }

    // Projects: merge by id (update if same project re-appears)
    const existingProjIdx = projects.findIndex(p => p.id === projectRecord.id);
    if (existingProjIdx >= 0) {
      // Merge source_document_ids
      const existing = projects[existingProjIdx];
      existing.source_document_ids = Array.from(new Set([...existing.source_document_ids, sourceDoc.id]));
      existing.last_updated = projectRecord.last_updated;
      // Upgrade authority if warranted
      if (projectRecord.authority === 'verified_pricing_authority') {
        existing.authority = 'verified_pricing_authority';
        existing.authority_upgrade_reasons = projectRecord.authority_upgrade_reasons;
      }
      // Update price/SF if new doc has better data
      if (projectRecord.total_price && !existing.total_price) existing.total_price = projectRecord.total_price;
      if (projectRecord.total_sf && !existing.total_sf) existing.total_sf = projectRecord.total_sf;
      if (projectRecord.effective_psf && !existing.effective_psf) existing.effective_psf = projectRecord.effective_psf;
      updatedProjects++;
    } else {
      projects.push(projectRecord);
      newProjects++;
    }

    // Scope items: dedupe by id
    for (const item of newScope) {
      if (!scopeItems.find(s => s.id === item.id)) {
        scopeItems.push(item);
        newScopeItems++;
      }
    }

    // Pricing observations: dedupe by id
    for (const obs of newPricing) {
      if (!pricingObs.find(p => p.id === obs.id)) {
        pricingObs.push(obs);
        newPricingObs++;
      }
    }

    processedHashes.add(hash);
    processed++;

    if (verbose) {
      log(`[ingest] Processed: ${fileName} → ${projectRecord.project_name} (${authorityResult.authority})`);
    }
  }

  // ── Write output files ──
  saveJson(PROCESSED_FILES.sourceDocuments,     sourceDocs);
  saveJson(PROCESSED_FILES.projectRecords,      projects);
  saveJson(PROCESSED_FILES.extractedScopeItems, scopeItems);
  saveJson(PROCESSED_FILES.pricingObservations, pricingObs);

  // ── Update ingest log ──
  const completedAt = new Date().toISOString();
  const runEntry: IngestRunEntry = {
    run_id: runId,
    started_at: startedAt,
    completed_at: completedAt,
    jurisdiction_filter: jurisdictionFilter,
    forced: force,
    files_scanned: scanned,
    files_processed: processed,
    files_skipped_dedup: skippedDedup,
    files_skipped_unsupported: skippedUnsupported,
    files_errored: errored,
    new_source_documents: newSourceDocs,
    new_project_records: newProjects,
    updated_project_records: updatedProjects,
    new_scope_items: newScopeItems,
    new_pricing_observations: newPricingObs,
    verified_authority_upgrades: upgrades,
    errors,
    warnings,
  };

  const existingLog = loadJson<IngestLog>(PROCESSED_FILES.ingestionLog, {
    last_run: '',
    total_files_ever_processed: 0,
    runs: [],
  });
  existingLog.last_run = completedAt;
  existingLog.total_files_ever_processed += processed;
  existingLog.runs.unshift(runEntry);
  if (existingLog.runs.length > 50) existingLog.runs = existingLog.runs.slice(0, 50);
  saveJson(PROCESSED_FILES.ingestionLog, existingLog);

  log(`[ingest] Run ${runId} complete: ${processed} processed, ${skippedDedup} skipped (dedup), ${errored} errors, ${upgrades} authority upgrades`);

  return runEntry;
}

// ── Jurisdiction fallback query ────────────────────────────────
// Used by getRelevantKnowledge to query processed records with fallback logic

export function queryProcessedProjects(
  workTypeId: string,
  jurisdiction?: IngestJurisdiction,
): ProjectRecord[] {
  const all = loadJson<ProjectRecord[]>(PROCESSED_FILES.projectRecords, []);

  const matchesWorkType = (p: ProjectRecord) =>
    p.glazing_systems.length === 0 || p.glazing_systems.includes(workTypeId);

  if (!jurisdiction || jurisdiction === 'general') {
    return all.filter(matchesWorkType);
  }

  // Prefer specific jurisdiction, fall back to general
  const specific = all.filter(p => p.source_jurisdiction === jurisdiction && matchesWorkType(p));
  if (specific.length > 0) return specific;

  return all.filter(p => p.source_jurisdiction === 'general' && matchesWorkType(p));
}

export function queryPricingObservations(
  glazingSystem: string,
  jurisdiction?: IngestJurisdiction,
  authorityOnly = false,
): PricingObservation[] {
  const all = loadJson<PricingObservation[]>(PROCESSED_FILES.pricingObservations, []);

  let filtered = all.filter(o =>
    o.glazing_system === glazingSystem || o.glazing_system === 'unknown'
  );

  if (authorityOnly) {
    filtered = filtered.filter(o => o.authority === 'verified_pricing_authority');
  }

  if (!jurisdiction || jurisdiction === 'general') return filtered;

  const specific = filtered.filter(o => o.jurisdiction === jurisdiction);
  if (specific.length > 0) return specific;

  return filtered.filter(o => o.jurisdiction === 'general');
}
