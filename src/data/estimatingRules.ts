// Estimating Rules and Calculation Logic
export interface EstimatingParameters {
  // Base costs
  materialCostPerSF: number;
  laborHoursPerSF: number;
  laborRatePerHour: number;
  
  // Multipliers
  regionalMultiplier: number;
  laborMultiplier: number;
  wageMultiplier: number;
  complexityMultiplier: number;
  accessMultiplier: number;
  difficultyMultiplier: number;
  
  // Markups and fees
  overhead: number; // percentage
  contingency: number; // percentage
  profit: number; // percentage
  tax: number; // percentage
  bond: number; // percentage if applicable
  
  // Project conditions
  totalSquareFeet: number;
  quantityComplexity: 'Simple' | 'Moderate' | 'Complex';
}

export interface CalculationResult {
  // Base costs
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  
  // Adjusted costs
  adjustedMaterialCost: number;
  adjustedLaborCost: number;
  adjustedEquipmentCost: number;
  
  // Subtotal
  directCost: number;
  
  // Markups
  overheadAmount: number;
  contingencyAmount: number;
  profitAmount: number;
  taxAmount: number;
  bondAmount: number;
  
  // Totals
  subtotal: number;
  totalCost: number;
  
  // Metrics
  effectiveCostPerSF: number;
  totalHours: number;
  
  // Market position
  marketPosition: 'Below Market' | 'Competitive' | 'Premium' | 'High Risk';
  marketPositionScore: number; // -100 to +100
}

export interface RiskFlag {
  id: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: 'Pricing' | 'Schedule' | 'Compliance' | 'Technical' | 'Market';
  message: string;
  recommendation: string;
}

export interface ConfidenceFactors {
  regionDefined: boolean;
  systemSelected: boolean;
  squareFootageEntered: boolean;
  glassTypeSelected: boolean;
  laborConditionsKnown: boolean;
  procurementComplete: boolean;
  accessConditionsDefined: boolean;
  projectTypeDefined: boolean;
  buildingTypeDefined: boolean;
}

export interface ConfidenceScore {
  level: 'High' | 'Medium' | 'Low';
  score: number; // 0-100
  factors: ConfidenceFactors;
  reasoning: string[];
}

// Base productivity rates (hours per SF)
export const baseProductivityRates = {
  'storefront': 0.15,
  'stick-built-curtain-wall': 0.35,
  'unitized-curtain-wall': 0.25,
  'window-wall': 0.20,
  'interior-partition': 0.12,
  'glass-railing': 0.40,
  'skylight': 0.45,
  'fire-rated': 0.50,
  'blast-security': 0.65
};

// Base material costs (per SF)
export const baseMaterialCosts = {
  'storefront': 25,
  'stick-built-curtain-wall': 45,
  'unitized-curtain-wall': 65,
  'window-wall': 35,
  'interior-partition': 20,
  'glass-railing': 55,
  'skylight': 70,
  'fire-rated': 80,
  'blast-security': 120
};

// Base labor rates (per hour)
export const baseLaborRates = {
  'dc': 75,
  'montgomery-county': 72,
  'prince-georges-county': 68,
  'baltimore': 65,
  'fairfax-county': 70,
  'arlington-alexandria': 74,
  'loudoun-prince-william': 66
};

// Standard markups
export const standardMarkups = {
  overhead: 0.15, // 15%
  contingency: 0.05, // 5%
  profit: 0.10, // 10%
  tax: 0.06, // 6%
  bond: 0.01 // 1%
};

