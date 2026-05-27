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

  const scoreBg = client.lead_score >= 70 ? '#FFD93D' : client.lead_score >= 45 ? '#C4B5FD' : client.lead_score >= 25 ? '#C4B5FD' : '#FFFDF5';
  const statusBg: Record<string, string> = { new:'#C4B5FD', contacted:'#FFD93D', quoted:'#C4B5FD', won:'#FFD93D', lost:'#FF6B6B' };

  return (
    <Link href={`/clients/${client.id}`}>
      <div className="relative group cursor-pointer">
        {/* Shadow slab */}
        <div className="absolute inset-0 border-4 border-black translate-x-[4px] translate-y-[4px] bg-[#FFD93D] transition-all duration-150 group-hover:translate-x-[6px] group-hover:translate-y-[6px]" />
        {/* Card face */}
        <div className="relative border-4 border-black p-4 bg-white transition-all duration-150 group-hover:-translate-x-[2px] group-hover:-translate-y-[2px]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Name + score label */}
              <div className="flex items-center gap-2 mb-1.5">
                <p className="font-black text-sm text-black truncate">
                  {client.name ?? 'Unknown'}
                </p>
                <span className="text-[9px] font-black uppercase tracking-widest border border-black px-1.5 py-0.5"
                  style={{ background: scoreBg }}>
                  {client.lead_score_label}
                </span>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-black/60 mb-1">
                <Phone size={10} strokeWidth={3} className="shrink-0" />
                <span className="font-mono">{client.phone}</span>
                <span className="text-black/40 flex items-center gap-0.5">
                  {CONTACT_ICON(client.contact_type)}
                  {client.contact_type}
                </span>
              </div>

              {/* Location + type */}
              {(client.project_location || client.project_type_raw) && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-black/50 mb-1">
                  {client.project_location && (
                    <><MapPin size={10} strokeWidth={3} /><span>{client.project_location}</span></>
                  )}
                  {client.project_type_raw && (
                    <span className="text-black/40">· {client.project_type_raw}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Status badge */}
              <span className="text-[9px] font-black uppercase tracking-widest border-2 border-black px-2 py-0.5"
                style={{ background: statusBg[client.status] ?? '#FFFDF5' }}>
                {status.label}
              </span>
              {/* Score bar */}
              <div className="w-16 h-2 border-2 border-black bg-white overflow-hidden">
                <div className="h-full border-r-2 border-black"
                  style={{ width:`${client.lead_score}%`, background: scoreBg }} />
              </div>
              {fuConfig && (
                <span className="text-[9px] font-black uppercase tracking-widest border border-black px-1.5 py-0.5 bg-[#FFFDF5]">
                  {fuConfig.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-black/40 mt-2 border-t-2 border-black/10 pt-2">
            <span className="flex items-center gap-1">
              <Clock size={9} strokeWidth={3} />{relTime}
            </span>
            {client.timeline && <span className="font-black text-black/60">{client.timeline}</span>}
            <div className="flex items-center gap-2">
              {['new', 'contacted'].includes(client.status) && client.follow_up_status !== 'no_interest' && (
                <button
                  onClick={handleFollowUp}
                  disabled={calling}
                  title="Trigger AI follow-up call"
                  className="flex items-center gap-1 px-2 py-0.5 border-2 border-black font-black text-[9px] uppercase tracking-wide bg-[#C4B5FD] hover:bg-[#FFD93D] transition-colors disabled:opacity-40"
                  style={{ boxShadow:'1px 1px 0 #000' }}
                >
                  <PhoneCall size={9} strokeWidth={3} />
                  {calling ? 'Calling…' : 'Follow Up'}
                </button>
              )}
              <ChevronRight size={11} strokeWidth={3} className="text-black/30 group-hover:text-black transition-colors" />
            </div>
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

// ── Add Client modal ─────────────────────────────────────────

function AddClientModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', project_location: '',
    project_type_raw: '', glazing_category: '', approx_size: '',
    timeline: '', status: 'new', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.phone.trim()) { setError('Phone number is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'manual',
          contact_type: 'manual',
          name:             form.name             || null,
          email:            form.email            || null,
          project_location: form.project_location || null,
          project_type_raw: form.project_type_raw || null,
          glazing_category: form.glazing_category || null,
          approx_size:      form.approx_size      || null,
          timeline:         form.timeline         || null,
          notes:            form.notes            || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Save failed.'); }
      else { setSuccess(true); onSaved(); setTimeout(() => { onClose(); }, 1200); }
    } catch { setError('Network error.'); }
    setSaving(false);
  }

  const inputCls = 'w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500';
  const labelCls = 'block text-[10px] text-slate-500 mb-1 uppercase tracking-wide font-medium';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 bg-[#12141c] border border-[#2a2d3a] rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <User size={14} className="text-brand-400" />
            Add Client Manually
          </h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300"><X size={14} /></button>
        </div>

        {success ? (
          <p className="text-sm text-emerald-400 flex items-center gap-2 py-4 justify-center">
            <CheckCircle2 size={16} /> Client saved!
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Name</label>
                <input className={inputCls} placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Phone <span className="text-red-400">*</span></label>
                <input className={inputCls} placeholder="+12025551234" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} placeholder="jane@example.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input className={inputCls} placeholder="Baltimore, MD" value={form.project_location} onChange={e => set('project_location', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Project Type</label>
                <input className={inputCls} placeholder="e.g. Storefront replacement" value={form.project_type_raw} onChange={e => set('project_type_raw', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Glazing Category</label>
                <select className={inputCls} value={form.glazing_category} onChange={e => set('glazing_category', e.target.value)}>
                  <option value="">— Select —</option>
                  <option>Storefront</option>
                  <option>Curtain Wall</option>
                  <option>Window Wall</option>
                  <option>Glass Railing</option>
                  <option>Skylight</option>
                  <option>Interior Partition</option>
                  <option>Fire-Rated</option>
                  <option>Residential Windows</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Approx. Size</label>
                <input className={inputCls} placeholder="e.g. 2,000 SF" value={form.approx_size} onChange={e => set('approx_size', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Timeline</label>
                <input className={inputCls} placeholder="e.g. Q3 2025" value={form.timeline} onChange={e => set('timeline', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <option key={v} value={v}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Notes</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Any additional context…"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#2a2d3a] text-xs text-slate-400 hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
              >
                {saving ? 'Saving…' : 'Save Client'}
              </button>
            </div>
          </>
        )}
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
  const [showAddClient, setShowAddClient] = useState(false);

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
    <div className="min-h-screen bg-[#FFFDF5] bg-grid text-black">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#FFFDF5] border-b-4 border-black px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-black text-xs uppercase tracking-widest border-2 border-black px-2 py-1 hover:bg-[#FFD93D] transition-colors"
            style={{ boxShadow:'2px 2px 0 #000' }}>
            ← Back
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-[#FFD93D] border-2 border-black flex items-center justify-center">
              <Building size={12} strokeWidth={3} className="text-black" />
            </div>
            <h1 className="text-xs font-black uppercase tracking-widest">Client Intake</h1>
          </div>
          <span className="text-[10px] font-black border-2 border-black px-1.5 py-0.5 bg-[#C4B5FD]">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-[#FFD93D] transition-colors"
            style={{ boxShadow:'2px 2px 0 #000' }}>
            <RefreshCw size={12} strokeWidth={3} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowUpload(true)}
            className="neo-btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <Upload size={12} strokeWidth={3} /> Upload CSV
          </button>
          <button onClick={() => setShowAddClient(true)}
            className="neo-btn-yellow flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <User size={12} strokeWidth={3} /> Add Client
          </button>
          <button onClick={() => setShowTrigger(true)}
            className="neo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <Plus size={12} strokeWidth={3} /> Send Intake SMS
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {([
            { label: 'Total',      value: stats.total,     bg: '#FFD93D' },
            { label: 'New',        value: stats.newLeads,  bg: '#C4B5FD' },
            { label: 'High Value', value: stats.highValue, bg: '#FF6B6B' },
            { label: 'Avg Score',  value: stats.avgScore,  bg: '#FFFDF5' },
          ]).map(s => (
            <div key={s.label} className="relative">
              <div className="absolute inset-0 border-2 border-black translate-x-[3px] translate-y-[3px]" style={{ background: s.bg }} />
              <div className="relative border-2 border-black p-3 bg-white text-center">
                <p className="text-base font-black text-black">{s.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-black/50 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={12} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, location…"
              className="neo-input pl-8 text-xs"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="neo-select pr-8 text-xs"
            >
              <option value="">All status</option>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
              <option value="__followup_due">⚡ Follow-up Due</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs">▼</span>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 border-4 border-black bg-white animate-pulse" style={{ boxShadow:'4px 4px 0 #000' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <MessageSquare size={28} className="text-black/30 mx-auto" />
            <p className="text-sm font-black uppercase tracking-wide">
              {search || statusFilter ? 'No matching clients' : 'No intake leads yet'}
            </p>
            <p className="text-xs font-medium text-black/50">
              {!search && !statusFilter && 'Set up call forwarding to your SignalWire number and missed calls will auto-trigger intake.'}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => setShowTrigger(true)}
                className="neo-btn-yellow mt-2 text-xs px-4 py-2">
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
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSaved={load}
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
