// ============================================================
// NARRATIVE ENGINE — Basis of Estimate Generator
// Deterministic. No AI. Reads a finished EstimatePacket and
// produces professional prose explaining every cost decision,
// citing the exact source records that back each number.
// ============================================================

import type {
  EstimatePacket, EstimateNarrative, NarrativeSection,
  NarrativeDataPoint, CitationRecord, LiveDataFactor,
  KnowledgeEntry,
} from '@/types';
import { sources } from '@/data/sources';
import { getRelevantKnowledge } from '@/data/knowledgeEntries';

// ── Citation builder ──────────────────────────────────────────

function buildCitation(sourceId: string, usageNote: string): CitationRecord | null {
  const src = sources.find(s => s.id === sourceId);
  if (!src) return null;
  return {
    id: src.id,
    title: src.title,
    publisher: src.publisher,
    url: src.url,
    date_published: src.date_published,
    source_type: src.source_type,
    usage_note: usageNote,
  };
}

function collectCitations(ids: string[], usageMap: Record<string, string>): CitationRecord[] {
  const seen = new Set<string>();
  const out: CitationRecord[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const c = buildCitation(id, usageMap[id] ?? 'Referenced in estimate');
    if (c) out.push(c);
  }
  return out;
}

// ── Section builders ──────────────────────────────────────────

function buildProjectOverviewSection(packet: EstimatePacket): NarrativeSection {
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const avgOpening = packet.num_openings > 0
    ? ` (average opening size: ${(packet.total_sf / packet.num_openings).toFixed(0)} SF)`
    : '';

  return {
    id: 'overview',
    heading: 'Project Scope Overview',
    body: `This estimate covers the supply and installation of ${packet.work_type_name} for a ${packet.building_type_label.toLowerCase()} project in ${packet.region_name}. The contract is structured as a ${packet.project_type_label} project under a ${packet.work_condition_label.toLowerCase()} scenario. Total glazed area is ${packet.total_sf.toLocaleString()} SF${avgOpening}, with ${packet.glass_type_name} specified for this application. Access conditions are classified as ${packet.access_condition_label.toLowerCase()}, which has been factored into the labor cost model. This is a ${packet.mode} estimate${packet.mode === 'Quick' ? ' — suitable for ROM budgeting and early-stage planning, not final bid submission' : ' — suitable for detailed budgeting and bid preparation'}.`,
    citation_ids: [],
    knowledge_entry_ids: [],
    data_points: [
      { label: 'System', value: packet.work_type_name, source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: 'Glass Type', value: packet.glass_type_name, source_id: 'src-nfrc-technical', is_live_data: false },
      { label: 'Total Area', value: `${packet.total_sf.toLocaleString()} SF`, source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: 'Contract Value', value: fmt(packet.result.grand_total), source_id: 'src-rsmeans-2024', is_live_data: false },
    ],
  };
}

