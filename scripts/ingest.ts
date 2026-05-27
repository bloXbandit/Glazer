// ============================================================
// INGEST CLI
// Usage:
//   npm run ingest
//   npm run ingest -- --force
//   npm run ingest -- --jurisdiction dc
//   npm run ingest -- --verbose
//   npm run ingest -- --force --verbose --jurisdiction maryland
// ============================================================

import { runIngestPipeline } from '../src/lib/ingestPipeline';
import type { IngestOptions } from '../src/lib/ingestPipeline';

// ── Parse CLI args ─────────────────────────────────────────────

const args = process.argv.slice(2);

const force       = args.includes('--force');
const verbose     = args.includes('--verbose');
const jurisIdx    = args.indexOf('--jurisdiction');
const jurisdiction = jurisIdx !== -1 ? args[jurisIdx + 1] : undefined;
const dryRun      = args.includes('--dry-run');

// ── Color helpers ──────────────────────────────────────────────

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
  gray:   '\x1b[90m',
};

function clr(color: keyof typeof c, text: string): string {
  return `${c[color]}${text}${c.reset}`;
}

// ── Logger ─────────────────────────────────────────────────────

function log(msg: string) {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`${clr('gray', ts)}  ${msg}`);
}

// ── Banner ──────────────────────────────────────────────────────

function printBanner() {
  console.log('');
  console.log(clr('bold', '  ╔════════════════════════════════════════════╗'));
  console.log(clr('bold', '  ║  GlazePro Procurement Intelligence Ingest  ║'));
  console.log(clr('bold', '  ╚════════════════════════════════════════════╝'));
  console.log('');

  if (force)        log(clr('yellow', '⚠  --force: bypassing dedup hash cache'));
  if (dryRun)       log(clr('yellow', '⚠  --dry-run: no files will be written'));
  if (jurisdiction) log(clr('cyan',   `◎  Jurisdiction filter: ${jurisdiction}`));
  if (verbose)      log(clr('dim',    '   Verbose logging enabled'));
  console.log('');
}

// ── Print summary table ────────────────────────────────────────

function printSummary(run: Awaited<ReturnType<typeof runIngestPipeline>>) {
  console.log('');
  console.log(clr('bold', '  Run Summary'));
  console.log(clr('dim',  '  ─────────────────────────────────────────────'));

  const rows: Array<[string, string | number, string?]> = [
    ['Files scanned',            run.files_scanned],
    ['Files processed',          clr('green', String(run.files_processed))],
    ['Skipped (already seen)',   clr('dim',   String(run.files_skipped_dedup))],
    ['Skipped (unsupported)',    clr('dim',   String(run.files_skipped_unsupported))],
    ['Errors',                   run.files_errored > 0
      ? clr('red', String(run.files_errored))
      : clr('dim', '0')],
    ['New project records',      clr('green', String(run.new_project_records))],
    ['Updated project records',  String(run.updated_project_records)],
    ['New scope items',          String(run.new_scope_items)],
    ['New pricing observations', String(run.new_pricing_observations)],
    ['Authority upgrades',       run.verified_authority_upgrades > 0
      ? clr('cyan', `${run.verified_authority_upgrades} → verified_pricing_authority`)
      : clr('dim', '0')],
  ];

  for (const [label, value] of rows) {
    console.log(`  ${clr('dim', label.padEnd(30, ' '))}  ${value}`);
  }

  const durationMs = new Date(run.completed_at).getTime() - new Date(run.started_at).getTime();
  console.log('');
  console.log(`  ${clr('dim', 'Duration')}  ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`  ${clr('dim', 'Run ID')}    ${run.run_id}`);

  if (run.errors.length > 0) {
    console.log('');
    console.log(clr('red', `  ✗ ${run.errors.length} error(s):`));
    for (const e of run.errors.slice(0, 10)) {
      console.log(`  ${clr('dim', '→')} ${clr('dim', e.file)}: ${clr('red', e.error)}`);
    }
    if (run.errors.length > 10) {
      console.log(clr('dim', `  … and ${run.errors.length - 10} more. See ingestionLog.json.`));
    }
  }

  if (run.warnings.length > 0) {
    console.log('');
    console.log(clr('yellow', `  ⚠  ${run.warnings.length} warning(s):`));
    for (const w of run.warnings.slice(0, 5)) {
      console.log(`  ${clr('dim', '→')} ${clr('dim', w.file)}: ${clr('yellow', w.warning)}`);
    }
  }

  console.log('');

  if (run.files_processed === 0 && run.files_scanned > 0) {
    console.log(clr('yellow', '  ⚠  No new files processed. All files may already be indexed.'));
    console.log(clr('dim', '     Use --force to re-process everything.'));
  } else if (run.files_scanned === 0) {
    console.log(clr('yellow', '  ⚠  No files found. Drop PDF/Excel/Word docs into:'));
    console.log(clr('dim', '     data-ingest/raw/{general,dc,maryland,virginia,federal,university}/'));
  } else if (run.files_processed > 0) {
    console.log(clr('green', `  ✓ Done. Processed output in data-ingest/processed/`));
  }

  console.log('');
}

// ── Help ───────────────────────────────────────────────────────

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  ${clr('bold', 'GlazePro Ingest CLI')}

  ${clr('dim', 'Usage:')}
    npm run ingest [options]

  ${clr('dim', 'Options:')}
    --force                 Re-process all files, ignoring dedup cache
    --jurisdiction <name>   Only process one folder: dc, maryland, virginia, federal, university, general
    --verbose               Print per-file processing details
    --dry-run               Scan and classify only, do not write output files
    --help                  Show this help

  ${clr('dim', 'Drop files into:')}
    data-ingest/raw/dc/
    data-ingest/raw/maryland/
    data-ingest/raw/virginia/
    data-ingest/raw/federal/
    data-ingest/raw/university/
    data-ingest/raw/general/    ← catch-all / fallback

  ${clr('dim', 'Output files:')}
    data-ingest/processed/projectRecords.json
    data-ingest/processed/sourceDocuments.json
    data-ingest/processed/extractedScopeItems.json
    data-ingest/processed/pricingObservations.json
    data-ingest/processed/ingestionLog.json
`);
  process.exit(0);
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  printBanner();

  const options: IngestOptions = {
    force,
    jurisdictionFilter: jurisdiction,
    verbose,
    log,
  };

  try {
    const runResult = await runIngestPipeline(options);
    printSummary(runResult);
    process.exit(runResult.files_errored > 0 ? 1 : 0);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(clr('red', `\n  Fatal error: ${msg}\n`));
    if (err instanceof Error && err.stack) {
      console.error(clr('dim', err.stack));
    }
    process.exit(2);
  }
}

main();
