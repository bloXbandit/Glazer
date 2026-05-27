// ============================================================
// GLAZE ESTIMATING PLATFORM - CORE TYPE DEFINITIONS
// Single source of truth for all TypeScript interfaces
// Structured for mock-data MVP with clean DB migration path
// ============================================================

// ------------------------------------------------------------
// SOURCE INGESTION FRAMEWORK
// ------------------------------------------------------------

export type SourceType =
  | 'pricing'
  | 'scope_definition'
  | 'procurement'
  | 'technical_engineering'
  | 'code_compliance'
  | 'manufacturer_product'
  | 'historical_project'
  | 'educational_reference';

export type FactType =
  | 'price_per_sf'
  | 'price_per_lf'
  | 'price_per_unit'
  | 'labor_hours_per_sf'
  | 'labor_rate'
  | 'multiplier'
  | 'lead_time_weeks'
  | 'scope_note'
  | 'risk_note'
  | 'install_note'
  | 'code_requirement'
  | 'procurement_note'
  | 'technical_spec';

export type SourceConfidence = 'verified' | 'high' | 'medium' | 'low' | 'unverified';

export interface ExtractedFact {
  id: string;
  fact_type: FactType;
  text: string;
  numeric_value?: number;
  unit?: string;
  confidence: SourceConfidence;
  applies_to: string[]; // work_type IDs this fact applies to
  can_affect_price: boolean; // ONLY true if source_type is 'pricing' or 'historical_project'
  notes?: string;
}

export interface SourceRecord {
  id: string;
  title: string;
  url: string;
  publisher: string;
  source_type: SourceType;
  date_accessed: string; // ISO date string
  date_published?: string;
  confidence_weight: number; // 0.0 – 1.0 weight applied to derived values
  allowed_usage: SourceAllowedUsage[];
  extracted_facts: ExtractedFact[];
  linked_work_types: string[]; // work_type IDs
  notes?: string;
}

export type SourceAllowedUsage =
  | 'estimate_pricing'    // only pricing + historical_project sources
  | 'scope_description'
  | 'assumption_text'
  | 'procurement_item'
  | 'risk_flag'
  | 'confidence_score'
  | 'install_complexity'
  | 'user_guidance'
  | 'ai_advisor_context';

// ------------------------------------------------------------
// WORK TYPE (GLAZING SYSTEM)
// ------------------------------------------------------------

export type DifficultyRating = 'Low' | 'Medium' | 'High' | 'Very High';
export type ProcurementRisk = 'Low' | 'Medium' | 'High' | 'Very High';

export interface WorkType {
  id: string;
  name: string;
  short_description: string;
  use_case: string;
  csi_division: string;
  typical_lead_time_weeks: { min: number; max: number };
  difficulty_rating: DifficultyRating;
  procurement_risk: ProcurementRisk;
  source_ids: string[]; // which SourceRecords define this
  tags: string[];
}

// ------------------------------------------------------------
// PRICING BENCHMARKS (only from pricing/historical sources)
// ------------------------------------------------------------

export interface PricingBenchmark {
  id: string;
  work_type_id: string;
  region_id: string | 'national'; // 'national' = applies everywhere
  price_low: number;   // $/SF
  price_mid: number;
  price_high: number;
  year: number;
  source_id: string;  // must link to source_type = 'pricing' | 'historical_project'
  notes?: string;
}

// ------------------------------------------------------------
// GLASS TYPES
// ------------------------------------------------------------

export interface GlassType {
  id: string;
  name: string;
  description: string;
  cost_multiplier: number; // applied to base material cost
  lead_time_impact_weeks: number; // added weeks on top of system baseline
  performance_notes: string;
  source_ids: string[];
  applicable_work_types: string[]; // empty = all
}

// ------------------------------------------------------------
// LABOR FACTORS
// ------------------------------------------------------------

export interface LaborRate {
  id: string;
  region_id: string;
  trade: string; // 'glazier' | 'ironworker' | etc.
  base_rate_per_hour: number; // private / open shop
  davis_bacon_rate?: number;
  maryland_pw_rate?: number;
  virginia_pw_rate?: number;
  benefits_burden: number; // multiplier e.g. 1.40
  source_id: string;
  effective_date: string;
}

export interface LaborProductivity {
  id: string;
  work_type_id: string;
  hours_per_sf: number; // baseline for new construction, ground level
  source_id: string;
  notes?: string;
}

// ------------------------------------------------------------
// REGIONS
// ------------------------------------------------------------