function buildMaterialCostSection(
  packet: EstimatePacket,
  knowledge: KnowledgeEntry[],
  liveFactors: LiveDataFactor[]
): NarrativeSection {
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const matItem = packet.result.line_items.find(i => i.category === 'material');
  const matMuls = packet.result.multipliers_summary.filter(m =>
    m.name.includes('Material') || m.name.includes('Glass')
  );

  const matKnowledge = knowledge.filter(k => k.category === 'material_market');
  const marketKnowledge = knowledge.filter(k => k.category === 'market_intel');

  const escalationFactor = liveFactors.find(f => f.factor_type === 'material_escalation');
  const liveNote = escalationFactor
    ? ` BLS Producer Price Index data (as of ${escalationFactor.as_of_date}) indicates a current escalation factor of ${((escalationFactor.value - 1) * 100).toFixed(1)}% applied to the RSMeans 2024 material baseline.`
    : '';

  const mulText = matMuls.map(m => `${m.name} (×${m.value.toFixed(3)}, ${m.source})`).join('; ');

  const knowledgeText = [...matKnowledge, ...marketKnowledge].slice(0, 2)
    .map(k => k.body.split('.')[0] + '.')
    .join(' ');

  return {
    id: 'material_cost',
    heading: 'Material Cost Basis',
    body: `Material costs for ${packet.work_type_name} are based on RSMeans 2024 Commercial Cost Data for the ${packet.region_name} market. The base material cost per SF represents framing system, glass, hardware, sealants, and ancillary materials for a standard installation of this system type. Applied multipliers: ${mulText}.${liveNote} Total material cost is ${fmt(packet.result.total_material)} (${matItem?.per_sf?.toFixed(2) ?? '—'}/SF adjusted). ${knowledgeText}`,
    citation_ids: ['src-rsmeans-2024', 'src-nfrc-technical'],
    knowledge_entry_ids: [...matKnowledge, ...marketKnowledge].slice(0, 2).map(k => k.id),
    data_points: [
      { label: 'Total Material', value: fmt(packet.result.total_material), source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: '$/SF (Adjusted)', value: `$${matItem?.per_sf?.toFixed(2) ?? '—'}`, source_id: 'src-rsmeans-2024', is_live_data: false },
      ...(escalationFactor ? [{
        label: 'BLS PPI Escalation', value: `+${((escalationFactor.value - 1) * 100).toFixed(1)}%`,
        source_id: 'src-rsmeans-2024', is_live_data: true,
      }] : []),
    ],
  };
}

function buildLaborCostSection(
  packet: EstimatePacket,
  knowledge: KnowledgeEntry[],
  liveFactors: LiveDataFactor[]
): NarrativeSection {
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const laborItem = packet.result.line_items.find(i => i.category === 'labor');
  const wageFactor = liveFactors.find(f => f.factor_type === 'wage_rate');

  const laborMuls = packet.result.multipliers_summary.filter(m =>
    ['Wage/Prevailing', 'Building Complexity', 'Work Difficulty', 'Access', 'Regional Labor'].includes(m.name)
  );
  const mulText = laborMuls.map(m => `${m.name} (×${m.value.toFixed(3)})`).join(', ');

  const laborKnowledge = knowledge.filter(k => k.category === 'labor_market').slice(0, 1);
  const knowledgeText = laborKnowledge.length > 0
    ? ' ' + laborKnowledge[0].body.split('.').slice(0, 2).join('.') + '.'
    : '';

  const liveWageNote = wageFactor
    ? ` SAM.gov wage determination data (as of ${wageFactor.as_of_date}) confirms the applicable ${wageFactor.label} at $${wageFactor.value.toFixed(2)}/hour for this jurisdiction.`
    : '';

  const projectTypeNote = packet.project_type_label.toLowerCase().includes('davis') || packet.project_type_label.toLowerCase().includes('public')
    ? ` This is a ${packet.project_type_label} project; prevailing wage rates govern labor costs under applicable law.`
    : ' This is a private project; market wage rates apply.';

  return {
    id: 'labor_cost',
    heading: 'Labor Cost Basis',
    body: `Labor costs are calculated using productivity rates sourced from RSMeans 2024 and verified against DMV regional bid data. The base productivity rate for ${packet.work_type_name} is applied per square foot of glazed area, then adjusted for project-specific conditions. Multipliers applied: ${mulText}. Total estimated labor hours: ${Math.round(packet.result.total_labor_hours).toLocaleString()} hours. Total labor cost: ${fmt(packet.result.total_labor)} (${laborItem?.per_sf?.toFixed(2) ?? '—'}/SF).${projectTypeNote}${liveWageNote}${knowledgeText}`,
    citation_ids: ['src-rsmeans-2024', 'src-davis-bacon', 'src-cdc-dmv-bid-data-2023'],
    knowledge_entry_ids: laborKnowledge.map(k => k.id),
    data_points: [
      { label: 'Total Labor', value: fmt(packet.result.total_labor), source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: '$/SF (Adjusted)', value: `$${laborItem?.per_sf?.toFixed(2) ?? '—'}`, source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: 'Estimated Hours', value: Math.round(packet.result.total_labor_hours).toLocaleString(), source_id: 'src-rsmeans-2024', is_live_data: false },
      ...(wageFactor ? [{ label: 'SAM.gov Wage Rate', value: `$${wageFactor.value.toFixed(2)}/hr`, source_id: 'src-davis-bacon', is_live_data: true }] : []),
    ],
  };
}

