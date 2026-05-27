// ============================================================
// REGIONS - DMV Market with Multipliers
// material_cost_multiplier and labor_cost_multiplier sourced from RSMeans.
// Condition notes inform scope/risk only — not pricing authority.
// ============================================================

import type { Region, ProjectConditionMultiplier } from '@/types';

export const regions: Region[] = [
  {
    id: 'dc',
    name: 'Washington D.C.',
    state: 'DC',
    description: 'Federal district — highest labor costs, strict inspections, Davis-Bacon standard',
    material_cost_multiplier: 1.25,
    labor_cost_multiplier: 1.30,
    permit_complexity: 'High',
    typical_conditions: ['Davis-Bacon prevailing wage', 'DC DCRA inspections', 'Street parking constraints', 'Historic review possible'],
    source_ids: ['src-rsmeans-2024', 'src-cdc-dmv-bid-data-2023']
  },
  {
    id: 'montgomery_county',
    name: 'Montgomery County, MD',
    state: 'MD',
    description: 'Affluent Maryland suburb — high energy code standards, design review, union presence',
    material_cost_multiplier: 1.20,
    labor_cost_multiplier: 1.25,
    permit_complexity: 'High',
    typical_conditions: ['Maryland prevailing wage (public)', 'Strict energy codes (IGCC)', 'DPS design review', 'High union presence'],
    source_ids: ['src-rsmeans-2024']
  },
  {
    id: 'prince_georges',
    name: "Prince George's County, MD",
    state: 'MD',
    description: 'Urban Maryland county — moderate costs, mixed project types',
    material_cost_multiplier: 1.10,
    labor_cost_multiplier: 1.15,
    permit_complexity: 'Medium',
    typical_conditions: ['Maryland prevailing wage (public)', 'Mixed permit requirements', 'Varied inspection process'],
    source_ids: ['src-rsmeans-2024']
  },
  {
    id: 'baltimore',
    name: 'Baltimore City, MD',
    state: 'MD',
    description: 'Major Maryland city — urban access challenges, competitive market',
    material_cost_multiplier: 1.05,
    labor_cost_multiplier: 1.10,
    permit_complexity: 'Medium',
    typical_conditions: ['Maryland prevailing wage (public)', 'Urban staging constraints', 'Historic districts common', 'Competitive bidding market'],
    source_ids: ['src-rsmeans-2024']
  },
  {
    id: 'fairfax',
    name: 'Fairfax County, VA',
    state: 'VA',
    description: 'Affluent NoVA suburb — high-end projects, strict plan review',
    material_cost_multiplier: 1.18,
    labor_cost_multiplier: 1.22,
    permit_complexity: 'High',
    typical_conditions: ['Virginia prevailing wage (public)', 'Fairfax County plan review', 'High-end performance standards', 'Complex permit coordination'],
    source_ids: ['src-rsmeans-2024', 'src-cdc-dmv-bid-data-2023']
  },
  {
    id: 'arlington_alexandria',
    name: 'Arlington / Alexandria, VA',
    state: 'VA',
    description: 'Dense urban NoVA core — metro proximity, high visibility projects',
    material_cost_multiplier: 1.22,
    labor_cost_multiplier: 1.28,
    permit_complexity: 'High',
    typical_conditions: ['Virginia prevailing wage (public)', 'Urban site constraints', 'Metro construction coordination', 'High-visibility project standards'],
    source_ids: ['src-rsmeans-2024', 'src-cdc-dmv-bid-data-2023']
  },
  {
    id: 'loudoun_pw',
    name: 'Loudoun / Prince William, VA',
    state: 'VA',
    description: 'Growth corridor — primarily new construction, data center market',
    material_cost_multiplier: 1.08,
    labor_cost_multiplier: 1.12,
    permit_complexity: 'Medium',
    typical_conditions: ['Virginia prevailing wage (public)', 'Rapid growth environment', 'Data center projects common', 'Suburban access conditions'],
    source_ids: ['src-rsmeans-2024']
  }
];

