# Procurement Intelligence Ingest

Drop raw procurement documents into the `raw/` subfolders, then run the ingest script.

## Folder Structure

```
raw/
  general/      ← fallback for any jurisdiction, or docs without clear location
  dc/           ← Washington D.C. projects
  maryland/     ← Maryland projects
  virginia/     ← Virginia / NoVA projects
  federal/      ← Federal GSA/DOD/VA/DoE projects
  university/   ← University/higher-education projects
```

**Jurisdiction fallback:** When querying for a specific region, the system first searches that region's folder. If no usable records are found, it falls back to `general/`.

## Supported File Types

| Extension         | Parser              |
|-------------------|---------------------|
| `.pdf`            | pdf-parse           |
| `.docx`           | mammoth             |
| `.xlsx` / `.xls`  | xlsx                |
| `.csv`            | built-in CSV parser |
| `.txt`            | plain read          |

## Document Types (auto-classified)

| Type                      | Classification signals                              |
|---------------------------|-----------------------------------------------------|
| `subcontractor_proposal`  | "proposal", "quote", "hereby submit", "scope of work" |
| `bid_tab`                 | "bid tab", "bid leveling", "bidder", column headers |
| `award_notice`            | "notice of award", "letter of award", "awarded to"  |
| `rfp_specification`       | "request for proposal", "specification", "division 08" |
| `glazing_scope_sheet`     | "glazing schedule", "glass schedule", "window schedule" |
| `pricing_backup`          | "unit price", "material list", "labor analysis"     |
| `manufacturer_reference`  | "product data", "submittal", "AAMA", "manufacturer" |

## Running the Ingest

```bash
# Install deps (first time only)
npm install

# Run full ingest
npm run ingest

# Re-process all files (ignore dedup hash cache)
npm run ingest -- --force

# Ingest only a specific jurisdiction
npm run ingest -- --jurisdiction dc

# Verbose logging
npm run ingest -- --verbose
```

## Output Files (`processed/`)

| File                      | Contents                                    |
|---------------------------|---------------------------------------------|
| `projectRecords.json`     | One record per project                      |
| `sourceDocuments.json`    | One record per ingested file                |
| `extractedScopeItems.json`| Scope inclusions + exclusions               |
| `pricingObservations.json`| Line items and $/SF observations            |
| `ingestionLog.json`       | Run history, errors, file counts            |

## Authority Levels

Records start as **`historical_scope_intelligence`**.

A record is upgraded to **`verified_pricing_authority`** only when ALL of the following are present:
1. Confirmed awarded value (not just proposed)
2. Confirmed quantity or measurable SF
3. Project location identified
4. Bid/award date present
5. Clear glazing scope (≥1 system identified)
6. Source is `award_notice`, `subcontract_exhibit`, or `purchase_order`

## Notes

- Files are deduplicated by SHA-256 hash — re-dropping the same file is safe.
- Raw files are never modified. Processed data lives only in `processed/`.
- The app reads `processed/` at runtime via the `/api/processed-intel` route.