function buildMarkupSection(packet: EstimatePacket): NarrativeSection {
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const contingencyItem = packet.result.line_items.find(i => i.label.startsWith('Contingency'));
  const profitItem = packet.result.line_items.find(i => i.label.startsWith('Profit'));
  const bondItem = packet.result.line_items.find(i => i.label.startsWith('Bond'));

  const bondNote = bondItem
    ? ` A performance and payment bond (${fmt(bondItem.adjusted_value)}) has been included per the contract requirements.`
    : ' No performance and payment bond has been included; add 1.0–1.5% of contract value if bonding is required.';

  return {
    id: 'markups',
    heading: 'Overhead, Contingency, and Profit',
    body: `Overhead is applied at 15% of direct cost, representing home office allocation, project management, insurance, and general conditions attributable to this scope. ${contingencyItem?.label ?? 'Contingency'} is applied at the entered rate, covering unforeseen field conditions, scope adjustments, and estimating uncertainty consistent with the ${packet.confidence.level.toLowerCase()} confidence level of this estimate (${packet.confidence.score}/100). ${profitItem?.label ?? 'Profit'} is applied to the sum of direct cost, overhead, and contingency. These markup levels are consistent with competitive commercial glazing subcontracting in the DMV market as reflected in bid data.${bondNote}`,
    citation_ids: ['src-cdc-dmv-bid-data-2023'],
    knowledge_entry_ids: [],
    data_points: [
      { label: 'Overhead (15%)', value: fmt(packet.result.total_overhead), source_id: 'src-cdc-dmv-bid-data-2023', is_live_data: false },
      { label: contingencyItem?.label ?? 'Contingency', value: fmt(packet.result.total_contingency), source_id: 'src-cdc-dmv-bid-data-2023', is_live_data: false },
      { label: profitItem?.label ?? 'Profit', value: fmt(packet.result.total_profit), source_id: 'src-cdc-dmv-bid-data-2023', is_live_data: false },
      ...(bondItem ? [{ label: 'Bond', value: fmt(bondItem.adjusted_value), source_id: 'src-cdc-dmv-bid-data-2023', is_live_data: false }] : []),
    ],
  };
}

