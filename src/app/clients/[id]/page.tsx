'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Phone, Mail, MapPin, Clock, ArrowLeft, MessageSquare,
  Mic, User, Building, ChevronRight, Check,
  AlertTriangle, TrendingUp, ExternalLink, Send, Receipt, Printer,
  FileText, Upload, Download, Calculator,
} from 'lucide-react';
import InfoTip from '@/components/InfoTip';

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
  notes: string | null;
  status: string;
  lead_score: number;
  lead_score_label: string;
  contact_type: string;
  created_at: string;
  updated_at: string;
}

interface ConversationMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  created_at: string;
}

interface ShopQuoteSummary {
  id: string;
  glass_name: string;
  total: number;
  created_at: string;
}

interface ClientDocMeta {
  id: string;
  doc_type: string;
  title: string;
  filename: string;
  mime: string;
  size_bytes: number;
  doc_date: string | null;
  notes: string | null;
  created_at: string;
}

interface EstimateSummary {
  id: string;
  work_type: string;
  region: string;
  total_sf: number;
  grand_total: number;
  status: string;
  created_at: string;
}

const DOC_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  contract:     { label: 'Contract',     color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  accepted_bid: { label: 'Accepted Bid', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
  estimate:     { label: 'Estimate',     color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
  other:        { label: 'Document',     color: 'text-slate-400 border-slate-500/40 bg-slate-500/10' },
};

const fmtBytes = (n: number) =>
  n >= 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

const editInputCls = 'w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500';
const editLabelCls = 'flex items-center text-[10px] text-slate-500 mb-1 uppercase tracking-wide font-medium';

// ── Status config ──────────────────────────────────────────────

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost', 'archived'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new:       { label: 'New',       color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  contacted: { label: 'Contacted', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  quoted:    { label: 'Quoted',    color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
  won:       { label: 'Won',       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  lost:      { label: 'Lost',      color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30' },
  archived:  { label: 'Archived',  color: 'text-slate-600',   bg: 'bg-slate-800/30',   border: 'border-slate-700/30' },
};

const GLAZING_LABELS: Record<string, string> = {
  storefront:            'Storefront',
  stick_curtain_wall:    'Stick Curtain Wall',
  unitized_curtain_wall: 'Unitized Curtain Wall',
  window_wall:           'Window Wall',
  interior_partition:    'Interior Partition',
  glass_railing:         'Glass Railing',
  skylight:              'Skylight',
  fire_rated:            'Fire-Rated Glazing',
  blast_security:        'Blast / Security',
  residential_window:    'Residential Window & Door',
  decorative_glass:      'Decorative / Shop Glass',
  unknown:               'Unknown / TBD',
};

// Retail/shop categories quote through /shop (BGC price sheet),
// not the commercial SF estimator.
const RETAIL_CATEGORIES = ['residential_window', 'decorative_glass'];

const SCORE_COLOR = (s: number) =>
  s >= 70 ? 'text-emerald-400' : s >= 45 ? 'text-blue-400' : s >= 25 ? 'text-purple-400' : 'text-amber-400';


// ── Main page ──────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient]         = useState<Client | null>(null);
  const [convos, setConvos]         = useState<ConversationMessage[]>([]);
  const [quotes, setQuotes]         = useState<ShopQuoteSummary[]>([]);
  const [documents, setDocuments]   = useState<ClientDocMeta[]>([]);
  const [estimates, setEstimates]   = useState<EstimateSummary[]>([]);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError]     = useState('');
  const [docType, setDocType]       = useState('contract');
  const [docTitle, setDocTitle]     = useState('');
  const [docDate, setDocDate]       = useState('');
  const [loading, setLoading]       = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError]           = useState('');
  const [smsInput, setSmsInput]     = useState('');
  const [smsSending, setSmsSending] = useState(false);

  // Editable client fields — one Save Changes button persists all edits.
  const EDIT_FIELDS = ['name', 'email', 'project_location', 'project_type_raw', 'glazing_category', 'approx_size', 'timeline', 'notes'] as const;
  type EditForm = Record<(typeof EDIT_FIELDS)[number], string>;
  const emptyEdit: EditForm = { name: '', email: '', project_location: '', project_type_raw: '', glazing_category: '', approx_size: '', timeline: '', notes: '' };
  const [edit, setEdit] = useState<EditForm>(emptyEdit);
  const [savingEdits, setSavingEdits] = useState(false);
  const [editsSaved, setEditsSaved] = useState(false);

  const seedEdit = (c: Client) => {
    const next = { ...emptyEdit };
    for (const f of EDIT_FIELDS) next[f] = (c[f as keyof Client] as string | null) ?? '';
    setEdit(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) { setError('Client not found'); setLoading(false); return; }
      const data = await res.json();
      setClient(data.client);
      seedEdit(data.client);
      setConvos(data.conversations ?? []);
      setQuotes(data.quotes ?? []);
      setDocuments(data.documents ?? []);
      setEstimates(data.estimates ?? []);
    } catch { setError('Failed to load'); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function saveField(field: string, value: string) {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) { const data = await res.json(); setClient(data); seedEdit(data); }
  }

  async function saveEdits() {
    if (!client) return;
    setSavingEdits(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edit),
      });
      if (res.ok) {
        const data = await res.json();
        setClient(data);
        seedEdit(data);
        setEditsSaved(true);
        setTimeout(() => setEditsSaved(false), 2500);
      }
    } catch { /* keep edits in the form for retry */ }
    setSavingEdits(false);
  }

  const editDirty = !!client && EDIT_FIELDS.some(f => edit[f] !== ((client[f as keyof Client] as string | null) ?? ''));

  async function setStatus(status: string) {
    setStatusSaving(true);
    await saveField('status', status);
    setStatusSaving(false);
  }

  async function sendFollowUp() {
    if (!smsInput.trim() || !client) return;
    setSmsSending(true);
    try {
      const res = await fetch('/api/intake/trigger-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: client.phone, force: true }),
      });
      const data = await res.json();
      if (data.ok) { setSmsInput(''); load(); }
    } catch { /* no-op */ }
    setSmsSending(false);
  }

  async function uploadDocument(file: File) {
    if (!client) return;
    setDocUploading(true);
    setDocError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('client_id', client.id);
      form.append('doc_type', docType);
      if (docTitle.trim()) form.append('title', docTitle.trim());
      if (docDate) form.append('doc_date', docDate);
      const res = await fetch('/api/client-docs', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDocTitle(''); setDocDate('');
        load();
      } else {
        setDocError(data.error ?? 'Upload failed');
      }
    } catch {
      setDocError('Upload failed');
    }
    setDocUploading(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (error || !client) return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-slate-500 text-sm">
      <div className="text-center space-y-3">
        <AlertTriangle size={24} className="mx-auto text-amber-400" />
        <p>{error || 'Client not found'}</p>
        <Link href="/clients" className="text-brand-400 hover:underline text-xs">← Back to clients</Link>
      </div>
    </div>
  );

  const status = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.new;
  const newConst = client.new_construction === 1 ? 'New Construction'
    : client.new_construction === 0 ? 'Renovation / Replacement'
    : null;

  // Route to the right pricing tool: retail categories → /shop (BGC sheet,
  // prefilled so the quote auto-links to this client); commercial → estimator.
  const isRetail = RETAIL_CATEGORIES.includes(client.glazing_category ?? '');
  const knownCategory = client.glazing_category && client.glazing_category !== 'unknown' ? client.glazing_category : '';
  // Carry the client's identity into the quoting tool so the resulting
  // quote/estimate auto-links back to this record (by phone).
  const idParams = `clientId=${encodeURIComponent(client.id)}&name=${encodeURIComponent(client.name ?? '')}&phone=${encodeURIComponent(client.phone)}`;
  const quoteHref = isRetail
    ? `/shop?${idParams}`
    : `/?workType=${knownCategory}&location=${encodeURIComponent(client.project_location ?? '')}&${idParams}`;
  const quoteLabel = isRetail ? 'Shop Quote' : knownCategory ? 'Start Estimate' : 'Estimate (classify)';

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0a0c10]/95 backdrop-blur border-b border-[#1a1d27] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            <span className="text-xs">Clients</span>
          </Link>
          <h1 className="text-sm font-bold text-slate-100 truncate max-w-[200px]">
            {client.name ?? client.phone}
          </h1>
        </div>

        {/* Quote action — always available; routes retail→shop, else→estimator */}
        <Link
          href={quoteHref}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold text-white transition-colors shrink-0"
        >
          <ExternalLink size={11} />
          {quoteLabel}
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Lead score + status */}
        <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className={SCORE_COLOR(client.lead_score)} />
              <span className={`text-base font-bold ${SCORE_COLOR(client.lead_score)}`}>
                {client.lead_score}/100
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${SCORE_COLOR(client.lead_score)} bg-slate-800/50 border-slate-700/30`}>
                {client.lead_score_label}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              {client.contact_type === 'voice' ? <Mic size={10} /> : <MessageSquare size={10} />}
              {client.contact_type} intake
            </div>
          </div>

          {/* Score bar */}
          <div className="w-full h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                client.lead_score >= 70 ? 'bg-emerald-500' :
                client.lead_score >= 45 ? 'bg-blue-500' :
                client.lead_score >= 25 ? 'bg-purple-500' : 'bg-amber-500'
              }`}
              style={{ width: `${client.lead_score}%` }}
            />
          </div>

          {/* Status selector */}
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map(s => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  disabled={statusSaving}
                  className={`text-[10px] px-2.5 py-1 rounded border font-medium transition-all ${
                    client.status === s
                      ? `${c.color} ${c.bg} ${c.border}`
                      : 'text-slate-600 border-[#2a2d3a] hover:text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact — editable */}
        <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <User size={11} /> Contact
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={editLabelCls}>Name</label>
              <input className={editInputCls} value={edit.name} onChange={e => setEdit(v => ({ ...v, name: e.target.value }))} placeholder="—" />
            </div>
            <div>
              <label className={editLabelCls}>Email</label>
              <input className={editInputCls} type="email" value={edit.email} onChange={e => setEdit(v => ({ ...v, email: e.target.value }))} placeholder="—" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Phone</span>
            <a href={`tel:${client.phone}`} className="text-xs text-brand-400 hover:underline font-mono flex items-center gap-1">
              <Phone size={10} /> {client.phone}
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Received</span>
            <span className="text-xs text-slate-400">
              {new Date(client.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        </div>

        {/* Project — editable */}
        <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Building size={11} /> Project
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={editLabelCls}>Location</label>
              <input className={editInputCls} value={edit.project_location} onChange={e => setEdit(v => ({ ...v, project_location: e.target.value }))} placeholder="—" />
            </div>
            <div>
              <label className={editLabelCls}>Project type</label>
              <input className={editInputCls} value={edit.project_type_raw} onChange={e => setEdit(v => ({ ...v, project_type_raw: e.target.value }))} placeholder="—" />
            </div>
            <div className="col-span-2">
              <label className={editLabelCls}>
                Glazing category
                <InfoTip dark tip="Sets which quoting tool the Estimate button opens: retail categories (Residential Window, Decorative/Shop) go to the shop quote screen; commercial categories go to the estimator. Classify 'unknown' leads here." />
              </label>
              <select className={editInputCls} value={edit.glazing_category} onChange={e => setEdit(v => ({ ...v, glazing_category: e.target.value }))}>
                <option value="">— Unclassified —</option>
                {Object.entries(GLAZING_LABELS).filter(([k]) => k !== 'unknown').map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
            {newConst && (
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Construction type</span>
                <span className="text-xs text-slate-300">{newConst}</span>
              </div>
            )}
            <div>
              <label className={editLabelCls}>Approx. size</label>
              <input className={editInputCls} value={edit.approx_size} onChange={e => setEdit(v => ({ ...v, approx_size: e.target.value }))} placeholder="—" />
            </div>
            <div>
              <label className={editLabelCls}>Timeline</label>
              <input className={editInputCls} value={edit.timeline} onChange={e => setEdit(v => ({ ...v, timeline: e.target.value }))} placeholder="—" />
            </div>
            <div className="col-span-2">
              <label className={editLabelCls}>Notes</label>
              <textarea className={`${editInputCls} resize-y`} rows={2} value={edit.notes} onChange={e => setEdit(v => ({ ...v, notes: e.target.value }))} placeholder="—" />
            </div>
          </div>

          {/* Save Changes — persists all edits above */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#2a2d3a]">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              {editsSaved ? <span className="text-emerald-400 flex items-center gap-1"><Check size={11} /> Saved</span>
                : editDirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
            <button
              onClick={saveEdits}
              disabled={!editDirty || savingEdits}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors"
            >
              <Check size={12} /> {savingEdits ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Sent estimates */}
        {estimates.length > 0 && (
          <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Calculator size={11} /> Sent Estimates ({estimates.length})
            </h2>
            <div className="space-y-2">
              {estimates.map(est => (
                <div key={est.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-[#1a1d27] border border-[#2a2d3a] rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-200 truncate">{est.work_type} · {est.region}</p>
                    <p className="text-[10px] text-slate-500">
                      {est.total_sf.toLocaleString()} SF · {new Date(est.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })} · Ref {est.id}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums shrink-0">
                    {est.grand_total.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents — contracts, accepted bids, historical files */}
        <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <FileText size={11} /> Documents ({documents.length})
            <InfoTip dark tip="Contracts, accepted bids, and historical files stored on this client — searchable by looking up the client, sorted by document date." />
          </h2>

          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map(doc => {
                const dt = DOC_TYPE_LABELS[doc.doc_type] ?? DOC_TYPE_LABELS.other;
                return (
                  <div key={doc.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 bg-[#1a1d27] border border-[#2a2d3a] rounded-lg">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-200 truncate">{doc.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {doc.doc_date ? `${doc.doc_date} · ` : ''}{fmtBytes(doc.size_bytes)} · {doc.filename}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${dt.color}`}>{dt.label}</span>
                      <a href={`/api/client-docs?id=${doc.id}`} download
                        className="text-slate-500 hover:text-slate-300 transition-colors" title="Download">
                        <Download size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload */}
          <div className="pt-2 border-t border-[#2a2d3a] space-y-2">
            <div className="flex flex-wrap gap-2">
              <select value={docType} onChange={e => setDocType(e.target.value)}
                className="bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none">
                <option value="contract">Contract</option>
                <option value="accepted_bid">Accepted Bid</option>
                <option value="estimate">Estimate</option>
                <option value="other">Other</option>
              </select>
              <input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="Title (optional — defaults to filename)"
                className="flex-1 min-w-[160px] bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none" />
              <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)}
                className="bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none" />
            </div>
            <label className={`flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed rounded-lg text-xs cursor-pointer transition-colors
              ${docUploading ? 'border-slate-700 text-slate-600' : 'border-[#2a2d3a] text-slate-400 hover:border-brand-500/40 hover:text-slate-200'}`}>
              <Upload size={12} />
              {docUploading ? 'Uploading…' : 'Upload contract / accepted bid / document (PDF, Word, Excel, image — max 10 MB)'}
              <input type="file" className="hidden" disabled={docUploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocument(f); e.target.value = ''; }} />
            </label>
            {docError && <p className="text-[10px] text-red-400">{docError}</p>}
          </div>
        </div>

        {/* Shop quotes */}
        {quotes.length > 0 && (
          <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Receipt size={11} /> Shop Quotes ({quotes.length})
            </h2>
            <div className="space-y-2">
              {quotes.map(q => (
                <div key={q.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-[#1a1d27] border border-[#2a2d3a] rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-200 truncate">{q.glass_name.replace('BGC — ', '')}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(q.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      {' · '}Ref {q.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">
                      {q.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                    <Link href={`/shop/print/${q.id}`} target="_blank"
                      className="text-slate-500 hover:text-slate-300 transition-colors" title="Print quote">
                      <Printer size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation history */}
        {convos.length > 0 && (
          <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare size={11} /> Conversation
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {convos.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.direction === 'outbound'
                      ? 'bg-brand-600/20 border border-brand-500/30 text-slate-200'
                      : 'bg-[#1a1d27] border border-[#2a2d3a] text-slate-300'
                  }`}>
                    <p>{msg.body}</p>
                    <p className={`text-[9px] mt-1 ${msg.direction === 'outbound' ? 'text-brand-400/60' : 'text-slate-600'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Follow-up trigger */}
            <div className="flex gap-2 pt-2 border-t border-[#2a2d3a]">
              <button
                onClick={sendFollowUp}
                disabled={smsSending}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1d27] border border-[#2a2d3a] hover:border-brand-500/40 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
              >
                <Send size={11} />
                {smsSending ? 'Sending…' : 'Re-trigger intake SMS'}
              </button>
              <InfoTip dark side="top" align="right" tip="Sends the first intake question again and restarts the SMS conversation from step 1 — use when a lead went quiet mid-intake." />
            </div>
          </div>
        )}

        {/* Quote CTA — always available; routes retail→shop, else→estimator */}
        <div className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-200">
              {isRetail ? 'Ready to quote?' : knownCategory ? 'Ready to estimate?' : 'Start an estimate'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRetail
                ? 'Opens the shop quote screen with this customer prefilled — the saved quote links back here.'
                : knownCategory
                  ? "Opens the estimator pre-loaded with this project's scope and location — the finished estimate links back here."
                  : 'Opens the estimator for this customer. Set a glazing category above to pre-load the scope.'}
            </p>
          </div>
          <Link
            href={quoteHref}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold text-white transition-colors shrink-0 ml-3"
          >
            {isRetail ? 'Quote' : 'Estimate'} <ChevronRight size={12} />
          </Link>
        </div>
      </main>
    </div>
  );
}
