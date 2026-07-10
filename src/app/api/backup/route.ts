// ============================================================
// BACKUP CONTROL — GET /api/backup (status) · POST (run now)
// ============================================================

import { NextResponse } from 'next/server';
import { backupNow, getBackupStatus } from '@/lib/backup';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getBackupStatus());
}

export async function POST() {
  const result = await backupNow('manual');
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
