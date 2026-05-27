// ============================================================
// INGEST LOCAL API ROUTE
// POST /api/ingest-local
// Triggers the local file ingest pipeline from the web UI.
// Requires INGEST_SECRET env var for authorization (optional
// but recommended — prevents unauthorized pipeline triggers).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runIngestPipeline } from '@/lib/ingestPipeline';

export async function POST(req: NextRequest) {
  // Optional auth guard — set INGEST_SECRET in .env.local
  const secret = process.env.INGEST_SECRET;
  if (secret) {
    const authHeader = req.headers.get('x-ingest-secret');
    if (authHeader !== secret) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  let body: {
    force?: boolean;
    jurisdiction?: string;
    verbose?: boolean;
  } = {};

  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    const runResult = await runIngestPipeline({
      force: body.force === true,
      jurisdictionFilter: body.jurisdiction,
      verbose: body.verbose === true,
      log,
    });

    return NextResponse.json({
      success: true,
      run: runResult,
      logs: body.verbose ? logs : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ingest-local] Pipeline error:', msg);
    return NextResponse.json(
      { success: false, error: msg, logs },
      { status: 500 }
    );
  }
}

// Allow GET for health/status check
export async function GET() {
  const fs = await import('fs');
  const path = await import('path');
  const logPath = path.join(process.cwd(), 'data-ingest', 'processed', 'ingestionLog.json');

  if (!fs.existsSync(logPath)) {
    return NextResponse.json({
      status: 'ready',
      last_run: null,
      total_files_ever_processed: 0,
    });
  }

  try {
    const log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    const lastRun = log.runs?.[0] ?? null;
    return NextResponse.json({
      status: 'ready',
      last_run: log.last_run,
      total_files_ever_processed: log.total_files_ever_processed,
      last_run_summary: lastRun
        ? {
            run_id: lastRun.run_id,
            started_at: lastRun.started_at,
            files_processed: lastRun.files_processed,
            new_project_records: lastRun.new_project_records,
            verified_authority_upgrades: lastRun.verified_authority_upgrades,
            errors: lastRun.files_errored,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ status: 'ready', last_run: null });
  }
}
