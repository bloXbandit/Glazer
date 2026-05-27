// ============================================================
// PROCESSED INTEL API ROUTE
// GET /api/processed-intel
// Serves the processed procurement intelligence to the frontend.
// Supports jurisdiction and workType query params.
//
// GET /api/processed-intel?jurisdiction=dc&workType=unitized_curtain_wall
// GET /api/processed-intel?authorityOnly=true
// GET /api/processed-intel?type=pricing
// GET /api/processed-intel?type=scope
// GET /api/processed-intel?type=projects
// GET /api/processed-intel?type=log
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import type {
  ProjectRecord,
  SourceDocument,
  ExtractedScopeItem,
  PricingObservation,
  IngestLog,
  IngestJurisdiction,
  ProcessedIntelBundle,
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

function jurisdictionMatch(record: { source_jurisdiction: IngestJurisdiction }, jur: string | null): boolean {
  if (!jur) return true;
  if (record.source_jurisdiction === jur) return true;
  // general is always included as fallback
  if (record.source_jurisdiction === 'general') return true;
  return false;
}

function workTypeMatch(
  record: { glazing_systems: string[] },
  workType: string | null
): boolean {
  if (!workType) return true;
  if (record.glazing_systems.length === 0) return true;
  return record.glazing_systems.includes(workType);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type          = searchParams.get('type');          // projects | pricing | scope | sources | log | all
  const jurisdiction  = searchParams.get('jurisdiction');
  const workType      = searchParams.get('workType');
  const authorityOnly = searchParams.get('authorityOnly') === 'true';

  // ── Single type requests ──────────────────────────────────────

  if (type === 'log') {
    const log = loadJson<IngestLog>('ingestionLog.json', {
      last_run: '',
      total_files_ever_processed: 0,
      runs: [],
    });
    return NextResponse.json(log);
  }

  if (type === 'sources') {
    const docs = loadJson<SourceDocument[]>('sourceDocuments.json', []);
    return NextResponse.json(docs);
  }

  if (type === 'scope') {
    let items = loadJson<ExtractedScopeItem[]>('extractedScopeItems.json', []);
    if (jurisdiction) {
      items = items.filter(i => i.jurisdiction === jurisdiction || i.jurisdiction === 'general');
    }
    return NextResponse.json(items);
  }

  if (type === 'pricing') {
    let obs = loadJson<PricingObservation[]>('pricingObservations.json', []);
    if (authorityOnly) obs = obs.filter(o => o.authority === 'verified_pricing_authority');
    if (jurisdiction)  obs = obs.filter(o => o.jurisdiction === jurisdiction || o.jurisdiction === 'general');
    if (workType)      obs = obs.filter(o => o.glazing_system === workType || o.glazing_system === 'unknown');
    // Only include observations with a usable unit price or effective_psf
    obs = obs.filter(o => o.unit_price !== undefined || o.effective_psf !== undefined || o.extended_price !== undefined);
    return NextResponse.json(obs);
  }

  if (type === 'projects') {
    let projects = loadJson<ProjectRecord[]>('projectRecords.json', []);
    if (authorityOnly) projects = projects.filter(p => p.authority === 'verified_pricing_authority');
    if (jurisdiction)  projects = projects.filter(p => jurisdictionMatch(p, jurisdiction));
    if (workType)      projects = projects.filter(p => workTypeMatch(p, workType));
    return NextResponse.json(projects);
  }

  // ── Default: full bundle ──────────────────────────────────────

  let projects = loadJson<ProjectRecord[]>('projectRecords.json', []);
  let obs      = loadJson<PricingObservation[]>('pricingObservations.json', []);
  let scope    = loadJson<ExtractedScopeItem[]>('extractedScopeItems.json', []);
  const docs   = loadJson<SourceDocument[]>('sourceDocuments.json', []);

  if (authorityOnly) {
    projects = projects.filter(p => p.authority === 'verified_pricing_authority');
    obs      = obs.filter(o => o.authority === 'verified_pricing_authority');
  }
  if (jurisdiction) {
    projects = projects.filter(p => jurisdictionMatch(p, jurisdiction));
    obs      = obs.filter(o => o.jurisdiction === jurisdiction || o.jurisdiction === 'general');
    scope    = scope.filter(i => i.jurisdiction === jurisdiction || i.jurisdiction === 'general');
  }
  if (workType) {
    projects = projects.filter(p => workTypeMatch(p, workType));
    obs      = obs.filter(o => o.glazing_system === workType || o.glazing_system === 'unknown');
  }

  // Build jurisdiction stats
  const allProjects = loadJson<ProjectRecord[]>('projectRecords.json', []);
  const jurisdictions = allProjects.reduce<Record<IngestJurisdiction, number>>((acc, p) => {
    acc[p.source_jurisdiction] = (acc[p.source_jurisdiction] ?? 0) + 1;
    return acc;
  }, {} as Record<IngestJurisdiction, number>);

  const bundle: ProcessedIntelBundle = {
    projectRecords: projects,
    sourceDocuments: docs,
    extractedScopeItems: scope,
    pricingObservations: obs,
    meta: {
      last_updated: loadJson<IngestLog>('ingestionLog.json', { last_run: '', total_files_ever_processed: 0, runs: [] }).last_run,
      total_projects: allProjects.length,
      total_sources: docs.length,
      verified_pricing_count: allProjects.filter(p => p.authority === 'verified_pricing_authority').length,
      jurisdictions,
    },
  };

  return NextResponse.json(bundle, {
    headers: {
      'Cache-Control': 'no-store', // always fresh — ingest may run anytime
    },
  });
}
