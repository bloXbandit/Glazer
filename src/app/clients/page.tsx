'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Phone, Mail, MapPin, Clock, ChevronRight, RefreshCw,
  MessageSquare, Mic, User, Plus, Search, Filter,
  AlertCircle, TrendingUp, Building, CheckCircle2,
  Upload, PhoneCall, Download, X,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface Client {
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
  status: string;
  lead_score: number;
  lead_score_label: string;
  contact_type: string;
  follow_up_status: string | null;
  follow_up_at: string | null;
  source: string;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new:      { label: 'New',      color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  contacted:{ label: 'Contacted',color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  quoted:   { label: 'Quoted',   color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
  won:      { label: 'Won',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  lost:     { label: 'Lost',     color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30' },
  archived: { label: 'Archived', color: 'text-slate-600',   bg: 'bg-slate-800/30',   border: 'border-slate-700/30' },
};

const SCORE_COLOR = (score: number) =>
  score >= 70 ? 'text-emerald-400' :
  score >= 45 ? 'text-blue-400' :
  score >= 25 ? 'text-purple-400' :
  score > 0   ? 'text-amber-400' :
  'text-slate-500';

const CONTACT_ICON = (type: string) =>
  type === 'voice'  ? <Mic size={10} /> :
  type === 'sms'    ? <MessageSquare size={10} /> :
  type === 'upload' ? <Upload size={10} /> :
  <User size={10} />;

const FOLLOWUP_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  scheduled:      { label: 'Call Scheduled', color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  called:         { label: 'Called',         color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  no_interest:    { label: 'Not Interested', color: 'text-slate-500',   bg: 'bg-slate-700/30' },
  follow_up_again:{ label: 'Re-follow Up',   color: 'text-purple-400',  bg: 'bg-purple-500/10' },
};

// ── Client card ────────────────────────────────────────────────

function ClientCard({ client, onFollowUp }: { client: Client; onFollowUp: (id: string) => void }) {
  const status   = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.new;
  const fuConfig = client.follow_up_status ? FOLLOWUP_CONFIG[client.follow_up_status] : null;
  const relTime  = formatRelTime(client.created_at);
  const [calling, setCalling] = useState(false);

  async function handleFollowUp(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCalling(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/follow-up`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) alert(data.error ?? 'Follow-up call failed');
      else {
        alert(`Follow-up call triggered (SID: ${data.sid})`);
        onFollowUp(client.id);
      }
    } catch { alert('Network error triggering follow-up'); }
    setCalling(false);
  }

  return (
    <Link href={`/clients/${client.id}`}>
      <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl hover:border-brand-500/40 hover:bg-[#1a1d27] transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Name + score */}
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm text-slate-100 truncate">
                {client.name ?? 'Unknown'}
              </p>
              <span className={`text-xs font-bold ${SCORE_COLOR(client.lead_score)}`}>
                {client.lead_score_label}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Phone size={10} className="shrink-0" />
              <span className="font-mono">{client.phone}</span>
              <span className="text-slate-600 flex items-center gap-0.5">
                {CONTACT_ICON(client.contact_type)}
                {client.contact_type}
              </span>
            </div>

            {/* Location + type */}
            {(client.project_location || client.project_type_raw) && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                {client.project_location && (
                  <>
                    <MapPin size={10} />
                    <span>{client.project_location}</span>
                  </>
                )}
                {client.project_type_raw && (
                  <span className="text-slate-600">· {client.project_type_raw}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Status badge */}
            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${status.color} ${status.bg} ${status.border}`}>
              {status.label}
            </span>
            {/* Score bar */}
            <div className="w-16 h-1 bg-[#2a2d3a] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  client.lead_score >= 70 ? 'bg-emerald-500' :
                  client.lead_score >= 45 ? 'bg-blue-500' :
                  client.lead_score >= 25 ? 'bg-purple-500' :
                  'bg-amber-500'
                }`}
                style={{ width: `${client.lead_score}%` }}
              />
            </div>
            {/* Follow-up status */}
            {fuConfig && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${fuConfig.color} ${fuConfig.bg}`}>
                {fuConfig.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-600 mt-2">
          <span className="flex items-center gap-1">
            <Clock size={9} />
            {relTime}
          </span>
          {client.timeline && <span>{client.timeline}</span>}
          <div className="flex items-center gap-2">
            {/* Follow-up call button — only for unclosed clients */}
            {['new', 'contacted'].includes(client.status) && client.follow_up_status !== 'no_interest' && (
              <button
                onClick={handleFollowUp}
                disabled={calling}
                title="Trigger AI follow-up call"
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 transition-colors disabled:opacity-40"
              >
                <PhoneCall size={9} />
                {calling ? 'Calling…' : 'Follow Up'}
              </button>
            )}
            <ChevronRight size={11} className="text-slate-700 group-hover:text-brand-400 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── CSV Upload modal ───────────────────────────────────────────

function CsvUploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [file, setFile]       = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]   = useState<{ inserted: number; updated: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError]     = useState('');

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/clients/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed'); }
      else {
        setResult(data);
        onUploaded();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    }
    setUploading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-[#12141c] border border-[#2a2d3a] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Upload size={14} className="text-brand-400" />
            Upload Client List
          </h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300"><X size={14} /></button>
        </div>

        {!result ? (
          <>
            <p className="text-xs text-slate-500">
              Upload a CSV with columns: <span className="text-slate-400 font-mono">name, phone, email, project_location, project_type_raw, timeline, status, notes</span>. Phone is required.
            </p>
            <a
              href="/api/clients/upload"
              download="client-upload-template.csv"
              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
            >
              <Download size={11} /> Download blank template
            </a>
            <label className="block w-full cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                file ? 'border-brand-500/50 bg-brand-500/5' : 'border-[#2a2d3a] hover:border-brand-500/30'
              }`}>
                {file ? (
                  <p className="text-xs text-brand-400 font-medium">{file.name}</p>
                ) : (
                  <p className="text-xs text-slate-500">Click to select CSV file<br /><span className="text-slate-700">or drag and drop</span></p>
                )}
              </div>
              <input
                type="file" accept=".csv,text/csv" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#2a2d3a] text-xs text-slate-400 hover:text-slate-200">
                Cancel
              </button>
              <button
                onClick={upload}
                disabled={!file || uploading}
                className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Inserted</span>
                <span className="text-emerald-400 font-bold">{result.inserted}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Updated</span>
                <span className="text-blue-400 font-bold">{result.updated}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Skipped</span>
                <span className="text-amber-400 font-bold">{result.skipped}</span>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-24 overflow-y-auto space-y-1">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-[10px] text-red-400">{e}</p>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-colors"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Trigger SMS modal ──────────────────────────────────────────

function TriggerSmsModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function send() {
    if (!phone.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/intake/trigger-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? data.reason ?? 'Failed to send');
      } else {
        setSuccess(`Intake SMS sent to ${phone}!`);
        setTimeout(() => { onSent(); onClose(); }, 1500);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-[#12141c] border border-[#2a2d3a] rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <MessageSquare size={14} className="text-brand-400" />
          Send Intake SMS
        </h2>
        <p className="text-xs text-slate-500">
          Sends the opening intake message to a phone number. Use for missed calls or manual follow-ups.
        </p>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="+12025551234"
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
          autoFocus
        />
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
        {success && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 size={11} />{success}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#2a2d3a] text-xs text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={send}
            disabled={sending || !phone.trim()}
            className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
          >
            {sending ? 'Sending…' : 'Send SMS'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showTrigger, setShowTrigger]   = useState(false);
  const [showUpload, setShowUpload]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/clients${qs}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients ?? []);
        setTotal(data.total ?? 0);
      }
    } catch { /* no-op */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.phone.includes(q) ||
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.project_location ?? '').toLowerCase().includes(q) ||
      (c.project_type_raw ?? '').toLowerCase().includes(q)
    );
  });

  // Stats
  const stats = {
    total,
    newLeads:   clients.filter(c => c.status === 'new').length,
    highValue:  clients.filter(c => c.lead_score_label === 'High Value').length,
    avgScore:   clients.length
      ? Math.round(clients.reduce((s, c) => s + c.lead_score, 0) / clients.length)
      : 0,
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0a0c10]/95 backdrop-blur border-b border-[#1a1d27] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-600 hover:text-slate-400 transition-colors">
            ← Back
          </Link>
          <h1 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <Building size={14} className="text-brand-400" />
            Client Intake
          </h1>
          <span className="text-xs text-slate-600">{total} total</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[#2a2d3a] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2a2d3a] hover:border-brand-500/40 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors"
          >
            <Upload size={12} />
            Upload CSV
          </button>
          <button
            onClick={() => setShowTrigger(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            <Plus size={12} />
            Send Intake SMS
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',      value: stats.total,    icon: <User size={11} />,       color: 'text-slate-300' },
            { label: 'New',        value: stats.newLeads, icon: <Clock size={11} />,       color: 'text-blue-400' },
            { label: 'High Value', value: stats.highValue,icon: <TrendingUp size={11} />,  color: 'text-emerald-400' },
            { label: 'Avg Score',  value: stats.avgScore, icon: <Filter size={11} />,      color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="p-3 bg-[#12141c] border border-[#2a2d3a] rounded-xl text-center">
              <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-600 flex items-center justify-center gap-0.5 mt-0.5">
                {s.icon}{s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, location…"
              className="w-full pl-8 pr-3 py-2 bg-[#12141c] border border-[#2a2d3a] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#12141c] border border-[#2a2d3a] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All status</option>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
            <option value="__followup_due">⚡ Follow-up Due</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[#12141c] border border-[#2a2d3a] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <MessageSquare size={28} className="text-slate-700 mx-auto" />
            <p className="text-sm text-slate-500 font-medium">
              {search || statusFilter ? 'No matching clients' : 'No intake leads yet'}
            </p>
            <p className="text-xs text-slate-700">
              {!search && !statusFilter && 'Set up call forwarding to your SignalWire number and missed calls will auto-trigger intake.'}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => setShowTrigger(true)}
                className="mt-2 text-xs text-brand-400 hover:text-brand-300 underline"
              >
                Send a test intake SMS
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => <ClientCard key={c.id} client={c} onFollowUp={load} />)}
          </div>
        )}
      </main>

      {showUpload && (
        <CsvUploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={load}
        />
      )}
      {showTrigger && (
        <TriggerSmsModal
          onClose={() => setShowTrigger(false)}
          onSent={load}
        />
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