function buildMarketPositionSection(packet: EstimatePacket, liveFactors: LiveDataFactor[]): NarrativeSection {
  const fmt = (n: number) => `$${n.toFixed(0)}`;
  const { market_position, effective_per_sf, benchmark_low, benchmark_mid, benchmark_high } = packet.result;

  const positionExplanations: Record<string, string> = {
    'Below Market': `At ${fmt(effective_per_sf)}/SF, this estimate falls below the published benchmark range of ${fmt(benchmark_low)}–${fmt(benchmark_high)}/SF. This may reflect favorable labor rates, efficient procurement strategy, or reduced scope assumptions. Verify that all required scope items are included before bidding at this level.`,
    'Competitive': `At ${fmt(effective_per_sf)}/SF, this estimate is within the competitive range for ${packet.work_type_name} in the ${packet.region_name} market (benchmark: ${fmt(benchmark_low)}–${fmt(benchmark_high)}/SF). This position reflects market-rate labor, standard procurement, and reasonable markup structure consistent with DMV bid data.`,
    'Premium': `At ${fmt(effective_per_sf)}/SF, this estimate is in the upper tier of the market benchmark range (${fmt(benchmark_low)}–${fmt(benchmark_high)}/SF). This is typical for projects with elevated conditions: prevailing wage, occupied building, high-rise access, or specialty glass requirements that all apply to this estimate configuration.`,
    'High Risk / Over Market': `At ${fmt(effective_per_sf)}/SF, this estimate exceeds the published high benchmark of ${fmt(benchmark_high)}/SF. While the applied multipliers individually are justifiable, their combined effect places this estimate above typical market pricing. Review each multiplier carefully. If the project conditions genuinely require all applied factors, this price may be defensible — but expect owner pushback and competitive risk.`,
  };

  const benchmarkNote = liveFactors.find(f => f.factor_type === 'benchmark_calibration')
    ? ' Note: USASpending.gov contract award data has been applied to validate this benchmark range against recent federal glazing contracts in this region.'
    : ' Benchmarks are sourced from RSMeans 2024 Commercial Cost Data and DMV regional bid data, representing the competitive installed cost range for this system type.';

  return {
    id: 'market_position',
    heading: 'Market Position Analysis',
    body: `${positionExplanations[market_position] ?? positionExplanations['Competitive']}${benchmarkNote}`,
    citation_ids: ['src-rsmeans-2024', 'src-cdc-dmv-bid-data-2023'],
    knowledge_entry_ids: [],
    data_points: [
      { label: 'This Estimate', value: `${fmt(effective_per_sf)}/SF`, source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: 'Benchmark Low', value: `${fmt(benchmark_low)}/SF`, source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: 'Benchmark Mid', value: `${fmt(benchmark_mid)}/SF`, source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: 'Benchmark High', value: `${fmt(benchmark_high)}/SF`, source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: 'Market Position', value: market_position, source_id: 'src-cdc-dmv-bid-data-2023', is_live_data: false },
    ],
  };
}

function buildRiskNarrativeSection(
  packet: EstimatePacket,
  knowledge: KnowledgeEntry[]
): NarrativeSection | null {
  if (packet.risk_flags.length === 0) return null;

  const criticalAndHigh = packet.risk_flags.filter(f => f.severity === 'Critical' || f.severity === 'High');
  const medium = packet.risk_flags.filter(f => f.severity === 'Medium');

  const riskKnowledge = knowledge.filter(k => k.category === 'risk_intel').slice(0, 2);

  const criticalText = criticalAndHigh.length > 0
    ? ` The following ${criticalAndHigh.length} high-severity risk(s) require attention before finalizing this estimate: ${criticalAndHigh.map(f => f.message).join('; ')}.`
    : '';

  const mediumText = medium.length > 0
    ? ` ${medium.length} medium-severity flag(s) have also been identified and should be reviewed: ${medium.map(f => f.message).join('; ')}.`
    : '';

  const knowledgeText = riskKnowledge.length > 0
    ? ' ' + riskKnowledge.map(k => k.body.split('.')[0] + '.').join(' ')
    : '';

  return {
    id: 'risk_narrative',
    heading: 'Risk Assessment',
    body: `This estimate carries ${packet.risk_flags.length} identified risk flag(s) across ${[...new Set(packet.risk_flags.map(f => f.category))].join(', ')} categories.${criticalText}${mediumText}${knowledgeText} These risks are derived from industry risk rules informed by DMV bid experience and RSMeans risk guidance. Each flag carries a specific recommendation that should be reviewed with the project team before final bid submission.`,
    citation_ids: ['src-cdc-dmv-bid-data-2023', 'src-rsmeans-2024'],
    knowledge_entry_ids: riskKnowledge.map(k => k.id),
    data_points: [
      { label: 'Total Flags', value: String(packet.risk_flags.length), source_id: 'src-cdc-dmv-bid-data-2023', is_live_data: false },
      { label: 'Critical/High', value: String(criticalAndHigh.length), source_id: 'src-cdc-dmv-bid-data-2023', is_live_data: false },
    ],
  };
}