export interface Region {
  id: string;
  name: string;
  state: string;
  description: string;
  material_cost_multiplier: number;
  labor_cost_multiplier: number;
  permit_complexity: 'Low' | 'Medium' | 'High';
  typical_conditions: string[];
  source_ids: string[];
}

// ------------------------------------------------------------
// PROJECT CONDITIONS
// ------------------------------------------------------------

export type ProjectType = 'private' | 'federal_davis_bacon' | 'maryland_public' | 'virginia_public';
export type BuildingType = 'office' | 'school' | 'hospital' | 'retail' | 'government' | 'data_center' | 'multifamily';
export type WorkCondition = 'new_construction' | 'renovation' | 'occupied_building';
export type AccessCondition = 'ground_level' | 'low_rise' | 'mid_rise' | 'high_rise' | 'swing_stage' | 'crane_required';
export type EstimateMode = 'Quick' | 'Detailed';

export interface ProjectConditionMultiplier {
  id: string;
  condition_type: 'project_type' | 'building_type' | 'work_condition' | 'access';
  condition_id: string;
  label: string;
  wage_multiplier?: number;
  complexity_multiplier?: number;
  access_multiplier?: number;
  difficulty_multiplier?: number;
  description: string;
  compliance_notes: string[];
}

// ------------------------------------------------------------
// PROCUREMENT ITEMS
// ------------------------------------------------------------

export interface ProcurementItem {
  id: string;
  name: string;
  description: string;
  category: 'material' | 'equipment' | 'submittal' | 'testing' | 'ancillary';
  applicable_work_types: string[];
  estimated_cost_per_sf?: number;
  estimated_cost_fixed?: number;
  cost_authority: boolean; // false = scope/risk only, not price driver
  source_ids: string[];
  risk_note?: string;
}

// ------------------------------------------------------------
// MANUFACTURER SYSTEMS
// ------------------------------------------------------------

export interface ManufacturerSystem {
  id: string;
  manufacturer: string;
  product_line: string;
  system_type: string;
  work_type_id: string;
  typical_use: string;
  performance_specs: string[];
  approximate_cost_tier: 'Budget' | 'Mid' | 'Premium' | 'Custom';
  lead_time_weeks: { min: number; max: number };
  source_id: string;
  notes?: string;
}

// ------------------------------------------------------------
// SPEC REQUIREMENTS
// ------------------------------------------------------------

export interface SpecRequirement {
  id: string;
  work_type_id: string;
  csi_section: string;
  requirement: string;
  requirement_type: 'mandatory' | 'conditional' | 'optional';
  condition?: string;
  source_id: string;
}

// ------------------------------------------------------------
// RISK RULES
// ------------------------------------------------------------

export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskCategory = 'Pricing' | 'Schedule' | 'Compliance' | 'Technical' | 'Market' | 'Procurement';

export interface RiskRule {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  trigger_condition: string; // human-readable description of what triggers this
  message: string;
  recommendation: string;
  applicable_work_types: string[]; // empty = all
  source_ids: string[];
}

// ------------------------------------------------------------
// ESTIMATE ENGINE I/O
// ------------------------------------------------------------

export interface EstimateInput {
  // Scope
  work_type_id: string;
  glass_type_id: string;
  
  // Location and conditions
  region_id: string;
  project_type: ProjectType;
  building_type: BuildingType;
  work_condition: WorkCondition;
  access_condition: AccessCondition;
  
  // Quantities
  total_sf: number;
  num_openings?: number;
  mode: EstimateMode;
  
  // Custom overrides (user-entered, clearly labeled)
  custom_contingency_pct?: number;
  custom_profit_pct?: number;
  custom_labor_rate?: number;
  include_bond?: boolean;
  
  // Special requirements
  has_fire_rating?: boolean;
  has_blast_security?: boolean;
  has_acoustic_requirement?: boolean;
}

export interface EstimateLineItem {
  label: string;
  category: 'material' | 'labor' | 'equipment' | 'markup' | 'tax';
  base_value: number;
  adjusted_value: number;
  per_sf?: number;
  multipliers_applied: string[];
  note?: string;
}

export interface EstimateResult {
  // Line items
  line_items: EstimateLineItem[];
  
  // Cost totals
  total_material: number;
  total_labor: number;
  total_equipment: number;
  total_direct: number;
  total_overhead: number;
  total_contingency: number;
  total_profit: number;
  total_tax: number;
  total_bond: number;
  grand_total: number;
  effective_per_sf: number;
  total_labor_hours: number;
  