// Project condition multipliers — used by estimateEngine
// wage_multiplier applies to labor cost only
// complexity_multiplier applies to full direct cost
export const projectConditionMultipliers: ProjectConditionMultiplier[] = [
  // Project Types
  {
    id: 'pt-private',
    condition_type: 'project_type',
    condition_id: 'private',
    label: 'Private Sector',
    wage_multiplier: 1.00,
    description: 'Standard commercial project, open-shop or union rates',
    compliance_notes: ['Standard building codes', 'OSHA 1926 subpart R']
  },
  {
    id: 'pt-federal-db',
    condition_type: 'project_type',
    condition_id: 'federal_davis_bacon',
    label: 'Federal / Davis-Bacon',
    wage_multiplier: 1.45,
    description: 'Federal contract subject to Davis-Bacon Act prevailing wage',
    compliance_notes: ['Davis-Bacon & Related Acts', 'WH-347 certified payroll', 'E-Verify', 'Buy American Act consideration']
  },
  {
    id: 'pt-md-public',
    condition_type: 'project_type',
    condition_id: 'maryland_public',
    label: 'Maryland Public Works',
    wage_multiplier: 1.35,
    description: 'Maryland state/county public project with prevailing wage',
    compliance_notes: ['Maryland Prevailing Wage Law', 'MBE/DBE participation', 'State-certified payroll']
  },
  {
    id: 'pt-va-public',
    condition_type: 'project_type',
    condition_id: 'virginia_public',
    label: 'Virginia Public Works',
    wage_multiplier: 1.30,
    description: 'Virginia state/local public project with prevailing wage',
    compliance_notes: ['Virginia Overtime Wage Act', 'DBE participation', 'VDOT/state reporting if applicable']
  },
  // Building Types
  {
    id: 'bt-office',
    condition_type: 'building_type',
    condition_id: 'office',
    label: 'Office Building',
    complexity_multiplier: 1.00,
    description: 'Standard commercial office occupancy',
    compliance_notes: ['Typical commercial schedule', 'Tenant coordination may apply']
  },
  {
    id: 'bt-school',
    condition_type: 'building_type',
    condition_id: 'school',
    label: 'School / Educational',
    complexity_multiplier: 1.15,
    description: 'K-12 or higher education facility',
    compliance_notes: ['Summer break schedule critical', 'Security background checks for workers', 'Occupied building protocols']
  },
  {
    id: 'bt-hospital',
    condition_type: 'building_type',
    condition_id: 'hospital',
    label: 'Hospital / Medical',
    complexity_multiplier: 1.25,
    description: 'Healthcare facility with critical operations',
    compliance_notes: ['ICRA/ILSM infection control plans', 'Noise/vibration controls', 'Critical path sequencing']
  },
  {
    id: 'bt-retail',
    condition_type: 'building_type',
    condition_id: 'retail',
    label: 'Retail / Commercial',
    complexity_multiplier: 0.95,
    description: 'Retail storefront or commercial tenant build-out',
    compliance_notes: ['Hard opening deadlines', 'Customer-facing work quality expectations']
  },
  {
    id: 'bt-government',
    condition_type: 'building_type',
    condition_id: 'government',
    label: 'Government / Federal Building',
    complexity_multiplier: 1.20,
    description: 'Government agency occupancy with security requirements',
    compliance_notes: ['Security clearance requirements', 'Strict inspection protocols', 'Multiple agency approvals']
  },
  {
    id: 'bt-datacenter',
    condition_type: 'building_type',
    condition_id: 'data_center',
    label: 'Data Center',
    complexity_multiplier: 1.30,
    description: 'Mission-critical data center facility',
    compliance_notes: ['Zero downtime tolerance', 'Blast/security glazing common', 'Stringent fire rating requirements']
  },
  {
    id: 'bt-multifamily',
    condition_type: 'building_type',
    condition_id: 'multifamily',
    label: 'Multi-Family Residential',
    complexity_multiplier: 1.05,
    description: 'Residential apartment or condo building',
    compliance_notes: ['Phased occupancy coordination', 'Window wall system common', 'Resident noise sensitivity']
  },
  // Work Conditions
  {
    id: 'wc-new-construction',
    condition_type: 'work_condition',
    condition_id: 'new_construction',
    label: 'New Construction',
    difficulty_multiplier: 1.00,
    description: 'Greenfield or new building construction',
    compliance_notes: []
  },
  {
    id: 'wc-renovation',
    condition_type: 'work_condition',
    condition_id: 'renovation',
    label: 'Renovation',
    difficulty_multiplier: 1.15,
    description: 'Existing building renovation with demolition of existing glazing',
    compliance_notes: ['Existing condition survey required', 'Demolition and protection costs', 'Trade coordination critical']
  },
  {
    id: 'wc-occupied',
    condition_type: 'work_condition',
    condition_id: 'occupied_building',
    label: 'Occupied Building',
    difficulty_multiplier: 1.25,
    description: 'Work in occupied building requiring after-hours or staged work',
    compliance_notes: ['After-hours premium labor', 'Dust and debris protection', 'Noise mitigation plan', 'Enhanced staging requirements']
  },
  // Access Conditions
  {
    id: 'ac-ground',
    condition_type: 'access',
    condition_id: 'ground_level',
    label: 'Ground Level',
    access_multiplier: 1.00,
    description: 'Grade-level work with standard scaffolding or ladder access',
    compliance_notes: ['Standard fall protection']
  },
  {
    id: 'ac-low-rise',
    condition_type: 'access',
    condition_id: 'low_rise',
    label: 'Low-Rise (2–4 Stories)',
    access_multiplier: 1.10,
    description: 'Low-rise building with boom lifts or scaffolding',
    compliance_notes: ['Fall protection plan', 'Equipment permits if street staging']
  },
  {
    id: 'ac-mid-rise',
    condition_type: 'access',
    condition_id: 'mid_rise',
    label: 'Mid-Rise (5–10 Stories)',
    access_multiplier: 1.25,
    description: 'Mid-rise requiring mast climbers or swing stages',
    compliance_notes: ['Mast climber safety plan', 'High-wind monitoring protocol', 'Material hoist coordination']
  },
  {
    id: 'ac-high-rise',
    condition_type: 'access',
    condition_id: 'high_rise',
    label: 'High-Rise (11+ Stories)',
    access_multiplier: 1.40,
    description: 'High-rise requiring certified swing stages and crane assist',
    compliance_notes: ['Comprehensive safety plan', 'Building access integration', 'High-wind delay protocol']
  },
  {
    id: 'ac-swing-stage',
    condition_type: 'access',
    condition_id: 'swing_stage',
    label: 'Swing Stage Required',
    access_multiplier: 1.35,
    description: 'Certified suspended access platform required',
    compliance_notes: ['Certified riggers required', 'OSHA 29 CFR 1926.502', 'Rescue plan required', 'Weather monitoring']
  },
  {
    id: 'ac-crane',
    condition_type: 'access',
    condition_id: 'crane_required',
    label: 'Crane Required',
    access_multiplier: 1.30,
    description: 'Tower or mobile crane required for panel or glass lifts',
    compliance_notes: ['Lift plan and engineer stamp', 'Lane closure permits if applicable', 'Certified crane operator']
  }
];

export const getRegionById = (id: string): Region | undefined =>
  regions.find(r => r.id === id);

export const getConditionMultiplier = (
  condition_type: ProjectConditionMultiplier['condition_type'],
  condition_id: string
): ProjectConditionMultiplier | undefined =>
  projectConditionMultipliers.find(
    c => c.condition_type === condition_type && c.condition_id === condition_id
  );