function buildConfidenceSection(packet: EstimatePacket): NarrativeSection {
  const levelDescriptions: Record<string, string> = {
    'High': 'The estimate carries a high confidence rating, indicating that all primary input variables are well-defined, the project conditions are within normal parameters for this system type, and the pricing data is directly applicable to this scope without significant extrapolation.',
    'Medium': 'The estimate carries a medium confidence rating. One or more input variables introduce meaningful uncertainty — this may include a non-standard access condition, a less common work type, or limited regional pricing data. This estimate is suitable for budgeting and planning but should be refined with additional field data before final bid.',
    'Low': 'The estimate carries a low confidence rating. Multiple factors introduce significant uncertainty, including unusual project conditions, specialty requirements, or incomplete scope definition. Treat this as an order-of-magnitude budget figure only. A detailed takeoff and supplier quotes are required before bidding.',
  };

  return {
    id: 'confidence',
    heading: 'Confidence Assessment',
    body: `Confidence Score: ${packet.confidence.score}/100 — ${packet.confidence.level}. ${levelDescriptions[packet.confidence.level] ?? ''} ${packet.confidence.summary} Key confidence factors evaluated: ${packet.confidence.factors.map(f => `${f.label} (${f.satisfied ? 'satisfied' : 'not satisfied'})`).join('; ')}.`,
    citation_ids: ['src-rsmeans-2024'],
    knowledge_entry_ids: [],
    data_points: [
      { label: 'Confidence Score', value: `${packet.confidence.score}/100`, source_id: 'src-rsmeans-2024', is_live_data: false },
      { label: 'Confidence Level', value: packet.confidence.level, source_id: 'src-rsmeans-2024', is_live_data: false },
    ],
  };
}

function buildCodeAndComplianceSection(
  packet: EstimatePacket,
  knowledge: KnowledgeEntry[]
): NarrativeSection | null {
  const codeKnowledge = knowledge.filter(k => k.category === 'code_requirement');
  if (codeKnowledge.length === 0) return null;

  return {
    id: 'code_compliance',
    heading: 'Code & Compliance Considerations',
    body: codeKnowledge.map(k => k.body).join(' '),
    citation_ids: ['src-ibc-2021', 'src-davis-bacon'],
    knowledge_entry_ids: codeKnowledge.map(k => k.id),
    data_points: [],
  };
}

function buildSpecNotesSection(
  packet: EstimatePacket,
  knowledge: KnowledgeEntry[]
): NarrativeSection | null {
  const specKnowledge = knowledge.filter(k => k.category === 'spec_note');
  if (specKnowledge.length === 0) return null;

  return {
    id: 'spec_notes',
    heading: 'Specification Notes & Known Risks',
    body: `The following specification-level considerations are relevant to ${packet.work_type_name} projects of this type and should be verified against the project documents: ` +
      specKnowledge.map(k => `${k.title}: ${k.body.split('.')[0]}.`).join(' '),
    citation_ids: ['src-nfrc-technical', 'src-ibc-2021'],
    knowledge_entry_ids: specKnowledge.map(k => k.id),
    data_points: [],
  };
}

