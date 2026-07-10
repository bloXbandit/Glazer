'use client';

// Printable shop quote — clean white sheet, loads a SAVED quote by id
// (server-computed numbers from SQLite; nothing recalculated client-side).

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ShopQuoteInput, ShopQuoteResult } from '@/lib/shopQuote';

interface SavedQuote {
  id: string;
  created_at: string;
  glass_name: string;
  input: ShopQuoteInput;
  result: ShopQuoteResult;
  client: { id: string; name: string | null; phone: string } | null;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function ShopQuotePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<SavedQuote | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/shop-quote?id=${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setQuote)
      .catch(() => setError('Quote not found'));
  }, [id]);

  useEffect(() => {
    if (quote) {
      // Give fonts/layout a beat, then open the print dialog
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [quote]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-600 text-sm">
      <div className="text-center">
        <p>{error}</p>
        <a href="/shop" className="mt-3 inline-block text-blue-600 underline text-xs">← Back to Shop Quote</a>
      </div>
    </div>
  );

  if (!quote) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-400 text-sm">Loading…</div>
  );

  const { result } = quote;
  const date = new Date(quote.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-8 py-10 print:px-6 print:py-4">

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-black">BALTIMORE GLASS CO.</h1>
            <p className="text-sm text-gray-500 mt-1">Shop Quote · Prepared {date}</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p className="text-sm font-bold text-gray-700">Quote Ref: {quote.id}</p>
            <p>Priced per BGC shop rates</p>
          </div>
        </div>

        {/* Customer */}
        {quote.client && (
          <div className="mb-6 text-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Customer</p>
            <p className="font-semibold">{quote.client.name ?? '—'}</p>
            <p className="text-gray-600">{quote.client.phone}</p>
          </div>
        )}

        {/* Item */}
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Item</p>
          <p className="text-sm font-semibold">{quote.glass_name.replace('BGC — ', '')}</p>
          <p className="text-sm text-gray-600">
            {result.qty} lite{result.qty === 1 ? '' : 's'} · billed {result.rounded_width_in}&quot; × {result.rounded_height_in}&quot;
            · {result.sqft_per_lite.toFixed(2)} sq. ft. per lite ({result.billable_sqft.toFixed(2)} sq. ft. total)
          </p>
        </div>

        {/* Breakdown */}
        <table className="w-full mb-6">
          <tbody>
            {result.lines.map((line, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-2 text-sm">
                  {line.label}
                  {line.note && <span className="block text-xs text-gray-400">{line.note}</span>}
                </td>
                <td className="py-2 text-right text-sm font-semibold tabular-nums">{fmt(line.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="pt-3 text-base font-black uppercase">Total (out the door)</td>
              <td className="pt-3 text-right text-2xl font-black tabular-nums">{fmt(result.total)}</td>
            </tr>
          </tbody>
        </table>

        {/* Notes */}
        {result.warnings.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
            <ul className="list-disc pl-5 text-xs text-gray-600 space-y-0.5">
              {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        <p className="text-[10px] text-gray-400 border-t border-gray-200 pt-3">
          Glass sold by 2&quot; increments (rounded up), minimum 1 sq. ft. per lite. Total includes 6% MD sales
          tax and 5% fuel surcharge. Quote valid 30 days; confirm exact dimensions at order.
        </p>

        <div className="mt-6 print:hidden flex gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded">
            Print again
          </button>
          <a href="/shop" className="px-4 py-2 border border-gray-300 text-xs font-bold rounded text-gray-600">
            ← New quote
          </a>
        </div>
      </div>
    </div>
  );
}
