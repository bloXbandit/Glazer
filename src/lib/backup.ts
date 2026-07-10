// ============================================================
// DB BACKUP — SQLite → Cloudflare R2 (S3-compatible)
// Render's free tier wipes the filesystem on every deploy and
// idle spin-down, so the database survives via R2:
//   - restoreFromBackupIfMissing(): boot-time restore (instrumentation)
//   - scheduleBackup(): debounced snapshot after any DB write
//   - backupNow(): immediate snapshot (manual /api/backup trigger)
// Objects written: latest/intake.db (always) + daily/intake-YYYY-MM-DD.db
// (first backup of each day — rolling history within R2's free 10 GB).
// Failures are logged, never thrown — backups must not break requests.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const DB_PATH = path.join(process.cwd(), 'data', 'intake.db');
const LATEST_KEY = 'latest/intake.db';

const DEBOUNCE_MS = 20_000;        // quiet period after last write
const MAX_INTERVAL_MS = 5 * 60_000; // force upload at least every 5 min while writes continue

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastUploadAt = 0;
let lastResult: { at: string; ok: boolean; bytes?: number; error?: string } | null = null;
let uploading = false;

export function isBackupConfigured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
}

function r2(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function getBackupStatus() {
  return {
    configured: isBackupConfigured(),
    last_result: lastResult,
    pending: debounceTimer !== null,
  };
}

// Debounced backup — call after any DB write. Bursts collapse into one
// upload; sustained write activity still uploads every MAX_INTERVAL_MS.
export function scheduleBackup(): void {
  if (!isBackupConfigured()) return;
  if (Date.now() - lastUploadAt > MAX_INTERVAL_MS && lastUploadAt !== 0) {
    void backupNow('interval');
    return;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void backupNow('debounced');
  }, DEBOUNCE_MS);
  // Don't hold the process open just for a pending backup
  if (typeof debounceTimer.unref === 'function') debounceTimer.unref();
}

export async function backupNow(reason: string): Promise<{ ok: boolean; bytes?: number; error?: string }> {
  if (!isBackupConfigured()) return { ok: false, error: 'R2 env vars not configured' };
  if (uploading) return { ok: false, error: 'backup already in progress' };
  if (!fs.existsSync(DB_PATH)) return { ok: false, error: 'no database file yet' };
  uploading = true;

  try {
    // Fold the WAL into the main file so the snapshot is complete on its own.
    // A second connection is fine — SQLite coordinates via file locks.
    try {
      const db = new Database(DB_PATH);
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.close();
    } catch (err) {
      console.warn('[backup] WAL checkpoint failed (continuing):', err);
    }

    const bytes = fs.readFileSync(DB_PATH);
    const client = r2();
    const bucket = process.env.R2_BUCKET!;

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: LATEST_KEY,
      Body: bytes,
      ContentType: 'application/x-sqlite3',
      Metadata: { reason, uploaded_at: new Date().toISOString() },
    }));

    // First backup of the day also lands a dated snapshot
    const today = new Date().toISOString().slice(0, 10);
    const dailyKey = `daily/intake-${today}.db`;
    const lastDay = lastResult?.at?.slice(0, 10);
    if (lastDay !== today) {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: dailyKey,
        Body: bytes,
        ContentType: 'application/x-sqlite3',
      })).catch(err => console.warn('[backup] daily snapshot failed:', err));
    }

    lastUploadAt = Date.now();
    lastResult = { at: new Date().toISOString(), ok: true, bytes: bytes.length };
    console.log(`[backup] ${reason}: uploaded ${bytes.length} bytes → r2://${bucket}/${LATEST_KEY}`);
    return { ok: true, bytes: bytes.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    lastResult = { at: new Date().toISOString(), ok: false, error: msg };
    console.error('[backup] upload failed:', msg);
    return { ok: false, error: msg };
  } finally {
    uploading = false;
  }
}

// Boot-time restore — runs from instrumentation before traffic is served.
// Only acts when the local DB file is absent (fresh deploy / spin-up).
export async function restoreFromBackupIfMissing(): Promise<void> {
  if (!isBackupConfigured()) {
    console.log('[backup] R2 not configured — restore skipped');
    return;
  }
  if (fs.existsSync(DB_PATH)) {
    console.log('[backup] local DB present — restore not needed');
    return;
  }

  try {
    const res = await r2().send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: LATEST_KEY,
    }));
    const body = await res.Body?.transformToByteArray();
    if (!body || body.length === 0) {
      console.log('[backup] no snapshot in R2 yet — starting with a fresh DB');
      return;
    }
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(body));
    console.log(`[backup] RESTORED ${body.length} bytes from r2://${process.env.R2_BUCKET}/${LATEST_KEY}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('NoSuchKey') || msg.includes('does not exist')) {
      console.log('[backup] no snapshot in R2 yet — starting with a fresh DB');
    } else {
      console.error('[backup] restore failed (starting fresh):', msg);
    }
  }
}
