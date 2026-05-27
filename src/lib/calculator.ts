// Core Estimating Calculator Engine
import { 
  EstimatingParameters, 
  CalculationResult, 
  ConfidenceFactors,
  ConfidenceScore,
  RiskFlag
} from '@/data/estimatingRules';
import { 
  baseProductivityRates, 
  baseMaterialCosts, 
  baseLaborRates, 
  standardMarkups,
  generateRiskFlags,
  calculateConfidenceScore,
  calculateMarketPosition
} from '@/data/estimatingRules';
import { GlazingSystem } from '@/data/glazingSystems';
import { Region } from '@/data/regions';
import { GlassType } from '@/data/glazingSystems';

export interface CalculatorInput {
  // System selection
  glazingSystem: GlazingSystem;
  glassType: GlassType;
  
  // Location and project conditions
  region: Region;
  projectType: string;
  buildingType: string;
  workCondition: string;
  accessCondition: string;
  
  // Quantities
  totalSquareFeet: number;
  numberOfOpenings: number;
  quantityComplexity: 'Simple' | 'Moderate' | 'Complex';
  
  // Custom inputs
  customLaborRate?: number;
  customContingency?: number;
  customProfit?: number;
  includeBond?: boolean;
  
  // Estimate mode
  estimateMode: 'Quick' | 'Detailed';
}

export interface CalculatorOutput {
  result: CalculationResult;
  confidence: ConfidenceScore;
  riskFlags: RiskFlag[];
  assumptions: string[];
  exclusions: string[];
  summary: {
    totalCost: number;
    effectiveCostPerSF: number;
    marketPosition: string;
    confidenceLevel: string;
    totalHours: number;
  };
}

export class GlazingEstimator {
  /**
   * Main calculation function - deterministic, no AI involvement
   */
  static calculate(input: CalculatorInput): CalculatorOutput {
    // Step 1: Build estimating parameters
    const params = this.buildParameters(input);
    
    // Step 2: Perform core calculation
    const result = this.performCalculation(params, input.glazingSystem);
    
    // Step 3: Calculate confidence score
    const confidence = this.calculateConfidence(input, params);
    
    // Step 4: Generate risk flags
    const riskFlags = generateRiskFlags(params, result);
    
    // Step 5: Generate assumptions and exclusions
    const assumptions = this.generateAssumptions(input, params);
    const exclusions = this.generateExclusions(input);
    
    return {
      result,
      confidence,
      riskFlags,
      assumptions,
      exclusions,
      summary: {
        totalCost: result.totalCost,
        effectiveCostPerSF: result.effectiveCostPerSF,
        marketPosition: result.marketPosition,
        confidenceLevel: confidence.level,
        totalHours: result.totalHours
      }
    };
  }
  
  /**
   * Build estimating parameters from input
   */
  private static buildParameters(input: CalculatorInput): EstimatingParameters {
    // Base rates
    const baseLaborRate = input.customLaborRate || baseLaborRates[input.region.id];
    const baseProductivity = baseProductivityRates[input.glazingSystem.id];
    const baseMaterialCost = baseMaterialCosts[input.glazingSystem.id];
    
    // Apply glass type multiplier
    const adjustedMaterialCost = baseMaterialCost * input.glassType.costMultiplier;
    
    // Get multipliers from data (these would be looked up from the data files)
    const regionalMultiplier = input.region.costMultiplier;
    const laborMultiplier = input.region.laborMultiplier;
    const wageMultiplier = this.getWageMultiplier(input.projectType);
    const complexityMultiplier = this.getComplexityMultiplier(input.buildingType);
    const accessMultiplier = this.getAccessMultiplier(input.accessCondition);
    const difficultyMultiplier = this.getDifficultyMultiplier(input.workCondition);
    
    return {
      materialCostPerSF: adjustedMaterialCost,
      laborHoursPerSF: baseProductivity,
      laborRatePerHour: baseLaborRate,
      
      regionalMultiplier,
      laborMultiplier,
      wageMultiplier,
      complexityMultiplier,
      accessMultiplier,
      difficultyMultiplier,
      
      overhead: standardMarkups.overhead,
      contingency: input.customContingency || standardMarkups.contingency,
      profit: input.customProfit || standardMarkups.profit,
      tax: standardMarkups.tax,
      bond: input.includeBond ? standardMarkups.bond : 0,
      
      totalSquareFeet: input.totalSquareFeet,
      quantityComplexity: input.quantityComplexity
    };
  }
  
