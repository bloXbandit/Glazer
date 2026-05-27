// Commercial Glazing Systems Data - DMV Market
export interface GlazingSystem {
  id: string;
  name: string;
  description: string;
  useCase: string;
  benchmarkRange: {
    low: number;
    mid: number;
    high: number;
  };
  difficultyRating: 'Low' | 'Medium' | 'High' | 'Very High';
  procurementRisk: 'Low' | 'Medium' | 'High' | 'Very High';
  csiDivision: string;
  typicalLeadTime: string;
}

export const glazingSystems: GlazingSystem[] = [
  {
    id: 'storefront',
    name: 'Commercial Storefront',
    description: 'Ground-level commercial entrance systems with framing and glass',
    useCase: 'Retail stores, office entrances, restaurants, commercial buildings',
    benchmarkRange: { low: 45, mid: 65, high: 85 },
    difficultyRating: 'Low',
    procurementRisk: 'Low',
    csiDivision: '08 41 00',
    typicalLeadTime: '4-6 weeks'
  },
  {
    id: 'stick-built-curtain-wall',
    name: 'Stick-Built Curtain Wall',
    description: 'Custom curtain wall assembled piece-by-piece on site',
    useCase: 'Mid-rise office buildings, institutional buildings, custom facades',
    benchmarkRange: { low: 85, mid: 120, high: 165 },
    difficultyRating: 'Medium',
    procurementRisk: 'Medium',
    csiDivision: '08 44 00',
    typicalLeadTime: '8-12 weeks'
  },
  {
    id: 'unitized-curtain-wall',
    name: 'Unitized Curtain Wall',
    description: 'Prefabricated curtain wall panels assembled in factory',
    useCase: 'High-rise towers, large commercial projects, fast-track construction',
    benchmarkRange: { low: 120, mid: 160, high: 220 },
    difficultyRating: 'High',
    procurementRisk: 'High',
    csiDivision: '08 44 00',
    typicalLeadTime: '12-16 weeks'
  },
  {
    id: 'window-wall',
    name: 'Window Wall',
    description: 'Floor-to-ceiling window system with slab edge covers',
    useCase: 'Multi-family residential, mixed-use buildings, hotels',
    benchmarkRange: { low: 65, mid: 95, high: 130 },
    difficultyRating: 'Medium',
    procurementRisk: 'Medium',
    csiDivision: '08 51 00',
    typicalLeadTime: '6-10 weeks'
  },
  {
    id: 'interior-partition',
    name: 'Interior Glass Partition',
    description: 'Non-structural interior glass walls and dividers',
    useCase: 'Office interiors, conference rooms, lobby dividers, medical facilities',
    benchmarkRange: { low: 35, mid: 55, high: 75 },
    difficultyRating: 'Low',
    procurementRisk: 'Low',
    csiDivision: '08 81 00',
    typicalLeadTime: '3-5 weeks'
  },
  {
    id: 'glass-railing',
    name: 'Glass Railing / Balustrade',
    description: 'Frameless or framed glass guardrail systems',
    useCase: 'Balconies, atriums, stairways, terraces, deck railings',
    benchmarkRange: { low: 95, mid: 140, high: 195 },
    difficultyRating: 'Medium',
    procurementRisk: 'Medium',
    csiDivision: '08 71 00',
    typicalLeadTime: '6-8 weeks'
  },
  {
    id: 'skylight',
    name: 'Skylight / Overhead Glazing',
    description: 'Roof-mounted glass systems and atrium glazing',
    useCase: 'Atriums, retail skylights, canopies, overhead glass structures',
    benchmarkRange: { low: 110, mid: 155, high: 210 },
    difficultyRating: 'High',
    procurementRisk: 'High',
    csiDivision: '08 85 00',
    typicalLeadTime: '10-14 weeks'
  },
  {
    id: 'fire-rated',
    name: 'Fire-Rated Glazing',
    description: 'Fire-rated glass and framing systems with hourly ratings',
    useCase: 'Fire barriers, stair enclosures, exit corridors, protected openings',
    benchmarkRange: { low: 125, mid: 180, high: 250 },
    difficultyRating: 'High',
    procurementRisk: 'High',
    csiDivision: '08 33 00',
    typicalLeadTime: '8-12 weeks'
  },
  {
    id: 'blast-security',
    name: 'Blast / Security Glazing',
    description: 'Ballistic, blast-resistant, and high-security glazing systems',
    useCase: 'Government buildings, embassies, data centers, high-security facilities',
    benchmarkRange: { low: 185, mid: 275, high: 385 },
    difficultyRating: 'Very High',
    procurementRisk: 'Very High',
    csiDivision: '08 44 13',
    typicalLeadTime: '14-20 weeks'
  }
];

export interface GlassType {
  id: string;
  name: string;
  description: string;
  costMultiplier: number;
  leadTimeImpact: string;
}

export const glassTypes: GlassType[] = [
  {
    id: 'standard-clear',
    name: 'Standard Clear Float Glass',
    description: 'Basic clear annealed glass',
    costMultiplier: 1.0,
    leadTimeImpact: 'Standard'
  },
  {
    id: 'low-e',
    name: 'Low-E Insulated Glass',
    description: 'Energy-efficient double-pane with Low-E coating',
    costMultiplier: 1.25,
    leadTimeImpact: '+2 weeks'
  },
  {
    id: 'tempered',
    name: 'Tempered Safety Glass',
    description: 'Heat-strengthened safety glass',
    costMultiplier: 1.15,
    leadTimeImpact: '+1 week'
  },
  {
    id: 'laminated',
    name: 'Laminated Glass',
    description: 'Interlayered glass for safety and security',
    costMultiplier: 1.35,
    leadTimeImpact: '+2 weeks'
  },
  {
    id: 'tinted',
    name: 'Tinted/Reflective Glass',
    description: 'Solar control tinted or reflective glass',
    costMultiplier: 1.20,
    leadTimeImpact: '+1 week'
  },
  {
    id: 'performance-coated',
    name: 'Performance Coated',
    description: 'High-performance solar control coatings',
    costMultiplier: 1.40,
    leadTimeImpact: '+3 weeks'
  }
];