  // Market position
  market_position: 'Below Market' | 'Competitive' | 'Premium' | 'High Risk / Over Market';
  benchmark_low: number;
  benchmark_mid: number;
  benchmark_high: number;
  
  // Applied multipliers audit trail
  multipliers_summary: MultiplierSummary[];
}

export interface MultiplierSummary {
  name: string;
  value: number;
  source: string;
}

// ------------------------------------------------------------
// CONFIDENCE ENGINE
// ------------------------------------------------------------

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface ConfidenceInput {
  region_id: string | null;
  work_type_id: string | null;
  glass_type_id: string | null;
  total_sf: number;
  project_type: string | null;
  building_type: string | null;
  work_condition: string | null;
  access_condition: string | null;
  mode: EstimateMode;
  num_openings: number;
  has_fire_rating: boolean;
  has_blast_security: boolean;
}

export interface ConfidenceFactor {
  label: string;
  satisfied: boolean;
  weight: number;
  note: string;
}

export interface ConfidenceReport {
  level: ConfidenceLevel;
  score: number; // 0–100
  factors: ConfidenceFactor[];
  summary: string;
}

// ------------------------------------------------------------
// RISK ENGINE
// ------------------------------------------------------------

export interface RiskFlag {
  id: string;
  severity: RiskSeverity;
  category: RiskCategory;
  message: string;
  recommendation: string;
}

// ------------------------------------------------------------
// FULL ESTIMATE PACKET (sent to AI advisor + shown in UI)
// ------------------------------------------------------------

export interface EstimatePacket {
  id: string;
  created_at: string;
  mode: EstimateMode;
  
  // Resolved labels (not raw IDs)
  work_type_name: string;
  glass_type_name: string;
  region_name: string;
  project_type_label: string;
  building_type_label: string;
  work_condition_label: string;
  access_condition_label: string;
  
  // Quantities
  total_sf: number;
  num_openings: number;
  
  // Results
  result: EstimateResult;
  confidence: ConfidenceReport;
  risk_flags: RiskFlag[];
  
  // Explanatory text
  assumptions: string[];
  exclusions: string[];
  
  // For AI advisor - structured, no raw prices invented
  ai_context: AIAdvisorContext;

  // Basis of Estimate narrative (deterministic, source-attributed)
  narrative: EstimateNarrative;

  // Live data factors applied (empty if offline/unavailable)
  live_data_factors: LiveDataFactor[];
}

export interface AIAdvisorContext {
  work_type_name: string;
  region_name: string;
  project_type_label: string;
  total_sf: number;
  effective_per_sf: number;
  benchmark_range: { low: number; mid: number; high: number };
  market_position: string;
  confidence_level: ConfidenceLevel;
  confidence_score: number;
  confidence_factors: string[]; // human-readable list
  risk_flag_messages: string[];
  key_assumptions: string[];
  special_requirements: string[];
  grand_total: number;
}

// ------------------------------------------------------------
// REPOSITORY INTERFACE (swap point for DB migration)
// ------------------------------------------------------------

export interface IDataRepository {
  getWorkTypes(): Promise<WorkType[]>;
  getWorkTypeById(id: string): Promise<WorkType | null>;
  getGlassTypes(): Promise<GlassType[]>;
  getRegions(): Promise<Region[]>;
  getRegionById(id: string): Promise<Region | null>;
  getLaborRates(): Promise<LaborRate[]>;
  getLaborProductivity(): Promise<LaborProductivity[]>;
  getPricingBenchmarks(work_type_id: string, region_id: string): Promise<PricingBenchmark[]>;
  getProjectConditionMultipliers(): Promise<ProjectConditionMultiplier[]>;
  getProcurementItems(work_type_id: string): Promise<ProcurementItem[]>;
  getManufacturerSystems(work_type_id: string): Promise<ManufacturerSystem[]>;
  getSpecRequirements(work_type_id: string): Promise<SpecRequirement[]>;
  getRiskRules(): Promise<RiskRule[]>;
  getSourceById(id: string): Promise<SourceRecord | null>;
  getSources(): Promise<SourceRecord[]>;
}

// ------------------------------------------------------------
// SAVED QUOTE (future DB persistence)
// ------------------------------------------------------------

export interface SavedQuote {
  id: string;
  project_name: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
  packet: EstimatePacket;
  status: 'draft' | 'submitted' | 'won' | 'lost' | 'expired';
  notes?: string;
}

// ------------------------------------------------------------
// KNOWLEDGE INGESTION (structured domain knowledge)
// Feeds narrative engine, risk engine, and AI advisor context
// ------------------------------------------------------------