  /**
   * Perform the deterministic calculation
   */
  private static performCalculation(
    params: EstimatingParameters, 
    system: GlazingSystem
  ): CalculationResult {
    // Base costs
    const materialCost = params.materialCostPerSF * params.totalSquareFeet;
    const laborHours = params.laborHoursPerSF * params.totalSquareFeet;
    const laborCost = laborHours * params.laborRatePerHour;
    
    // Equipment cost (estimated as % of labor)
    const equipmentCost = laborCost * 0.15; // 15% of labor cost
    
    // Apply multipliers
    const totalMultiplier = 
      params.regionalMultiplier * 
      params.laborMultiplier * 
      params.wageMultiplier * 
      params.complexityMultiplier * 
      params.accessMultiplier * 
      params.difficultyMultiplier;
    
    const adjustedMaterialCost = materialCost * params.regionalMultiplier;
    const adjustedLaborCost = laborCost * totalMultiplier;
    const adjustedEquipmentCost = equipmentCost * totalMultiplier;
    
    // Direct cost subtotal
    const directCost = adjustedMaterialCost + adjustedLaborCost + adjustedEquipmentCost;
    
    // Markups
    const overheadAmount = directCost * params.overhead;
    const contingencyAmount = directCost * params.contingency;
    const profitAmount = directCost * params.profit;
    const taxAmount = directCost * params.tax;
    const bondAmount = directCost * params.bond;
    
    // Totals
    const subtotal = directCost + overheadAmount + contingencyAmount + profitAmount;
    const totalCost = subtotal + taxAmount + bondAmount;
    
    // Metrics
    const effectiveCostPerSF = totalCost / params.totalSquareFeet;
    const totalHours = laborHours * totalMultiplier;
    
    // Market position
    const marketPositionData = calculateMarketPosition(effectiveCostPerSF, system.benchmarkRange);
    
    return {
      materialCost,
      laborCost,
      equipmentCost,
      adjustedMaterialCost,
      adjustedLaborCost,
      adjustedEquipmentCost,
      directCost,
      overheadAmount,
      contingencyAmount,
      profitAmount,
      taxAmount,
      bondAmount,
      subtotal,
      totalCost,
      effectiveCostPerSF,
      totalHours,
      marketPosition: marketPositionData.position,
      marketPositionScore: marketPositionData.score
    };
  }
  
  /**
   * Calculate confidence score
   */
  private static calculateConfidence(input: CalculatorInput, params: EstimatingParameters): ConfidenceScore {
    const factors: ConfidenceFactors = {
      regionDefined: !!input.region,
      systemSelected: !!input.glazingSystem,
      squareFootageEntered: input.totalSquareFeet > 0,
      glassTypeSelected: !!input.glassType,
      laborConditionsKnown: input.estimateMode === 'Detailed',
      procurementComplete: input.estimateMode === 'Detailed',
      accessConditionsDefined: !!input.accessCondition,
      projectTypeDefined: !!input.projectType,
      buildingTypeDefined: !!input.buildingType
    };
    
    return calculateConfidenceScore(factors, params);
  }
  
  /**
   * Generate list of assumptions
   */
  private static generateAssumptions(input: CalculatorInput, params: EstimatingParameters): string[] {
    const assumptions = [
      `Based on ${input.glazingSystem.name} system`,
      `Material costs based on ${input.glassType.name}`,
      `Labor rates: $${params.laborRatePerHour}/hour`,
      `Productivity: ${params.laborHoursPerSF} hours/SF`,
      `Regional conditions: ${input.region.name}`,
      `Work conditions: ${input.workCondition}`,
      `Access requirements: ${input.accessCondition}`,
      `Overhead: ${(params.overhead * 100).toFixed(1)}%`,
      `Contingency: ${(params.contingency * 100).toFixed(1)}%`,
      `Profit: ${(params.profit * 100).toFixed(1)}%`
    ];
    
    if (input.estimateMode === 'Quick') {
      assumptions.push('Quick estimate - detailed takeoff recommended for bid');
    }
    
    if (params.wageMultiplier > 1.2) {
      assumptions.push('Prevailing wage requirements applied');
    }
    
    return assumptions;
  }
  
  /**
   * Generate list of exclusions
   */
  private static generateExclusions(input: CalculatorInput): string[] {
    const exclusions = [
      'Design and engineering fees',
      'Permit fees',
      'Sales tax (if applicable to contract)',
      'Testing and inspection fees',
      'Shipping and freight costs',
      'Site utilities and temporary facilities',
      'General contractor overhead and profit',
      'Insurance and bonding costs',
      'Demolition and site preparation',
      'Connection to adjacent work'
    ];
    
    if (input.glazingSystem.id === 'skylight') {
      exclusions.push('Structural support and roof framing');
    }
    
    if (input.glazingSystem.id === 'curtain-wall') {
      exclusions.push('Structural steel backup and wind bracing');
    }
    
    return exclusions;
  }
  
  // Helper methods for multiplier lookups
  private static getWageMultiplier(projectType: string): number {
    const multipliers = {
      'private': 1.0,
      'federal-davis-bacon': 1.45,
      'maryland-public': 1.35,
      'virginia-public': 1.30
    };
    return multipliers[projectType as keyof typeof multipliers] || 1.0;
  }
  
  private static getComplexityMultiplier(buildingType: string): number {
    const multipliers = {
      'office': 1.0,
      'school': 1.15,
      'hospital': 1.25,
      'retail': 0.95,
      'government': 1.20,
      'data-center': 1.30,
      'multifamily': 1.05
    };
    return multipliers[buildingType as keyof typeof multipliers] || 1.0;
  }
  
  private static getAccessMultiplier(accessCondition: string): number {
    const multipliers = {
      'ground-level': 1.0,
      'low-rise': 1.10,
      'mid-rise': 1.25,
      'high-rise': 1.40,
      'swing-stage': 1.35,
      'crane-required': 1.30
    };
    return multipliers[accessCondition as keyof typeof multipliers] || 1.0;
  }
  
  private static getDifficultyMultiplier(workCondition: string): number {
    const multipliers = {
      'new-construction': 1.0,
      'renovation': 1.15,
      'occupied-building': 1.25
    };
    return multipliers[workCondition as keyof typeof multipliers] || 1.0;
  }
}
