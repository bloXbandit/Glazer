// ============================================================
// SQLite DATABASE — Intake CRM
// Uses better-sqlite3 (synchronous, file-based, zero config).
// DB file lives at: data/intake.db (auto-created on first run)
// ============================================================

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_DIR  = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'intake.db');

// Ensure data/ directory exists
fs.mkdirSync(DB_DIR, { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  runMigrations(_db);
  return _db;
}

// ── Schema migrations ──────────────────────────────────────────

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id              TEXT PRIMARY KEY,
      name            TEXT,
      phone           TEXT NOT NULL,
      email           TEXT,
      project_location TEXT,
      project_type_raw TEXT,
      glazing_category TEXT,
      approx_size     TEXT,
      timeline        TEXT,
      new_construction INTEGER,         -- 0/1/null
      notes           TEXT,
      status          TEXT NOT NULL DEFAULT 'new',
      lead_score      INTEGER DEFAULT 0,
      lead_score_label TEXT DEFAULT 'Unscored',
      contact_type    TEXT NOT NULL DEFAULT 'sms',
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS intake_sessions (
      id           TEXT PRIMARY KEY,
      phone        TEXT NOT NULL UNIQUE,
      step         INTEGER NOT NULL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'active',  -- active | completed | abandoned | opted_out
      collected    TEXT NOT NULL DEFAULT '{}',       -- JSON blob of captured fields
      mode         TEXT NOT NULL DEFAULT 'sms',      -- sms | voice
      client_id    TEXT REFERENCES clients(id),
      started_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id           TEXT PRIMARY KEY,
      session_id   TEXT NOT NULL REFERENCES intake_sessions(id),
      client_id    TEXT REFERENCES clients(id),
      direction    TEXT NOT NULL,   -- inbound | outbound
      body         TEXT NOT NULL,
      media_url    TEXT,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS procurement_intel (
      id              TEXT PRIMARY KEY,
      work_type_id    TEXT NOT NULL,
      region_id       TEXT NOT NULL DEFAULT 'national',
      price_per_sf    REAL NOT NULL,
      total_sf        REAL,
      total_price     REAL,
      price_confidence TEXT NOT NULL DEFAULT 'proposed',
      document_type   TEXT,
      subcontractor   TEXT,
      project_name    TEXT,
      project_location TEXT,
      bid_date        TEXT,
      parse_confidence TEXT,
      raw_snippet     TEXT,
      created_at      TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_proc_intel_work_region
      ON procurement_intel(work_type_id, region_id);

    CREATE INDEX IF NOT EXISTS idx_clients_phone      ON clients(phone);
    CREATE INDEX IF NOT EXISTS idx_clients_status     ON clients(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_phone     ON intake_sessions(phone);
    CREATE INDEX IF NOT EXISTS idx_convos_session     ON conversations(session_id);
    CREATE INDEX IF NOT EXISTS idx_convos_client      ON conversations(client_id);
  `);

  // ── Additive migrations (safe to re-run) ──────────────────────
  const alterSafe = (sql: string) => { try { db.exec(sql); } catch { /* column exists */ } };
  alterSafe(`ALTER TABLE clients ADD COLUMN follow_up_status TEXT`);
  alterSafe(`ALTER TABLE clients ADD COLUMN follow_up_at     TEXT`);
  alterSafe(`ALTER TABLE clients ADD COLUMN source           TEXT NOT NULL DEFAULT 'voice'`);
}

// ── Types ──────────────────────────────────────────────────────

export interface ClientRow {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  project_location: string | null;
  project_type_raw: string | null;
  glazing_category: string | null;
  approx_size: string | null;
  timeline: string | null;
  new_construction: number | null;
  notes: string | null;
  status: string;
  lead_score: number;
  lead_score_label: string;
  contact_type: string;
  follow_up_status: string | null;  // null | 'scheduled' | 'called' | 'closed_won' | 'no_interest'
  follow_up_at: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  phone: string;
  step: number;
  status: string;
  collected: string; // JSON
  mode: string;
  client_id: string | null;
  started_at: string;
  updated_at: string;
}

export interface ConversationRow {
  id: string;
  session_id: string;
  client_id: string | null;
  direction: string;
  body: string;
  media_url: string | null;
  created_at: string;
}

// ── Client helpers ─────────────────────────────────────────────

export function upsertClient(
  data: Partial<ClientRow> & { phone: string }
): ClientRow {
  const db  = getDb();
  const now = new Date().toISOString();

  const existing = db
    .prepare('SELECT * FROM clients WHERE phone = ?')
    .get(data.phone) as ClientRow | undefined;

  if (existing) {
    const fields = Object.entries(data)
      .filter(([k]) => k !== 'id' && k !== 'phone' && k !== 'created_at')
      .map(([k]) => `${k} = @${k}`)
      .join(', ');

    db.prepare(`UPDATE clients SET ${fields}, updated_at = @updated_at WHERE phone = @phone`)
      .run({ ...data, updated_at: now });

    return db.prepare('SELECT * FROM clients WHERE phone = ?').get(data.phone) as ClientRow;
  }

  const id = generateId('cl');
  db.prepare(`
    INSERT INTO clients
      (id, name, phone, email, project_location, project_type_raw, glazing_category,
       approx_size, timeline, new_construction, notes, status, lead_score, lead_score_label,
       contact_type, source, follow_up_status, follow_up_at, created_at, updated_at)
    VALUES
      (@id, @name, @phone, @email, @project_location, @project_type_raw, @glazing_category,
       @approx_size, @timeline, @new_construction, @notes, @status, @lead_score, @lead_score_label,
       @contact_type, @source, @follow_up_status, @follow_up_at, @created_at, @updated_at)
  `).run({
    id,
    name:             null,
    email:            null,
    project_location: null,
    project_type_raw: null,
    glazing_category: null,
    approx_size:      null,
    timeline:         null,
    new_construction: null,
    notes:            null,
    status:           'new',
    lead_score:       0,
    lead_score_label: 'Unscored',
    contact_type:     'sms',
    source:           'voice',
    follow_up_status: null,
    follow_up_at:     null,
    ...data,
    created_at: now,
    updated_at: now,
  });

  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as ClientRow;
}

export function getClient(id: string): ClientRow | undefined {
  return getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id) as ClientRow | undefined;
}

export function getClientByPhone(phone: string): ClientRow | undefined {
  return getDb().prepare('SELECT * FROM clients WHERE phone = ?').get(phone) as ClientRow | undefined;
}

export function listClients(limit = 100, offset = 0): ClientRow[] {
  return getDb()
    .prepare('SELECT * FROM clients ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset) as ClientRow[];
}

export function updateClientStatus(id: string, status: string): void {
  getDb().prepare('UPDATE clients SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), id);
}

export function setFollowUpStatus(
  id: string,
  followUpStatus: string
): void {
  getDb()
    .prepare('UPDATE clients SET follow_up_status = ?, follow_up_at = ?, updated_at = ? WHERE id = ?')
    .run(followUpStatus, new Date().toISOString(), new Date().toISOString(), id);
}

export function listClientsNeedingFollowUp(): ClientRow[] {
  // New or contacted clients with no follow-up yet, created > 24h ago
  return getDb()
    .prepare(`
      SELECT * FROM clients
      WHERE status IN ('new', 'contacted')
        AND (follow_up_status IS NULL OR follow_up_status = 'scheduled')
        AND phone IS NOT NULL AND phone != ''
        AND created_at < datetime('now', '-1 day')
      ORDER BY lead_score DESC
    `)
    .all() as ClientRow[];
}

// ── Session helpers ────────────────────────────────────────────

export function getSession(phone: string): SessionRow | undefined {
  return getDb()
    .prepare("SELECT * FROM intake_sessions WHERE phone = ? AND status = 'active'")
    .get(phone) as SessionRow | undefined;
}

export function createSession(phone: string, mode: 'sms' | 'voice' = 'sms'): SessionRow {
  const db  = getDb();
  const now = new Date().toISOString();
  const id  = generateId('sess');

  db.prepare(`
    INSERT INTO intake_sessions (id, phone, step, status, collected, mode, started_at, updated_at)
    VALUES (@id, @phone, 0, 'active', '{}', @mode, @now, @now)
    ON CONFLICT(phone) DO UPDATE SET
      step = 0, status = 'active', collected = '{}', updated_at = @now
  `).run({ id, phone, mode, now });

  return db.prepare('SELECT * FROM intake_sessions WHERE phone = ?').get(phone) as SessionRow;
}

export function updateSession(
  phone: string,
  updates: Partial<Pick<SessionRow, 'step' | 'status' | 'client_id'>> & { collected?: Record<string, unknown> }
): void {
  const db  = getDb();
  const now = new Date().toISOString();
  const current = getSession(phone);
  if (!current) return;

  const collectedJson = updates.collected
    ? JSON.stringify({ ...JSON.parse(current.collected), ...updates.collected })
    : current.collected;

  db.prepare(`
    UPDATE intake_sessions
    SET step = @step, status = @status, collected = @collected,
        client_id = @client_id, updated_at = @updated_at
    WHERE phone = @phone
  `).run({
    phone,
    step:       updates.step       ?? current.step,
    status:     updates.status     ?? current.status,
    collected:  collectedJson,
    client_id:  updates.client_id  ?? current.client_id,
    updated_at: now,
  });
}

// ── Conversation helpers ───────────────────────────────────────

export function logMessage(
  sessionId: string,
  direction: 'inbound' | 'outbound',
  body: string,
  clientId?: string,
  mediaUrl?: string
): void {
  getDb().prepare(`
    INSERT INTO conversations (id, session_id, client_id, direction, body, media_url, created_at)
    VALUES (@id, @session_id, @client_id, @direction, @body, @media_url, @created_at)
  `).run({
    id: generateId('msg'),
    session_id: sessionId,
    client_id:  clientId ?? null,
    direction,
    body,
    media_url:  mediaUrl ?? null,
    created_at: new Date().toISOString(),
  });
}

export function getConversation(sessionId: string): ConversationRow[] {
  return getDb()
    .prepare('SELECT * FROM conversations WHERE session_id = ? ORDER BY created_at ASC')
    .all(sessionId) as ConversationRow[];
}

export function getClientConversations(clientId: string): ConversationRow[] {
  return getDb()
    .prepare('SELECT * FROM conversations WHERE client_id = ? ORDER BY created_at ASC')
    .all(clientId) as ConversationRow[];
}

// ── ID generator ───────────────────────────────────────────────

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts   = Date.now().toString(36);
  return `${prefix}_${ts}${rand}`;
}
