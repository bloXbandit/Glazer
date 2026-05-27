// ============================================================
// INGEST TYPES
// Types for the local procurement intelligence ingestion pipeline.
// These are separate from the main ScopeIntelligence types to keep
// ingest concerns isolated from the app's estimating types.
// ============================================================

// ── Enumerations ───────────────────────────────────────────────

export type IngestDocumentType =
  | 'subcontractor_proposal'
  | 'bid_tab'
  | 'award_notice'
  | 'rfp_specification'
  | 'glazing_scope_sheet'
  | 'pricing_backup'
  | 'manufacturer_reference'
  | 'unknown';

export type IngestJurisdiction =
  | 'dc'
  | 'maryland'
  | 'virginia'
  | 'federal'
  | 'university'
  | 'general';

export type IngestFileType =
  | 'pdf'
  | 'excel'
  | 'word'
  | 'csv'
  | 'text';

export type IngestAuthority =
  | 'historical_scope_intelligence'
  | 'verified_pricing_authority';

export type IngestPriceConfidence =
  | 'proposed'
  | 'leveled'
  | 'awarded'
  | 'historical'
  | 'indicative';

// ── Source document record (one per file) ─────────────────────

export interface SourceDocument {
  id: string;                        // deterministic: sha256(file_path)[:12]
  file_path: string;                 // relative to project root, e.g. data-ingest/raw/dc/foo.pdf
  file_name: string;
  file_type: IngestFileType;
  file_size_bytes: number;
  jurisdiction: IngestJurisdiction;
  document_type: IngestDocumentType;
  classification_confidence: number; // 0–1
  extracted_at: string;              // ISO date
  hash: string;                      // SHA-256 of raw file content (for dedup)
  project_record_id?: string;        // linked project if identified
  extraction_char_count: number;     // chars successfully extracted
  parse_errors: string[];
  skipped: boolean;
  skip_reason?: string;
}

// ── Project record (one per identified project) ───────────────

export interface ProjectRecord {
  id: string;                        // generated UUID
  project_name: string;
  project_location: string;
  owner_client?: string;
  source_jurisdiction: IngestJurisdiction;
  bid_date?: string;
  award_date?: string;
  quote_valid_until?: string;
  glazing_systems: string[];
  total_sf?: number;
  total_price?: number;
  effective_psf?: number;            // only set when both total_price and total_sf are known
  price_confidence: IngestPriceConfidence;
  authority: IngestAuthority;
  authority_upgrade_reasons: string[];   // which of the 6 conditions triggered upgrade
  authority_missing_conditions: string[]; // which conditions were not met
  scope_inclusions: string[];
  scope_exclusions: string[];
  lead_time_summary: string[];
  warranty_summary?: string;
  mobilization_included?: boolean;
  access_methods: string[];
  risk_flags: Array<{
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
    category: string;
  }>;
  bidders: string[];
  source_document_ids: string[];
  last_updated: string;
  confidence_score: number;          // 0–1 composite parse quality
}

// ── Scope item (one per inclusion/exclusion extracted) ────────

export interface ExtractedScopeItem {
  id: string;
  source_document_id: string;
  project_record_id: string;
  type: 'inclusion' | 'exclusion';
  text: string;
  glazing_system?: string;
  jurisdiction: IngestJurisdiction;
  bid_date?: string;
  confidence: number;
}

// ── Pricing observation (one per line item or $/SF data point) ─

export interface PricingObservation {
  id: string;
  source_document_id: string;
  project_record_id: string;
  description: string;
  glazing_system: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  extended_price?: number;
  effective_psf?: number;            // only when quantity in SF is known
  price_confidence: IngestPriceConfidence;
  authority: IngestAuthority;
  jurisdiction: IngestJurisdiction;
  bid_date?: string;
  bidder?: string;
  project_name?: string;
  project_location?: string;
}

// ── Ingest run log ─────────────────────────────────────────────

export interface IngestRunEntry {
  run_id: string;
  started_at: string;
  completed_at: string;
  jurisdiction_filter?: string;
  forced: boolean;
  files_scanned: number;
  files_processed: number;
  files_skipped_dedup: number;
  files_skipped_unsupported: number;
  files_errored: number;
  new_source_documents: number;
  new_project_records: number;
  updated_project_records: number;
  new_scope_items: number;
  new_pricing_observations: number;
  verified_authority_upgrades: number;
  errors: Array<{ file: string; error: string }>;
  warnings: Array<{ file: string; warning: string }>;
}

export interface IngestLog {
  last_run: string;
  total_files_ever_processed: number;
  runs: IngestRunEntry[];
}

// ── Processed outputs bundle (what /api/processed-intel returns) ─

export interface ProcessedIntelBundle {
  projectRecords: ProjectRecord[];
  sourceDocuments: SourceDocument[];
  extractedScopeItems: ExtractedScopeItem[];
  pricingObservations: PricingObservation[];
  meta: {
    last_updated: string;
    total_projects: number;
    total_sources: number;
    verified_pricing_count: number;
    jurisdictions: Record<IngestJurisdiction, number>;
  };
}

// ── Per-file extraction result (internal pipeline type) ────────

export interface FileExtractionResult {
  success: boolean;
  text: string;
  file_type: IngestFileType;
  char_count: number;
  error?: string;
  sheets?: Array<{ name: string; rows: string[][] }>; // for Excel
}

// ── Authority upgrade check result ────────────────────────────

export interface AuthorityCheckResult {
  authority: IngestAuthority;
  met_conditions: string[];
  missing_conditions: string[];
  score: number; // 0–6
}
