'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  FolderOpen, Play, RefreshCw, CheckCircle2, AlertTriangle,
  AlertCircle, Clock, Database, FileText, DollarSign,
  Shield, ChevronDown, ChevronUp, Zap, Info, BarChart2,
} from 'lucide-react';
import type { IngestRunEntry, ProcessedIntelBundle } from '@/types/ingest';

// ── Constants ─────────────────────────────────────────────────

const FOLDER_STRUCTURE = [
  { name: 'dc/',         desc: 'Washington D.C. projects',          color: 'text-blue-700' },
  { name: 'maryland/',   desc: 'Maryland projects',                  color: 'text-emerald-700' },
  { name: 'virginia/',   desc: 'Virginia / NoVA projects',           color: 'text-purple-700' },
  { name: 'federal/',    desc: 'Federal GSA / DOD / VA projects',    color: 'text-amber-700' },
  { name: 'university/', desc: 'University / higher-ed projects',    color: 'text-cyan-400' },
  { name: 'general/',    desc: 'Catch-all / fallback jurisdiction',  color: 'text-black/60' },
];

const WORK_TYPE_LABELS: Record<string, string> = {
  storefront: 'Storefront',
  stick_curtain_wall: 'Stick CW',
  unitized_curtain_wall: 'Unitized CW',
  window_wall: 'Window Wall',
  interior_partition: 'Interior Partition',
  glass_railing: 'Glass Railing',
  skylight: 'Skylight',
  fire_rated: 'Fire-Rated',
  blast_security: 'Blast / Security',
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString()}`;

// ── Sub-components ─────────────────────────────────────────────

function StatCard({ label, value, sub, icon, highlight }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  highlight?: 'green' | 'amber' | 'blue';
}) {
  const colors = {
    green: 'text-emerald-700',
    amber: 'text-amber-700',
    blue: 'text-[#d63c3c]',
  };
  return (
    <div className="p-3 bg-white border border-black">
      <div className="flex items-center gap-1.5 text-xs text-black/50 mb-1">
        <span className="text-[#d63c3c]">{icon}</span>
        {label}
      </div>
      <p className={`text-lg font-bold ${highlight ? colors[highlight] : 'text-black'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-black/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function RunLogEntry({ run }: { run: IngestRunEntry }) {
  const [open, setOpen] = useState(false);
  const hasErrors = run.files_errored > 0;
  const hasUpgrades = run.verified_authority_upgrades > 0;
  const dur = ((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(1);

  return (
    <div className={`border overflow-hidden ${hasErrors ? 'border-red-500/20' : 'border-black'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-[#FFFDF5] transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-xs">
          {hasErrors
            ? <AlertTriangle size={11} className="text-red-700" />
            : <CheckCircle2 size={11} className="text-emerald-700" />
          }
          <span className="text-black/60 font-mono">{run.run_id}</span>
          <span className="text-black/40">
            {new Date(run.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-black/50">
            {run.files_processed} processed · {run.new_project_records} new projects · {dur}s
          </span>
          {hasUpgrades && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-700/40 text-emerald-700 text-[10px]">
              {run.verified_authority_upgrades} verified
            </span>
          )}
          {run.jurisdiction_filter && (
            <span className="px-1.5 py-0.5 rounded bg-[#FFD93D]/40 border border-black/40 text-[#d63c3c] text-[10px]">
              {run.jurisdiction_filter}
            </span>
          )}
          {run.forced && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-700/30 text-amber-700 text-[10px]">
              forced
            </span>
          )}
        </div>
        {open ? <ChevronUp size={12} className="text-black/40 shrink-0" /> : <ChevronDown size={12} className="text-black/40 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 py-3 bg-white text-xs space-y-2">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 text-center">
            {[
              { l: 'Scanned',    v: run.files_scanned },
              { l: 'Processed',  v: run.files_processed, c: 'text-emerald-700' },
              { l: 'Dedup skip', v: run.files_skipped_dedup, c: 'text-black/50' },
              { l: 'Errors',     v: run.files_errored, c: run.files_errored > 0 ? 'text-red-700' : 'text-black/50' },
              { l: 'Upgrades',   v: run.verified_authority_upgrades, c: run.verified_authority_upgrades > 0 ? 'text-cyan-400' : 'text-black/50' },
            ].map(s => (
              <div key={s.l} className="p-2 bg-white">
                <p className={`font-bold text-base ${s.c ?? 'text-black'}`}>{s.v}</p>
                <p className="text-black/40 text-[10px]">{s.l}</p>
              </div>
            ))}
          </div>

          {run.errors.length > 0 && (
            <div className="p-2 bg-red-50 border border-red-500/20 space-y-1">
              {run.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-red-700">
                  <span className="text-red-600">{e.file}: </span>{e.error}
                </p>
              ))}
              {run.errors.length > 5 && (
                <p className="text-black/40">…and {run.errors.length - 5} more. See ingestionLog.json.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export default function IngestDashboard() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [lastRun, setLastRun] = useState<IngestRunEntry | null>(null);
  const [bundle, setBundle] = useState<ProcessedIntelBundle | null>(null);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [runLog, setRunLog] = useState<IngestRunEntry[]>([]);
  const [runLogLoading, setRunLogLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [force, setForce] = useState(false);
  const [jurisdiction, setJurisdiction] = useState('');
  const [verbose, setVerbose] = useState(false);

  // ── Load current state on mount ──
  useEffect(() => {
    loadBundle();
    loadRunLog();
  }, []);

  const loadBundle = useCallback(async () => {
    setBundleLoading(true);
    try {
      const res = await fetch('/api/processed-intel');
      if (res.ok) setBundle(await res.json());
    } catch { /* no processed data yet */ }
    setBundleLoading(false);
  }, []);

  const loadRunLog = useCallback(async () => {
    setRunLogLoading(true);
    try {
      const res = await fetch('/api/processed-intel?type=log');
      if (res.ok) {
        const log = await res.json();
        setRunLog(log.runs ?? []);
      }
    } catch { /* no log yet */ }
    setRunLogLoading(false);
  }, []);

  const handleRunIngest = useCallback(async () => {
    setStatus('running');
    setError(null);
    setLastRun(null);

    try {
      const res = await fetch('/api/ingest-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force, jurisdiction: jurisdiction || undefined, verbose }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Ingest failed.');
        setStatus('error');
        return;
      }

      setLastRun(data.run as IngestRunEntry);
      setStatus('done');

      // Refresh bundle and log
      await Promise.all([loadBundle(), loadRunLog()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setStatus('error');
    }
  }, [force, jurisdiction, verbose, loadBundle, loadRunLog]);

  // ── Render ──────────────────────────────────────────────────

  const meta = bundle?.meta;
  const verifiedCount = meta?.verified_pricing_count ?? 0;
  const totalProjects = meta?.total_projects ?? 0;

  return (
    <div className="space-y-5">
      {/* Drop-zone instructions */}
      <div className="p-4 bg-white border border-black rounded-2xl space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen size={14} className="text-[#d63c3c]" />
          <h2 className="text-sm font-semibold text-black">Folder Drop Structure</h2>
          <span className="text-xs text-black/40 ml-1">data-ingest/raw/</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {FOLDER_STRUCTURE.map(f => (
            <div key={f.name} className="flex items-center gap-2 p-2 bg-white border border-black">
              <span className={`font-mono text-xs font-bold ${f.color}`}>{f.name}</span>
              <span className="text-xs text-black/50">{f.desc}</span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-2.5 bg-blue-500/5 border border-blue-500/20 text-xs text-black/60">
          <Info size={12} className="text-blue-700 mt-0.5 shrink-0" />
          Drop PDF, Excel (.xlsx/.xls), or Word (.docx) files into the appropriate folder, then run ingest.
          Files are deduplicated by SHA-256 — dropping the same file twice is safe.
        </div>

        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-700/30 text-xs text-amber-700/80">
          <Info size={12} className="text-amber-700 mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold text-amber-700">Jurisdiction fallback: </span>
            When querying for a region with no matching records, the system automatically falls back to{' '}
            <span className="font-mono text-amber-300">general/</span>.
          </span>
        </div>
      </div>

      {/* Run controls */}
      <div className="p-4 bg-white border border-black rounded-2xl space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Play size={13} className="text-[#d63c3c]" />
          <h2 className="text-sm font-semibold text-black">Run Ingest Pipeline</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-black/50 mb-1 block">Jurisdiction filter</label>
            <select
              value={jurisdiction}
              onChange={e => setJurisdiction(e.target.value)}
              className="w-full bg-white border border-black px-3 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-[#FFD93D]/20"
            >
              <option value="">All jurisdictions</option>
              <option value="dc">dc — Washington D.C.</option>
              <option value="maryland">maryland — Maryland</option>
              <option value="virginia">virginia — Virginia</option>
              <option value="federal">federal — Federal</option>
              <option value="university">university — University</option>
              <option value="general">general — Catch-all</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={force}
                onChange={e => setForce(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#FF6B6B]"
              />
              <span className="text-xs text-black/60">
                <span className="text-amber-700 font-medium">--force</span> (re-process all files)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verbose}
                onChange={e => setVerbose(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#FF6B6B]"
              />
              <span className="text-xs text-black/60">
                <span className="font-medium">--verbose</span> (return per-file logs)
              </span>
            </label>
          </div>

          <div className="flex items-end">
            <div className="text-xs text-black/50 mb-2">
              Or run from terminal:
              <p className="font-mono text-black/60 mt-0.5">npm run ingest</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-100 border border-red-700/40 text-xs text-red-700">
            <AlertCircle size={12} /> {error}
          </div>
        )}

        <button
          onClick={handleRunIngest}
          disabled={status === 'running'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B6B] hover:bg-[#ff8585] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
        >
          {status === 'running' ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
              Running pipeline…
            </>
          ) : (
            <>
              <Play size={14} />
              Run Ingest Pipeline
            </>
          )}
        </button>
      </div>

      {/* Last run summary */}
      {lastRun && status === 'done' && (
        <div className="p-4 bg-emerald-50 border border-emerald-700/30 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={14} />
            Ingest Complete — Run {lastRun.run_id}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            {[
              { l: 'Files processed',  v: lastRun.files_processed,             c: 'text-emerald-700' },
              { l: 'New projects',     v: lastRun.new_project_records,          c: 'text-[#d63c3c]' },
              { l: 'Scope items',      v: lastRun.new_scope_items,              c: 'text-black' },
              { l: 'Pricing obs.',     v: lastRun.new_pricing_observations,     c: 'text-black' },
            ].map(s => (
              <div key={s.l} className="p-2 bg-white text-center">
                <p className={`font-bold text-base ${s.c}`}>{s.v}</p>
                <p className="text-black/40 text-[10px]">{s.l}</p>
              </div>
            ))}
          </div>
          {lastRun.verified_authority_upgrades > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400">
              <Zap size={11} />
              {lastRun.verified_authority_upgrades} record{lastRun.verified_authority_upgrades > 1 ? 's' : ''} upgraded to{' '}
              <span className="font-semibold">verified_pricing_authority</span>
            </div>
          )}
          {lastRun.files_errored > 0 && (
            <div className="text-xs text-red-700 flex items-center gap-1.5">
              <AlertTriangle size={11} />
              {lastRun.files_errored} file{lastRun.files_errored > 1 ? 's' : ''} errored — check ingestionLog.json
            </div>
          )}
        </div>
      )}

      {/* Current library stats */}
      {(bundleLoading || meta) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-black/60 uppercase tracking-wide flex items-center gap-1.5">
              <Database size={11} /> Processed Library
            </h3>
            <button
              onClick={() => { loadBundle(); loadRunLog(); }}
              disabled={bundleLoading}
              className="flex items-center gap-1 text-xs text-black/50 hover:text-black/80 transition-colors"
            >
              <RefreshCw size={10} className={bundleLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {bundleLoading ? (
            <div className="h-20 bg-white border border-black animate-pulse" />
          ) : meta ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Total Projects"
                  value={totalProjects}
                  icon={<FileText size={11} />}
                  highlight="blue"
                />
                <StatCard
                  label="Verified Authority"
                  value={verifiedCount}
                  sub={`${totalProjects > 0 ? Math.round(verifiedCount / totalProjects * 100) : 0}% of total`}
                  icon={<Shield size={11} />}
                  highlight={verifiedCount > 0 ? 'green' : undefined}
                />
                <StatCard
                  label="Pricing Obs."
                  value={bundle?.pricingObservations.length ?? 0}
                  icon={<DollarSign size={11} />}
                />
                <StatCard
                  label="Source Files"
                  value={meta.total_sources}
                  icon={<Database size={11} />}
                />
              </div>

              {/* Jurisdiction breakdown */}
              {Object.keys(meta.jurisdictions).length > 0 && (
                <div className="p-3 bg-white border border-black">
                  <p className="text-xs text-black/50 mb-2 flex items-center gap-1.5">
                    <BarChart2 size={11} /> By Jurisdiction
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(meta.jurisdictions).map(([jur, count]) => (
                      <span key={jur} className="text-xs px-2 py-0.5 bg-white border border-black rounded text-black/80">
                        <span className="font-medium">{jur}</span>
                        <span className="text-black/40 ml-1">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified pricing observations */}
              {(bundle?.pricingObservations.filter(o => o.authority === 'verified_pricing_authority').length ?? 0) > 0 && (
                <div className="p-3 bg-white border border-black">
                  <p className="text-xs text-black/50 mb-2 flex items-center gap-1.5">
                    <DollarSign size={11} className="text-emerald-700" />
                    <span className="text-emerald-700 font-medium">Verified $/SF Benchmarks</span>
                  </p>
                  <div className="space-y-1.5">
                    {bundle!.pricingObservations
                      .filter(o => o.authority === 'verified_pricing_authority' && o.effective_psf)
                      .slice(0, 8)
                      .map(o => (
                        <div key={o.id} className="flex items-center justify-between text-xs">
                          <span className="text-black/60 truncate flex-1 mr-2">
                            {WORK_TYPE_LABELS[o.glazing_system] ?? o.glazing_system}
                            {o.project_name && <span className="text-black/40 ml-1">— {o.project_name.slice(0, 30)}</span>}
                          </span>
                          <span className="text-emerald-700 font-semibold shrink-0">
                            ${o.effective_psf!.toFixed(0)}/SF
                          </span>
                          <span className="text-black/40 ml-2 shrink-0 text-[10px]">
                            {o.jurisdiction.toUpperCase()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {meta.last_updated && (
                <p className="text-xs text-black/40 flex items-center gap-1">
                  <Clock size={10} />
                  Last ingested: {new Date(meta.last_updated).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <div className="p-4 bg-white border border-black text-xs text-black/40 text-center">
              No processed records yet. Drop files into{' '}
              <span className="font-mono text-black/50">data-ingest/raw/</span> and run the pipeline.
            </div>
          )}
        </div>
      )}

      {/* Run history */}
      {runLog.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-black/60 uppercase tracking-wide flex items-center gap-1.5">
            <Clock size={11} /> Run History
          </h3>
          {runLog.slice(0, 8).map(run => (
            <RunLogEntry key={run.run_id} run={run} />
          ))}
          {runLog.length > 8 && (
            <p className="text-xs text-black/40 text-center">
              +{runLog.length - 8} older runs in ingestionLog.json
            </p>
          )}
        </div>
      )}

      {/* No data state */}
      {!bundleLoading && !meta && runLog.length === 0 && (
        <div className="p-6 bg-white border border-dashed border-black rounded-2xl text-center space-y-2">
          <FolderOpen size={24} className="text-black/40 mx-auto" />
          <p className="text-sm text-black/50 font-medium">No files ingested yet</p>
          <p className="text-xs text-black/40">
            Drop procurement docs into{' '}
            <span className="font-mono text-[#d63c3c]">data-ingest/raw/</span>, then run the pipeline above.
          </p>
          <p className="text-xs text-black/30 mt-2">
            Supported: PDF · Excel (.xlsx/.xls) · Word (.docx) · CSV · TXT
          </p>
        </div>
      )}
    </div>
  );
}