export type KnowledgeCategory =
  | 'historical_bid'              // Real project bid actuals
  | 'market_intel'                // Regional pricing trends, supply chain conditions
  | 'code_requirement'            // Jurisdictional code, AHJ interpretations
  | 'labor_market'                // Trade availability, wage pressures
  | 'material_market'             // Supplier pricing, lead time intel
  | 'spec_note'                   // Common specification pitfalls and requirements
  | 'risk_intel'                  // Contractor lessons learned
  | 'historical_scope_intelligence'; // Normalized procurement doc intel (not verified pricing)

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  body: string;                    // Full prose — used directly in narrative
  applies_to_work_types: string[]; // empty = all
  applies_to_regions: string[];    // empty = all
  source_id: string;               // must reference a SourceRecord
  can_affect_price: boolean;       // false = narrative/risk only, not a cost driver
  effective_date: string;          // ISO date — used for recency scoring
  expiry_date?: string;            // when this intel becomes stale
  tags: string[];
}

// ------------------------------------------------------------
// LIVE DATA CALIBRATION
// Escalation and wage factors from live public APIs
// Applied as multipliers on top of RSMeans baselines
// ------------------------------------------------------------

export type LiveDataSource = 'bls_ppi' | 'sam_gov_wd' | 'usaspending' | 'manual';

export interface LiveDataFactor {
  id: string;
  source: LiveDataSource;
  label: string;
  description: string;
  factor_type: 'material_escalation' | 'wage_rate' | 'benchmark_calibration';
  applies_to: string[];            // work_type IDs or 'all'
  applies_to_region?: string;
  value: number;                   // multiplier (1.0 = no change) or absolute rate
  base_year: number;               // year of the baseline data being adjusted
  as_of_date: string;              // ISO date of this live factor
  series_id?: string;              // BLS series ID, SAM.gov WD number, etc.
  raw_value?: number;              // raw index value before conversion to multiplier
  fetched_at: string;              // ISO datetime of last API fetch
}

export interface LiveDataCache {
  last_fetched: string;
  factors: LiveDataFactor[];
  status: 'fresh' | 'stale' | 'error' | 'unavailable';
  error_message?: string;
}

// ------------------------------------------------------------
// NARRATIVE ENGINE OUTPUT
// Basis of Estimate — structured prose with source citations
// ------------------------------------------------------------

export interface NarrativeSection {
  id: string;
  heading: string;
  body: string;                    // Full paragraph prose
  citation_ids: string[];          // SourceRecord IDs cited in this section
  knowledge_entry_ids: string[];   // KnowledgeEntry IDs used
  data_points: NarrativeDataPoint[];
}

export interface NarrativeDataPoint {
  label: string;
  value: string;
  source_id: string;
  is_live_data: boolean;
}

export interface EstimateNarrative {
  title: string;
  subtitle: string;
  generated_at: string;
  sections: NarrativeSection[];
  all_citations: CitationRecord[];
  live_data_applied: boolean;
  live_data_note?: string;
}

export interface CitationRecord {
  id: string;           // SourceRecord ID
  title: string;
  publisher: string;
  url: string;
  date_published?: string;
  source_type: SourceType;
  usage_note: string;   // how this source was used in this specific estimate
}

// ------------------------------------------------------------
// PROCUREMENT INTELLIGENCE INGESTION
// Parses subcontractor proposals, bid tabs, and scope docs into
// structured estimating intelligence.
// Treated as: historical_scope_intelligence
// NOT verified_pricing_authority unless confirmed award values.
// ------------------------------------------------------------

export type ProcurementDocumentType =
  | 'subcontractor_proposal'   // Glazing sub's bid proposal / cover letter + scope
  | 'bid_tab'                  // Structured bid leveling sheet / comparison matrix
  | 'scope_exhibit'            // Scope of work exhibit attached to subcontract
  | 'rfq_response'             // Response to Request for Quotation
  | 'purchase_order'           // Confirmed PO (pricing may qualify as verified)
  | 'subcontract_exhibit'      // Executed subcontract scope exhibit
  | 'submittal_cover'          // Submittal transmittal with scope summary
  | 'change_order_proposal';   // CO proposal with scope and pricing breakdown

export type PriceConfidence =
  | 'proposed'    // Sub's proposal price — not yet leveled or awarded
  | 'leveled'     // Bid-leveled / normalized across multiple subs
  | 'awarded'     // Confirmed contract award value
  | 'historical'  // Historical actuals from completed project
  | 'indicative'; // Budgetary / ROM — explicitly non-binding