function buildLiveDataSection(liveFactors: LiveDataFactor[]): NarrativeSection | null {
  if (liveFactors.length === 0) return null;

  const factorLines = liveFactors.map(f =>
    `${f.label} (${f.source.toUpperCase().replace('_', '.')}): ${f.factor_type === 'material_escalation' ? `${((f.value - 1) * 100).toFixed(1)}% escalation applied` : `$${f.value.toFixed(2)}/hr`}, as of ${f.as_of_date}`
  ).join('; ');

  return {
    id: 'live_data',
    heading: 'Live Market Data Applied',
    body: `The following live market calibration factors from public APIs have been applied to this estimate on top of the RSMeans 2024 baseline: ${factorLines}. These factors keep the estimate current without overriding the verified benchmark authority of RSMeans pricing. All live data is cached and timestamped; re-run the estimate to refresh.`,
    citation_ids: [],
    knowledge_entry_ids: [],
    data_points: liveFactors.map(f => ({
      label: f.label,
      value: f.factor_type === 'material_escalation'
        ? `+${((f.value - 1) * 100).toFixed(1)}%`
        : `$${f.value.toFixed(2)}/hr`,
      source_id: 'src-rsmeans-2024',
      is_live_data: true,
    })),
  };
}

// ── Main export ───────────────────────────────────────────────

export function generateNarrative(
  packet: EstimatePacket,
  liveFactors: LiveDataFactor[] = []
): EstimateNarrative {
  const regionKey = packet.region_name.toLowerCase().includes('virginia') ? 'nova'
    : packet.region_name.toLowerCase().includes('maryland') ? 'maryland' : 'dc';

  const WORK_TYPE_NAME_TO_ID: Record<string, string> = {
    'Commercial Storefront': 'storefront',
    'Stick-Frame Curtain Wall': 'stick_curtain_wall',
    'Unitized Curtain Wall': 'unitized_curtain_wall',
    'Window Wall': 'window_wall',
    'Interior Glazed Partition': 'interior_partition',
    'Glass Railing System': 'glass_railing',
    'Skylight / Sloped Glazing': 'skylight',
    'Fire-Rated Glazing': 'fire_rated',
    'Blast / Security Glazing': 'blast_security',
  };

  const relevantKnowledge = getRelevantKnowledge(
    WORK_TYPE_NAME_TO_ID[packet.work_type_name] ?? packet.work_type_name,
    regionKey,
  );

  const sections: NarrativeSection[] = [
    buildProjectOverviewSection(packet),
    buildMaterialCostSection(packet, relevantKnowledge, liveFactors),
    buildLaborCostSection(packet, relevantKnowledge, liveFactors),
    buildMarkupSection(packet),
    buildMarketPositionSection(packet, liveFactors),
    buildConfidenceSection(packet),
  ];

  const riskSection = buildRiskNarrativeSection(packet, relevantKnowledge);
  if (riskSection) sections.push(riskSection);

  const codeSection = buildCodeAndComplianceSection(packet, relevantKnowledge);
  if (codeSection) sections.push(codeSection);

  const specSection = buildSpecNotesSection(packet, relevantKnowledge);
  if (specSection) sections.push(specSection);

  const liveSection = buildLiveDataSection(liveFactors);
  if (liveSection) sections.push(liveSection);

  // Collect all unique source IDs cited across all sections
  const allSourceIds = [...new Set(sections.flatMap(s => s.citation_ids))];
  const usageMap: Record<string, string> = {
    'src-rsmeans-2024': 'Base material costs, productivity rates, and benchmark pricing',
    'src-cdc-dmv-bid-data-2023': 'DMV regional bid validation and market position benchmarks',
    'src-nfrc-technical': 'Glass performance specifications and technical requirements',
    'src-davis-bacon': 'Prevailing wage rates and labor compliance requirements',
    'src-ibc-2021': 'Code compliance requirements and jurisdictional obligations',
  };
  const allCitations = collectCitations(allSourceIds, usageMap);

  return {
    title: `Basis of Estimate — ${packet.work_type_name}`,
    subtitle: `${packet.region_name} · ${packet.project_type_label} · ${packet.total_sf.toLocaleString()} SF`,
    generated_at: new Date().toISOString(),
    sections,
    all_citations: allCitations,
    live_data_applied: liveFactors.length > 0,
    live_data_note: liveFactors.length > 0
      ? `${liveFactors.length} live market factor(s) applied from BLS PPI and SAM.gov`
      : undefined,
  };
}
