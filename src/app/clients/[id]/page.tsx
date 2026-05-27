'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Phone, Mail, MapPin, Clock, ArrowLeft, MessageSquare,
  Mic, User, Building, ChevronRight, Edit2, Check, X,
  AlertTriangle, TrendingUp, ExternalLink, Send,
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
  unknown:               'Unknown / TBD',
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? 'text-emerald-400' : s >= 45 ? 'text-blue-400' : s >= 25 ? 'text-purple-400' : 'text-amber-400';

// ── Inline edit field ──────────────────────────────────────────

function EditField({
  label, value, field, onSave,
}: {
  label: string;
  value: string | null | undefined;
  field: string;
  onSave: (field: string, value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');

  async function save() {
    await onSave(field, val);
    setEditing(false);
  }

  return (
    <div className="flex items-start justify-between py-2 border-b border-[#1a1d27] last:border-0">
      <span className="text-xs text-slate-500 w-36 shrink-0 pt-0.5">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            className="flex-1 min-w-0 bg-[#0f1117] border border-brand-500/50 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
          />
          <button onClick={save} className="text-emerald-400 hover:text-emerald-300"><Check size={13} /></button>
          <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-300"><X size={13} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-xs text-slate-200 truncate">{value ?? <span className="text-slate-600 italic">—</span>}</span>
          <button onClick={() => setEditing(true)} className="text-slate-600 hover:text-slate-400 shrink-0">
            <Edit2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient]         = useState<Client | null>(null);
  const [convos, setConvos]         = useState<ConversationMessage[]>([]);
  const [loading, setLoading]       = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError]           = useState('');
  const [smsInput, setSmsInput]     = useState('');
  const [smsSending, setSmsSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) { setError('Client not found'); setLoading(false); return; }
      const data = await res.json();
      setClient(data.client);
      setConvos(data.conversations ?? []);
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
    if (res.ok) { const data = await res.json(); setClient(data); }
  }

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

        {/* Open in Estimator button */}
        {client.glazing_category && client.glazing_category !== 'unknown' && (
          <Link
            href={`/?workType=${client.glazing_category}&location=${encodeURIComponent(client.project_location ?? '')}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            <ExternalLink size={11} />
            Open in Estimator
          </Link>
        )}
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

        {/* Contact info */}
        <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User size={11} /> Contact
          </h2>
          <EditField label="Name"  value={client.name}  field="name"  onSave={saveField} />
          <EditField label="Email" value={client.email} field="email" onSave={saveField} />
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-500 w-36">Phone</span>
            <a href={`tel:${client.phone}`} className="text-xs text-brand-400 hover:underline font-mono flex items-center gap-1">
              <Phone size={10} />
              {client.phone}
            </a>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-500 w-36">Received</span>
            <span className="text-xs text-slate-400">
              {new Date(client.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        </div>

        {/* Project info */}
        <div className="p-4 bg-[#12141c] border border-[#2a2d3a] rounded-xl">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Building size={11} /> Project
          </h2>
          <EditField label="Location"    value={client.project_location} field="project_location" onSave={saveField} />
          <EditField label="Project type" value={client.project_type_raw} field="project_type_raw" onSave={saveField} />
          <div className="flex items-center justify-between py-2 border-b border-[#1a1d27]">
            <span className="text-xs text-slate-500 w-36">Glazing category</span>
            <span className="text-xs text-slate-300">
              {client.glazing_category ? GLAZING_LABELS[client.glazing_category] ?? client.glazing_category : <span className="text-slate-600 italic">—</span>}
            </span>
          </div>
          {newConst && (
            <div className="flex items-center justify-between py-2 border-b border-[#1a1d27]">
              <span className="text-xs text-slate-500 w-36">Construction type</span>
              <span className="text-xs text-slate-300">{newConst}</span>
            </div>
          )}
          <EditField label="Approx. size" value={client.approx_size} field="approx_size" onSave={saveField} />
          <EditField label="Timeline"     value={client.timeline}     field="timeline"     onSave={saveField} />
          <EditField label="Notes"        value={client.notes}        field="notes"        onSave={saveField} />
        </div>

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
            </div>
          </div>
        )}

        {/* Open in Estimator CTA */}
        {client.glazing_category && client.glazing_category !== 'unknown' && (
          <div className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-200">Ready to estimate?</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Opens the estimator pre-loaded with this project's glazing category and location.
              </p>
            </div>
            <Link
              href={`/?workType=${client.glazing_category}&location=${encodeURIComponent(client.project_location ?? '')}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold text-white transition-colors shrink-0 ml-3"
            >
              Estimate <ChevronRight size={12} />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