export type FurnishInstallType =
  | 'furnish_and_install'   // Full F&I scope
  | 'install_only'          // Sub installs owner/GC-furnished material
  | 'furnish_only'          // Material supply only, no installation
  | 'design_assist'         // Design-assist with pricing to follow
  | 'delegated_design';     // Engineer of record delegated to sub/manufacturer

// ── Line Items ────────────────────────────────────────────────

export interface ProcurementLineItem {
  id: string;
  description: string;                       // As written in proposal
  normalized_description?: string;           // Cleaned/standardized label
  glazing_system_category?: string;          // maps to WorkType id
  quantity?: number;
  unit?: string;                             // SF, LF, EA, LS, etc.
  unit_price?: number;                       // $/unit from proposal
  extended_price?: number;                   // total line value
  price_confidence: PriceConfidence;
  furnish_install: FurnishInstallType;
  included_in_base: boolean;                 // false = alternate or add/deduct
  is_alternate?: boolean;
  alternate_description?: string;
  notes?: string;
}

// ── Furnish / Install Breakdown ───────────────────────────────

export interface FurnishInstallBreakdown {
  material_by: 'sub' | 'gc' | 'owner' | 'unspecified';
  install_by: 'sub' | 'gc' | 'owner' | 'unspecified';
  material_percentage?: number;   // % of total that is material
  labor_percentage?: number;      // % of total that is labor
  notes: string;
}

// ── Lead Time ─────────────────────────────────────────────────

export interface LeadTimeEntry {
  item: string;               // e.g. "Unitized panels", "Specialty glass"
  weeks_min?: number;
  weeks_max?: number;
  weeks_typical?: number;
  clock_start: string;        // e.g. "from approved shop drawings", "from PO"
  notes?: string;
}

// ── Mobilization ─────────────────────────────────────────────

export interface MobilizationAssumption {
  included: boolean;
  mob_cost?: number;           // lump sum mobilization if called out
  demob_cost?: number;
  trips_assumed?: number;
  phasing_notes?: string;
  notes: string;
}

// ── Access ────────────────────────────────────────────────────

export interface AccessAssumption {
  method: string;              // e.g. "swing stage", "scissor lift", "scaffold"
  provided_by: 'sub' | 'gc' | 'owner' | 'unspecified';
  floor_range?: string;        // e.g. "Floors 1-4", "All levels"
  included_in_price: boolean;
  assumptions_stated: string[];
  notes?: string;
}

// ── Warranty ──────────────────────────────────────────────────

export interface WarrantyTerm {
  scope: string;               // What is covered
  years: number;
  labor_included: boolean;
  material_included: boolean;
  glass_breakage_excluded: boolean;
  notes?: string;
}

// ── Procurement Risk ──────────────────────────────────────────

export interface ProcurementRiskFlag {
  id: string;
  category: 'scope_gap' | 'exclusion_risk' | 'price_escalation' | 'schedule' | 'access' | 'compliance' | 'subcontractor_capacity';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  source_text?: string;       // Verbatim text from proposal that triggered this flag
  recommendation: string;
}

// ── Master Normalized Output ──────────────────────────────────

export interface ScopeIntelligence {
  id: string;
  document_id: string;
  parsed_at: string;            // ISO datetime

  // Document metadata
  document_type: ProcurementDocumentType;
  subcontractor_name?: string;
  project_name?: string;
  project_location?: string;
  bid_date?: string;
  quote_valid_until?: string;
  revision?: string;

  // Scope summary
  glazing_systems: string[];     // normalized WorkType ids detected
  total_sf_proposed?: number;
  total_price_proposed?: number;
  price_confidence: PriceConfidence;
  furnish_install: FurnishInstallBreakdown;

  // Extracted intelligence
  inclusions: string[];
  exclusions: string[];
  line_items: ProcurementLineItem[];
  lead_times: LeadTimeEntry[];
  mobilization: MobilizationAssumption;
  access_assumptions: AccessAssumption[];
  warranty: WarrantyTerm | null;
  risks: ProcurementRiskFlag[];

  // Parsing metadata
  parse_method: 'deterministic' | 'ai_assisted' | 'manual';
  parse_confidence: 'high' | 'medium' | 'low';
  raw_text_snippet?: string;     // First 500 chars of source document
  notes?: string;
}

// ── Raw document input (what the user provides) ───────────────

export interface ProcurementDocumentInput {
  document_type: ProcurementDocumentType;
  raw_text: string;
  subcontractor_name?: string;
  project_name?: string;
  project_location?: string;
  bid_date?: string;
}
