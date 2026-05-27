'use client';
import { useEffect, useState } from 'react';
import type { EstimatePacket } from '@/types';

export default function PrintPage() {
  const [packet, setPacket] = useState<EstimatePacket | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('glaze_print_packet');
    if (stored) {
      try { setPacket(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  if (!packet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No estimate data found.</p>
          <p className="text-sm text-gray-400">Navigate here from the estimator results page.</p>
          <a href="/" className="mt-4 inline-block text-blue-600 underline text-sm">← Back to Estimator</a>
        </div>
      </div>
    );
  }

  const { result, confidence, risk_flags, assumptions, exclusions } = packet;
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const date = new Date(packet.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white text-gray-900 min-h-screen print:p-0">
      <div className="max-w-4xl mx-auto px-8 py-10 print:px-6 print:py-4">

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">GLAZING ESTIMATE</h1>
            <p className="text-sm text-gray-500 mt-1">{packet.mode} Estimate · Prepared {date}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-700">GlazePro Estimating Platform</p>
            <p className="text-xs text-gray-400">DMV Commercial Glazing · RSMeans 2024</p>
            <p className="text-xs text-gray-400">Ref: {packet.id}</p>
          </div>
        </div>

        {/* Project summary */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Scope</p>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['System', packet.work_type_name],
                  ['Glass Type', packet.glass_type_name],
                  ['Quantity', `${packet.total_sf.toLocaleString()} SF${packet.num_openings > 0 ? ` / ${packet.num_openings} openings` : ''}`],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-100">
                    <td className="py-1 text-gray-500 w-1/3">{k}</td>
                    <td className="py-1 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Conditions</p>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Region', packet.region_name],
                  ['Project Type', packet.project_type_label],
                  ['Work Condition', packet.work_condition_label],
                  ['Access', packet.access_condition_label],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-100">
                    <td className="py-1 text-gray-500 w-1/3">{k}</td>
                    <td className="py-1 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost breakdown table */}
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cost Breakdown</p>
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider">Item</th>
                <th className="text-right px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider">$/SF</th>
                <th className="text-right px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {result.line_items.map((item, i) => (
                <tr key={i} className={`border-t border-gray-100 ${item.category === 'markup' ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-3 py-2">
                    <span className={item.category === 'markup' ? 'text-gray-500' : 'text-gray-800 font-medium'}>{item.label}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500 tabular-nums">
                    {item.per_sf ? `$${item.per_sf.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-800">
                    {fmt(item.adjusted_value)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-900 bg-gray-50">
                <td colSpan={2} className="px-3 py-3 font-black text-gray-900 text-base">TOTAL CONTRACT VALUE</td>
                <td className="px-3 py-3 text-right font-black text-xl text-gray-900 tabular-nums">{fmt(result.grand_total)}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td colSpan={2} className="px-3 py-1.5 text-xs text-gray-400">Effective rate</td>
                <td className="px-3 py-1.5 text-right text-sm font-bold text-gray-600 tabular-nums">${result.effective_per_sf.toFixed(2)}/SF</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Confidence + Market Position */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-200 rounded p-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black tabular-nums ${
                confidence.level === 'High' ? 'text-emerald-600' :
                confidence.level === 'Medium' ? 'text-amber-600' : 'text-red-600'
              }`}>{confidence.score}/100</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                confidence.level === 'High' ? 'bg-emerald-100 text-emerald-700' :
                confidence.level === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
              }`}>{confidence.level}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{confidence.summary}</p>
          </div>
          <div className="border border-gray-200 rounded p-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Market Position</p>
            <p className="text-lg font-black text-gray-800">{result.market_position}</p>
            <p className="text-xs text-gray-500 mt-1">
              Benchmark: ${result.benchmark_low}–${result.benchmark_high}/SF · Your rate: <strong>${result.effective_per_sf.toFixed(0)}/SF</strong>
            </p>
          </div>
        </div>

        {/* Risk flags */}
        {risk_flags.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Risk Flags ({risk_flags.length})</p>
            <div className="space-y-2">
              {risk_flags.map(f => (
                <div key={f.id} className={`border rounded px-3 py-2 text-sm ${
                  f.severity === 'Critical' ? 'border-red-300 bg-red-50' :
                  f.severity === 'High' ? 'border-orange-300 bg-orange-50' :
                  f.severity === 'Medium' ? 'border-amber-200 bg-amber-50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <span className="font-bold text-xs uppercase tracking-wider mr-2">[{f.severity}]</span>
                  <span className="text-gray-800">{f.message}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">→ {f.recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-column: assumptions + exclusions */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
          <div>
            <p className="font-bold text-gray-400 uppercase tracking-wider mb-2">Assumptions</p>
            <ul className="space-y-1">
              {assumptions.map((a, i) => (
                <li key={i} className="flex gap-1.5 text-gray-600"><span className="text-gray-300 flex-shrink-0">•</span>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-gray-400 uppercase tracking-wider mb-2">Exclusions</p>
            <ul className="space-y-1">
              {exclusions.map((e, i) => (
                <li key={i} className="flex gap-1.5 text-gray-600"><span className="text-gray-300 flex-shrink-0">•</span>{e}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 flex justify-between">
          <span>This estimate is for budgeting and bidding purposes only. Subject to field verification and final scope review.</span>
          <span className="print:hidden">
            <button onClick={() => window.print()} className="text-blue-600 underline ml-4">Print</button>
          </span>
        </div>
      </div>
    </div>
  );
}