// Risk flag rules
export const generateRiskFlags = (params: EstimatingParameters, result: CalculationResult): RiskFlag[] => {
  const flags: RiskFlag[] = [];
  
  // Contingency check
  if (params.contingency < 0.03) {
    flags.push({
      id: 'low-contingency',
      severity: 'High',
      category: 'Pricing',
      message: 'Contingency below recommended minimum (3%)',
      recommendation: 'Increase contingency to 3-5% for commercial projects'
    });
  }
  
  // Profit margin check
  if (params.profit < 0.08) {
    flags.push({
      id: 'low-profit',
      severity: 'Medium',
      category: 'Pricing',
      message: 'Profit margin below industry average (8%)',
      recommendation: 'Consider increasing profit margin to 8-12%'
    });
  }
  
  // Market position check
  if (result.marketPosition === 'Below Market') {
    flags.push({
      id: 'below-market',
      severity: 'High',
      category: 'Market',
      message: 'Pricing significantly below market benchmark',
      recommendation: 'Review calculations and consider increasing price to competitive levels'
    });
  }
  
  if (result.marketPosition === 'High Risk') {
    flags.push({
      id: 'over-market',
      severity: 'Medium',
      category: 'Market',
      message: 'Pricing above typical market range',
      recommendation: 'Justify premium pricing or adjust to be more competitive'
    });
  }
  
  // Prevailing wage check
  if (params.wageMultiplier > 1.2 && params.laborMultiplier < 1.3) {
    flags.push({
      id: 'prevailing-wage-understated',
      severity: 'High',
      category: 'Compliance',
      message: 'Prevailing wage requirements may be understated',
      recommendation: 'Verify Davis-Bacon or state prevailing wage requirements'
    });
  }
  
  // High-rise access check
  if (params.accessMultiplier > 1.3) {
    flags.push({
      id: 'high-rise-access',
      severity: 'Medium',
      category: 'Technical',
      message: 'High-rise access complexity requires specialized equipment',
      recommendation: 'Confirm equipment requirements and associated costs'
    });
  }
  
  // Renovation premium check
  if (params.difficultyMultiplier > 1.1 && params.contingency < 0.07) {
    flags.push({
      id: 'renovation-contingency',
      severity: 'Medium',
      category: 'Schedule',
      message: 'Renovation work requires higher contingency',
      recommendation: 'Increase contingency to 7-10% for renovation projects'
    });
  }
  
  // Quantity complexity check
  if (params.quantityComplexity === 'Simple' && params.totalSquareFeet > 5000) {
    flags.push({
      id: 'quantity-accuracy',
      severity: 'Low',
      category: 'Technical',
      message: 'Large project with simple quantity breakdown',
      recommendation: 'Consider detailed takeoff for improved accuracy'
    });
  }
  
  return flags;
};

// Confidence scoring
export const calculateConfidenceScore = (
  factors: ConfidenceFactors,
  params: EstimatingParameters
): ConfidenceScore => {
  let score = 0;
  const reasoning: string[] = [];
  
  // Base score for required fields
  if (factors.regionDefined) {
    score += 15;
    reasoning.push('Region selected');
  } else {
    reasoning.push('Region not selected');
  }
  
  if (factors.systemSelected) {
    score += 20;
    reasoning.push('Glazing system selected');
  } else {
    reasoning.push('Glazing system not selected');
  }
  
  if (factors.squareFootageEntered) {
    score += 15;
    reasoning.push('Square footage entered');
  } else {
    reasoning.push('Square footage missing');
  }
  
  if (factors.glassTypeSelected) {
    score += 10;
    reasoning.push('Glass type specified');
  } else {
    reasoning.push('Glass type defaulted');
  }
  
  if (factors.laborConditionsKnown) {
    score += 10;
    reasoning.push('Labor conditions defined');
  } else {
    reasoning.push('Labor hours estimated by rule');
  }
  
  if (factors.procurementComplete) {
    score += 10;
    reasoning.push('Procurement scope complete');
  } else {
    reasoning.push('Procurement scope incomplete');
  }
  
  if (factors.accessConditionsDefined) {
    score += 10;
    reasoning.push('Access conditions defined');
  } else {
    reasoning.push('Access conditions defaulted');
  }
  
  if (factors.projectTypeDefined) {
    score += 5;
    reasoning.push('Project type defined');
  } else {
    reasoning.push('Project type defaulted');
  }
  
  if (factors.buildingTypeDefined) {
    score += 5;
    reasoning.push('Building type defined');
  } else {
    reasoning.push('Building type defaulted');
  }
  
  // Determine confidence level
  let level: 'High' | 'Medium' | 'Low';
  if (score >= 80) {
    level = 'High';
  } else if (score >= 60) {
    level = 'Medium';
  } else {
    level = 'Low';
  }
  
  return {
    level,
    score,
    factors,
    reasoning
  };
};

// Market position calculation
export const calculateMarketPosition = (
  effectiveCostPerSF: number,
  benchmarkRange: { low: number; mid: number; high: number }
): { position: 'Below Market' | 'Competitive' | 'Premium' | 'High Risk'; score: number } => {
  const midPoint = benchmarkRange.mid;
  const range = benchmarkRange.high - benchmarkRange.low;
  const deviation = (effectiveCostPerSF - midPoint) / range;
  
  let position: 'Below Market' | 'Competitive' | 'Premium' | 'High Risk';
  let score: number;
  
  if (deviation < -0.3) {
    position = 'Below Market';
    score = -100 + (deviation + 0.3) * 200;
  } else if (deviation < 0.2) {
    position = 'Competitive';
    score = deviation * 100;
  } else if (deviation < 0.5) {
    position = 'Premium';
    score = 20 + (deviation - 0.2) * 200;
  } else {
    position = 'High Risk';
    score = 80 + (deviation - 0.5) * 100;
  }
  
  return { position, score: Math.max(-100, Math.min(100, score)) };
};
