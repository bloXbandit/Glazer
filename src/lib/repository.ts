// ============================================================
// REPOSITORY - Mock In-Memory Implementation
// Implements IDataRepository interface from /types/index.ts
// SWAP POINT: Replace this file's internals with a real DB client
// (Prisma/SQLite, Drizzle/PostgreSQL) when persistence is needed.
// The consuming code (engines, UI) never touches raw data arrays.
// ============================================================

import type { IDataRepository, WorkType, GlassType, Region, LaborRate, LaborProductivity, PricingBenchmark, ProjectConditionMultiplier, ProcurementItem, ManufacturerSystem, SpecRequirement, RiskRule, SourceRecord } from '@/types';

import { workTypes } from '@/data/workTypes';
import { glassTypes } from '@/data/glassTypes';
import { regions, projectConditionMultipliers } from '@/data/regions';
import { laborRates, laborProductivity } from '@/data/laborFactors';
import { pricingBenchmarks, getBenchmark } from '@/data/pricingBenchmarks';
import { procurementItems } from '@/data/procurementItems';
import { manufacturerSystems } from '@/data/manufacturerSystems';
import { specRequirements } from '@/data/specRequirements';
import { riskRules } from '@/data/riskRules';
import { sources } from '@/data/sources';

class MockDataRepository implements IDataRepository {
  async getWorkTypes(): Promise<WorkType[]> {
    return workTypes;
  }

  async getWorkTypeById(id: string): Promise<WorkType | null> {
    return workTypes.find(wt => wt.id === id) ?? null;
  }

  async getGlassTypes(): Promise<GlassType[]> {
    return glassTypes;
  }

  async getRegions(): Promise<Region[]> {
    return regions;
  }

  async getRegionById(id: string): Promise<Region | null> {
    return regions.find(r => r.id === id) ?? null;
  }

  async getLaborRates(): Promise<LaborRate[]> {
    return laborRates;
  }

  async getLaborProductivity(): Promise<LaborProductivity[]> {
    return laborProductivity;
  }

  async getPricingBenchmarks(work_type_id: string, region_id: string): Promise<PricingBenchmark[]> {
    const specific = pricingBenchmarks.filter(
      b => b.work_type_id === work_type_id && b.region_id === region_id
    );
    if (specific.length > 0) return specific;
    return pricingBenchmarks.filter(
      b => b.work_type_id === work_type_id && b.region_id === 'national'
    );
  }

  async getProjectConditionMultipliers(): Promise<ProjectConditionMultiplier[]> {
    return projectConditionMultipliers;
  }

  async getProcurementItems(work_type_id: string): Promise<ProcurementItem[]> {
    return procurementItems.filter(
      p => p.applicable_work_types.length === 0 || p.applicable_work_types.includes(work_type_id)
    );
  }

  async getManufacturerSystems(work_type_id: string): Promise<ManufacturerSystem[]> {
    return manufacturerSystems.filter(m => m.work_type_id === work_type_id);
  }

  async getSpecRequirements(work_type_id: string): Promise<SpecRequirement[]> {
    return specRequirements.filter(s => s.work_type_id === work_type_id);
  }

  async getRiskRules(): Promise<RiskRule[]> {
    return riskRules;
  }

  async getSourceById(id: string): Promise<SourceRecord | null> {
    return sources.find(s => s.id === id) ?? null;
  }

  async getSources(): Promise<SourceRecord[]> {
    return sources;
  }
}

// Singleton export — swap this instance for a DB-backed implementation later
export const repository: IDataRepository = new MockDataRepository();

// Convenience synchronous helpers for engine use (mock only — not available in DB impl)
export const syncRepo = {
  getWorkTypeById: (id: string): WorkType | null =>
    workTypes.find(wt => wt.id === id) ?? null,

  getRegionById: (id: string): Region | null =>
    regions.find(r => r.id === id) ?? null,

  getGlassTypeById: (id: string): GlassType | null =>
    glassTypes.find(g => g.id === id) ?? null,

  getLaborRateForRegion: (region_id: string): LaborRate | null =>
    laborRates.find(r => r.region_id === region_id) ?? null,

  getLaborProductivityForWorkType: (work_type_id: string): LaborProductivity | null =>
    laborProductivity.find(lp => lp.work_type_id === work_type_id) ?? null,

  getBenchmark: (work_type_id: string, region_id: string): PricingBenchmark | null =>
    getBenchmark(work_type_id, region_id) ?? null,

  getConditionMultiplier: (
    condition_type: ProjectConditionMultiplier['condition_type'],
    condition_id: string
  ): ProjectConditionMultiplier | null =>
    projectConditionMultipliers.find(
      c => c.condition_type === condition_type && c.condition_id === condition_id
    ) ?? null,

  getAllRiskRules: (): RiskRule[] => riskRules,

  getWorkTypes: (): WorkType[] => workTypes,
  getGlassTypes: (): GlassType[] => glassTypes,
  getRegions: (): Region[] => regions,
  getProjectConditionMultipliers: (): ProjectConditionMultiplier[] => projectConditionMultipliers,
  getManufacturerSystemsByWorkType: (work_type_id: string): ManufacturerSystem[] =>
    manufacturerSystems.filter(m => m.work_type_id === work_type_id),
};
