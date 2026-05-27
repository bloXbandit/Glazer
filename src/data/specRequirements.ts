// ============================================================
// SPEC REQUIREMENTS - CSI Division 08 requirements per system
// Source: code_compliance and scope_definition sources ONLY.
// Zero price authority. Informs scope, risk flags, assumptions.
// ============================================================

import type { SpecRequirement } from '@/types';

export const specRequirements: SpecRequirement[] = [
  // STOREFRONT
  { id: 'spec-sf-01', work_type_id: 'storefront', csi_section: '08 41 13', requirement: 'Aluminum storefronts shall be thermally broken per AAMA 410', requirement_type: 'mandatory', source_id: 'src-csi-div08-2024' },
  { id: 'spec-sf-02', work_type_id: 'storefront', csi_section: '08 41 13', requirement: 'Air infiltration ≤ 0.06 CFM/SF at 1.57 PSF (ASTM E283)', requirement_type: 'mandatory', source_id: 'src-csi-div08-2024' },
  { id: 'spec-sf-03', work_type_id: 'storefront', csi_section: '08 41 13', requirement: 'Glass in hazardous locations shall be safety glazing per IBC 2407', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },
  { id: 'spec-sf-04', work_type_id: 'storefront', csi_section: '08 41 13', requirement: 'Sill flashing and sealant system by glazing contractor', requirement_type: 'conditional', condition: 'Required when wall type is masonry or EIFS', source_id: 'src-csi-div08-2024' },

  // STICK-BUILT CURTAIN WALL
  { id: 'spec-scw-01', work_type_id: 'stick_curtain_wall', csi_section: '08 44 13', requirement: 'Delegated design by licensed PE for wind loads and anchorage', requirement_type: 'mandatory', source_id: 'src-csi-div08-2024' },
  { id: 'spec-scw-02', work_type_id: 'stick_curtain_wall', csi_section: '08 44 13', requirement: 'AAMA 501.2 field water test on minimum 10% of assemblies', requirement_type: 'mandatory', source_id: 'src-csi-div08-2024' },
  { id: 'spec-scw-03', work_type_id: 'stick_curtain_wall', csi_section: '08 44 13', requirement: 'Mock-up panel required prior to fabrication', requirement_type: 'conditional', condition: 'When specified by architect or when contract value exceeds $500,000', source_id: 'src-csi-div08-2024' },
  { id: 'spec-scw-04', work_type_id: 'stick_curtain_wall', csi_section: '08 44 13', requirement: 'Thermal break required for compliance with ASHRAE 90.1', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },
  { id: 'spec-scw-05', work_type_id: 'stick_curtain_wall', csi_section: '08 44 13', requirement: 'Structural silicone glazing: SSG must be tested per ASTM C1249', requirement_type: 'conditional', condition: 'When structural silicone glazing is used', source_id: 'src-gana-2023' },

  // UNITIZED CURTAIN WALL
  { id: 'spec-ucw-01', work_type_id: 'unitized_curtain_wall', csi_section: '08 44 23', requirement: 'Factory test each panel type per AAMA 501.1', requirement_type: 'mandatory', source_id: 'src-csi-div08-2024' },
  { id: 'spec-ucw-02', work_type_id: 'unitized_curtain_wall', csi_section: '08 44 23', requirement: 'Delegated structural design by PE stamped drawings', requirement_type: 'mandatory', source_id: 'src-csi-div08-2024' },
  { id: 'spec-ucw-03', work_type_id: 'unitized_curtain_wall', csi_section: '08 44 23', requirement: 'Stack joint and shear block system for seismic and thermal movement', requirement_type: 'mandatory', source_id: 'src-csi-div08-2024' },

  // WINDOW WALL
  { id: 'spec-ww-01', work_type_id: 'window_wall', csi_section: '08 51 13', requirement: 'Slab edge covers and spandrel glass by glazing contractor unless noted otherwise', requirement_type: 'conditional', condition: 'Confirm contract documents for slab edge scope', source_id: 'src-csi-div08-2024' },
  { id: 'spec-ww-02', work_type_id: 'window_wall', csi_section: '08 51 13', requirement: 'Fire stop at slab edge per IBC 714 and firestop system listing', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },

  // INTERIOR PARTITION
  { id: 'spec-ip-01', work_type_id: 'interior_partition', csi_section: '08 81 00', requirement: 'All glass in partitions exceeding 18" wide shall be tempered or laminated', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },
  { id: 'spec-ip-02', work_type_id: 'interior_partition', csi_section: '08 81 00', requirement: 'Acoustic glass partitions: verify STC rating in project specs', requirement_type: 'conditional', condition: 'When acoustic isolation is required', source_id: 'src-csi-div08-2024' },

  // GLASS RAILING
  { id: 'spec-gr-01', work_type_id: 'glass_railing', csi_section: '08 71 00', requirement: 'Glass must be tempered or laminated per IBC 2407.1', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },
  { id: 'spec-gr-02', work_type_id: 'glass_railing', csi_section: '08 71 00', requirement: 'Point-fixed glass railing requires PE-stamped engineering analysis', requirement_type: 'conditional', condition: 'When no continuous top cap or shoe channel', source_id: 'src-ibc-2021' },
  { id: 'spec-gr-03', work_type_id: 'glass_railing', csi_section: '08 71 00', requirement: 'Guardrail height minimum 42" at walking surfaces per IBC 1015', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },

  // SKYLIGHT
  { id: 'spec-sky-01', work_type_id: 'skylight', csi_section: '08 85 00', requirement: 'Overhead glazing must be laminated safety glass per IBC 2404.2', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },
  { id: 'spec-sky-02', work_type_id: 'skylight', csi_section: '08 85 00', requirement: 'Drainage design and overflow provisions required', requirement_type: 'mandatory', source_id: 'src-gana-2023' },
  { id: 'spec-sky-03', work_type_id: 'skylight', csi_section: '08 85 00', requirement: 'Structural framing by glazing contractor only if delegated design is included in scope', requirement_type: 'conditional', condition: 'Confirm structural framing scope in contract documents', source_id: 'src-csi-div08-2024' },

  // FIRE-RATED GLAZING
  { id: 'spec-fr-01', work_type_id: 'fire_rated', csi_section: '08 33 00', requirement: 'All fire-rated assemblies must be UL-listed and installed per listing', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },
  { id: 'spec-fr-02', work_type_id: 'fire_rated', csi_section: '08 33 00', requirement: 'Frame and glass must be from the same UL design number — no mixing', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },
  { id: 'spec-fr-03', work_type_id: 'fire_rated', csi_section: '08 33 00', requirement: 'Fire-rated door hardware must be included in glazing scope if door is part of assembly', requirement_type: 'conditional', condition: 'When fire-rated door is included in glazing scope', source_id: 'src-csi-div08-2024' },

  // BLAST / SECURITY
  { id: 'spec-bs-01', work_type_id: 'blast_security', csi_section: '08 44 13', requirement: 'Blast design must reference threat level per GSA Security Design Manual or UFC 4-010-01', requirement_type: 'mandatory', source_id: 'src-ibc-2021' },
  { id: 'spec-bs-02', work_type_id: 'blast_security', csi_section: '08 44 13', requirement: 'Delegated structural PE must design anchorage for blast load vectors', requirement_type: 'mandatory', source_id: 'src-csi-div08-2024' },
  { id: 'spec-bs-03', work_type_id: 'blast_security', csi_section: '08 44 13', requirement: 'Pre-qualification of glazing subcontractor may be required for federal projects', requirement_type: 'conditional', condition: 'When project is federal or high-security classification', source_id: 'src-csi-div08-2024' }
];

export const getSpecsForWorkType = (work_type_id: string): SpecRequirement[] =>
  specRequirements.filter(s => s.work_type_id === work_type_id);
