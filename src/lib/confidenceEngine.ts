// ============================================================
// CONFIDENCE ENGINE
// Deterministic scoring — no LLM involvement.
// Scores inputs for completeness and assigns High/Medium/Low.
// ============================================================

import type { ConfidenceInput, ConfidenceReport, ConfidenceFactor, ConfidenceLevel } from '@/types';

export function calculateConfidence(input: ConfidenceInput): ConfidenceReport {
  const factors: ConfidenceFactor[] = [
    {
      label: 'Region Selected',
      satisfied: !!input.region_id,
      weight: 15,
      note: input.region_id ? 'Regional cost and labor multipliers applied' : 'No region selected — national averages used'
    },
    {
      label: 'Glazing System Selected',
      satisfied: !!input.work_type_id,
      weight: 20,
      note: input.work_type_id ? 'System-specific productivity and material rates applied' : 'System not selected — cannot generate defensible estimate'
    },
    {
      label: 'Square Footage Entered',
      satisfied: input.total_sf > 0,
      weight: 15,
      note: input.total_sf > 0 ? `${input.total_sf.toLocaleString()} SF entered` : 'No square footage provided'
    },
    {
      label: 'Glass Type Specified',
      satisfied: !!input.glass_type_id && input.glass_type_id !== 'standard_clear_igs',
      weight: 10,
      note: input.glass_type_id && input.glass_type_id !== 'standard_clear_igs'
        ? 'Glass type selected — material multiplier applied'
        : 'Glass type defaulted to standard clear IGU'
    },
    {
      label: 'Project Type Defined',
      satisfied: !!input.project_type,
      weight: 8,
      note: input.project_type ? 'Wage requirements identified' : 'Project type not selected — prevailing wage defaulted to private'
    },
    {
      label: 'Building Type Defined',
      satisfied: !!input.building_type,
      weight: 7,
      note: input.building_type ? 'Building complexity multiplier applied' : 'Building type defaulted to office'
    },
    {
      label: 'Work Condition Defined',
      satisfied: !!input.work_condition,
      weight: 8,
      note: input.work_condition ? 'Work condition difficulty applied' : 'Work condition defaulted to new construction'
    },
    {
      label: 'Access Condition Defined',
      satisfied: !!input.access_condition,
      weight: 8,
      note: input.access_condition ? 'Access difficulty multiplier applied' : 'Access defaulted to ground level'
    },
    {
      label: 'Detailed Mode',
      satisfied: input.mode === 'Detailed',
      weight: 5,
      note: input.mode === 'Detailed' ? 'Detailed estimate mode — higher defensibility' : 'Quick estimate — use for ROM only, not final bid'
    },
    {
      label: 'Opening Count Provided',
      satisfied: input.num_openings > 0,
      weight: 4,
      note: input.num_openings > 0 ? `${input.num_openings} openings entered` : 'Opening count not entered — unit-count accuracy unavailable'
    },
  ];

  // Special requirements reduce confidence if not explicitly addressed
  if (input.has_fire_rating) {
    factors.push({
      label: 'Fire Rating Requirement Flagged',
      satisfied: true,
      weight: 0,
      note: 'Fire-rated system selected — verify UL assembly and hourly rating in scope'
    });
  }

  if (input.has_blast_security) {
    factors.push({
      label: 'Blast/Security Requirement Flagged',
      satisfied: false,
      weight: 0,
      note: 'Blast/security glazing requires threat level spec and delegated engineering — confidence reduced without those inputs'
    });
  }

  // Compute score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const earnedWeight = factors.reduce((sum, f) => sum + (f.satisfied ? f.weight : 0), 0);
  const rawScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Penalty for blast without full inputs
  const score = input.has_blast_security ? Math.max(0, rawScore - 10) : rawScore;

  let level: ConfidenceLevel;
  let summary: string;

  if (score >= 80) {
    level = 'High';
    summary = 'Estimate has sufficient inputs for a defensible commercial bid. Verify assumptions before submission.';
  } else if (score >= 55) {
    level = 'Medium';
    summary = 'Estimate is a reasonable ROM (rough order of magnitude). Some inputs were defaulted — refine before using as a final bid.';
  } else {
    level = 'Low';
    summary = 'Estimate lacks critical inputs. Use for budget planning only. Do not submit as a bid without completing all required fields.';
  }

  return { level, score, factors, summary };
}
