'use client';

// SHOP QUOTE — counter-staff quick pricing straight off the BGC price sheet.
// W×H + glass product (+ repair / edge / shape options) → out-the-door price.

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Ruler, Hash, Wrench, Circle, AlertTriangle, Scissors, Save, Check, User, Phone } from 'lucide-react';
import { runShopQuote, getShopGlassProducts } from '@/lib/shopQuote';
import type { ShopQuoteInput, EdgeFinish, RepairLaborType } from '@/lib/shopQuote';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function ShopQuotePage() {
  const products = useMemo(() => getShopGlassProducts(), []);

  const [glassId, setGlassId] = useState('bgc_ds_1_8');
  const [widthIn, setWidthIn] = useState(24);
  const [heightIn, setHeightIn] = useState(36);
  const [qty, setQty] = useState(1);
  const [edgeFinish, setEdgeFinish] = useState<EdgeFinish>('clean_cut');
  const [isRepair, setIsRepair] = useState(false);
  const [repairLabor, setRepairLabor] = useState<RepairLaborType>('push_in_vinyl');
  const [addPutty, setAddPutty] = useState(false);
  const [isShape, setIsShape] = useState(false);

  // Save-to-CRM state — fire-and-forget; quoting never blocks on it
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);

  const selected = products.find(p => p.id === glassId);
  const isHeavy = selected?.bgc_pricing?.method === 'cost_plus';
  const hasPolished = !!selected?.bgc_pricing &&
    selected.bgc_pricing.sell_per_sf_polished !== selected.bgc_pricing.sell_per_sf;

  const quote = useMemo(() => {
    if (!glassId || widthIn <= 0 || heightIn <= 0) return null;
    const input: ShopQuoteInput = {
      glass_type_id: glassId,
      width_in: widthIn,
      height_in: heightIn,
      qty,
      edge_finish: edgeFinish,
      is_repair: isRepair && !isHeavy,
      repair_labor: repairLabor,
      add_putty: addPutty,
      is_shape: isShape,
    };
    try {
      return runShopQuote(input);
    } catch {
      return null;
    }
  }, [glassId, widthIn, heightIn, qty, edgeFinish, isRepair, isHeavy, repairLabor, addPutty, isShape]);

  // CRM handoff — client cards link here as /shop?phone=<e164>&name=<text>
  // so the saved quote auto-links to the existing client record.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get('phone');
    const name = params.get('name');
    if (phone) setCustomerPhone(phone);
    if (name) setCustomerName(name);
  }, []);

  // Any input change invalidates the previous save
  useEffect(() => {
    setSaveState('idle');
    setSavedQuoteId(null);
  }, [glassId, widthIn, heightIn, qty, edgeFinish, isRepair, repairLabor, addPutty, isShape]);

  async function saveQuote() {
    if (!quote || saveState === 'saving') return;
    setSaveState('saving');
    try {
      // Server recomputes from raw inputs — deterministic backend authority
      const res = await fetch('/api/shop-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            glass_type_id: glassId,
            width_in: widthIn,
            height_in: heightIn,
            qty,
            edge_finish: edgeFinish,
            is_repair: isRepair && !isHeavy,
            repair_labor: repairLabor,
            add_putty: addPutty,
            is_shape: isShape,
          },
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSavedQuoteId(data.id);
        setSaveState('saved');
      } else {
        setSaveState('error');
      }
    } catch {
      setSaveState('error');
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] bg-grid">
      {/* Header */}
      <header className="border-b-4 border-black bg-[#FFFDF5] sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-[#FFD93D] border-2 border-black"
              style={{ boxShadow: '3px 3px 0 #000' }}>
              <Scissors size={14} strokeWidth={3} className="text-black" />
            </div>
            <div className="leading-none">
              <span className="block font-black text-black text-[11px] uppercase tracking-[0.12em]">Shop Quote</span>
              <span className="block font-black text-[#FF6B6B] text-[11px] uppercase tracking-[0.12em]">BGC Price Sheet</span>
            </div>
          </div>
          <Link href="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-black bg-white text-black font-bold text-xs uppercase tracking-wide hover:bg-[#C4B5FD] transition-all duration-100"
            style={{ boxShadow: '2px 2px 0 #000' }}>
            <ArrowLeft size={11} strokeWidth={3} /> Estimator
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Inputs ── */}
        <section className="space-y-5 print:hidden">
          <div>
            <label className="neo-label">Glass Product</label>
            <div className="relative">
              <select value={glassId} onChange={e => { setGlassId(e.target.value); setIsShape(false); }}
                className="neo-select pr-8">
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name.replace('BGC — ', '')}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-black text-xs">▼</span>
            </div>
            {selected && (
              <p className="text-[10px] font-bold text-black/50 mt-1.5 uppercase tracking-wide">{selected.description}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="neo-label flex items-center gap-1.5"><Ruler size={12} strokeWidth={3} /> Width (in)</label>
              <input type="number" min={1} value={widthIn || ''}
                onChange={e => setWidthIn(parseFloat(e.target.value) || 0)}
                className="neo-input text-lg" placeholder="24" />
            </div>
            <div>
              <label className="neo-label flex items-center gap-1.5"><Ruler size={12} strokeWidth={3} /> Height (in)</label>
              <input type="number" min={1} value={heightIn || ''}
                onChange={e => setHeightIn(parseFloat(e.target.value) || 0)}
                className="neo-input text-lg" placeholder="36" />
            </div>
            <div>
              <label className="neo-label flex items-center gap-1.5"><Hash size={12} strokeWidth={3} /> Qty</label>
              <input type="number" min={1} value={qty || ''}
                onChange={e => setQty(parseInt(e.target.value) || 1)}
                className="neo-input text-lg" placeholder="1" />
            </div>
          </div>

          {/* Edge finish — only when the product prices polished differently */}
          {!isHeavy && hasPolished && !isRepair && (
            <div>
              <label className="neo-label">Edge Finish</label>
              <div className="flex gap-0">
                {([['clean_cut', 'Clean Cut (CC)'], ['polished', 'Polished (PE)']] as const).map(([val, label], i) => (
                  <button key={val} onClick={() => setEdgeFinish(val)}
                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest border-3 border-black transition-all duration-100
                      ${i === 0 ? '' : '-ml-[3px]'}
                      ${edgeFinish === val ? 'bg-[#FFD93D] text-black z-10 relative' : 'bg-white text-black/50 hover:bg-[#C4B5FD] hover:text-black'}`}
                    style={{ border: '3px solid #000', boxShadow: edgeFinish === val ? '3px 3px 0 #000' : 'none' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Repair toggle — not applicable to heavy cost-plus glass */}
          {!isHeavy && (
            <div>
              <button onClick={() => setIsRepair(!isRepair)} className="relative w-full text-left group outline-none">
                <div className="absolute inset-0 border-3 border-black"
                  style={{ border: '3px solid #000', background: isRepair ? '#FF6B6B' : '#000' }} />
                <div className={`relative border-3 border-black p-3 transition-all duration-150
                  group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] ${isRepair ? 'bg-[#FFFDF5]' : 'bg-white'}`}
                  style={{ border: '3px solid #000' }}>
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 flex items-center justify-center border-2 border-black
                      ${isRepair ? 'bg-black text-[#FFD93D]' : 'bg-white text-black'}`}>
                      <Wrench size={16} strokeWidth={3} />
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-wide">
                        {isRepair ? 'Window Repair — labor + ×1.75 markup' : 'Window Repair Job?'}
                      </p>
                      <p className="text-[10px] font-medium text-black/60">
                        {isRepair ? 'Glass at repair rate + labor per lite, ×1.75, then tax + FSC.' : 'Toggle for onsite/in-shop repair quoting (adds labor and repair markup).'}
                      </p>
                    </div>
                    {isRepair && <span className="text-[9px] font-black bg-[#FFD93D] border border-black px-1">ON</span>}
                  </div>
                </div>
              </button>

              {isRepair && (
                <div className="mt-3 space-y-3 border-2 border-black bg-white p-3" style={{ boxShadow: '3px 3px 0 #000' }}>
                  <div>
                    <label className="neo-label">Glazing Labor</label>
                    <div className="flex gap-0">
                      {([['push_in_vinyl', 'Push-in Vinyl'], ['wrap_around', 'Wrap-Around ($35)']] as const).map(([val, label], i) => (
                        <button key={val} onClick={() => setRepairLabor(val)}
                          className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wide border-3 border-black
                            ${i === 0 ? '' : '-ml-[3px]'}
                            ${repairLabor === val ? 'bg-[#C4B5FD] text-black z-10 relative' : 'bg-white text-black/50 hover:bg-[#FFD93D] hover:text-black'}`}
                          style={{ border: '3px solid #000' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-black/40 mt-1 uppercase tracking-wide">
                      Wrap-around: marine glazing, vinyl replacement windows, patio doors
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={addPutty} onChange={e => setAddPutty(e.target.checked)}
                      className="w-4 h-4 border-2 border-black accent-black" />
                    <span className="text-xs font-black uppercase tracking-wide">Putty glazing (+$30/lite)</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Shape toggle */}
          <button onClick={() => setIsShape(!isShape)} className="relative w-full text-left group outline-none">
            <div className="absolute inset-0 border-3 border-black"
              style={{ border: '3px solid #000', background: isShape ? '#C4B5FD' : '#000' }} />
            <div className={`relative border-3 border-black p-3 transition-all duration-150
              group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] ${isShape ? 'bg-[#FFFDF5]' : 'bg-white'}`}
              style={{ border: '3px solid #000' }}>
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 flex items-center justify-center border-2 border-black
                  ${isShape ? 'bg-black text-[#FFD93D]' : 'bg-white text-black'}`}>
                  <Circle size={16} strokeWidth={3} />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-wide">
                    {isShape ? 'Shape (oval / circle) — Bel Pre' : 'Shape? (oval / circle)'}
                  </p>
                  <p className="text-[10px] font-medium text-black/60">
                    {isHeavy
                      ? 'Bel Pre shape pricing: $6.75/sqft + $0.14/in edge, ×1.35 shape charge. Enter diameter as W and H for circles.'
                      : 'Shapes for this glass are quoted by email (Bel Pre / OBE).'}
                  </p>
                </div>
                {isShape && <span className="text-[9px] font-black bg-[#FFD93D] border border-black px-1">ON</span>}
              </div>
            </div>
          </button>
        </section>

        {/* ── Quote ── */}
        <section>
          {quote ? (
            <div className="neo-card bg-white p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/50">Out-the-door price</p>
                  <p className="text-5xl font-black tabular-nums mt-1">{fmt(quote.total)}</p>
                  {quote.floor_total !== undefined && (
                    <p className="text-xs font-bold text-black/60 mt-1">
                      Floor if customer pushes back (×1.85): <span className="font-black">{fmt(quote.floor_total)}</span>
                    </p>
                  )}
                </div>
                {savedQuoteId ? (
                  <Link href={`/shop/print/${savedQuoteId}`}
                    className="neo-btn-yellow flex items-center gap-1.5 text-xs px-3 py-2 print:hidden">
                    <Printer size={12} strokeWidth={3} /> Print
                  </Link>
                ) : (
                  <button onClick={() => window.print()}
                    className="neo-btn-yellow flex items-center gap-1.5 text-xs px-3 py-2 print:hidden">
                    <Printer size={12} strokeWidth={3} /> Print
                  </button>
                )}
              </div>

              <div className="border-2 border-black bg-[#FFD93D] px-3 py-2 text-xs font-bold"
                style={{ boxShadow: '3px 3px 0 #000' }}>
                {quote.qty} lite{quote.qty === 1 ? '' : 's'} · billed {quote.rounded_width_in}&quot; × {quote.rounded_height_in}&quot;
                (2&quot; increments) · {quote.sqft_per_lite.toFixed(2)} sqft/lite · {quote.billable_sqft.toFixed(2)} sqft total
              </div>

              <table className="w-full">
                <tbody>
                  {quote.lines.map((line, i) => (
                    <tr key={i} className="border-b-2 border-black/10">
                      <td className="py-1.5 pr-2 text-xs font-bold">
                        {line.label}
                        {line.note && <span className="block text-[10px] font-medium text-black/50">{line.note}</span>}
                      </td>
                      <td className="py-1.5 text-right text-sm font-black tabular-nums">{fmt(line.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-2 text-xs font-black uppercase tracking-widest">Total</td>
                    <td className="pt-2 text-right text-xl font-black tabular-nums">{fmt(quote.total)}</td>
                  </tr>
                </tbody>
              </table>

              {quote.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {quote.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 border-2 border-black bg-[#FF6B6B]/20 px-3 py-2">
                      <AlertTriangle size={12} strokeWidth={3} className="mt-0.5 shrink-0" />
                      <p className="text-[11px] font-bold">{warning}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Save to CRM — optional customer info, background save */}
              <div className="border-t-3 border-black pt-3 space-y-2 print:hidden" style={{ borderTop: '3px solid #000' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-black/50">Save quote (optional customer)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User size={12} strokeWidth={3} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40" />
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                      placeholder="Name" className="neo-input text-sm pl-8" />
                  </div>
                  <div className="relative">
                    <Phone size={12} strokeWidth={3} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40" />
                    <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="Phone (links to CRM)" className="neo-input text-sm pl-8" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={saveQuote} disabled={saveState === 'saving' || saveState === 'saved'}
                    className={`flex items-center gap-1.5 px-4 py-2 border-3 border-black text-xs font-black uppercase tracking-wide transition-all duration-100
                      ${saveState === 'saved' ? 'bg-[#C4B5FD]' : 'bg-[#FF6B6B] hover:-translate-x-[1px] hover:-translate-y-[1px]'}`}
                    style={{ border: '3px solid #000', boxShadow: '3px 3px 0 #000' }}>
                    {saveState === 'saved'
                      ? <><Check size={12} strokeWidth={3} /> Saved</>
                      : saveState === 'saving'
                        ? 'Saving…'
                        : <><Save size={12} strokeWidth={3} /> Save Quote</>}
                  </button>
                  {saveState === 'saved' && savedQuoteId && (
                    <span className="text-[10px] font-bold text-black/50 uppercase tracking-wide">
                      Ref {savedQuoteId}{customerPhone ? ' · linked to client' : ''}
                    </span>
                  )}
                  {saveState === 'error' && (
                    <span className="text-[10px] font-black text-[#FF6B6B] uppercase tracking-wide">Save failed — retry</span>
                  )}
                </div>
              </div>

              <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide">
                Deterministic — Baltimore Glass Co. price sheet. Min 1 sqft/lite, dims rounded up to 2&quot;.
                Server re-prices on save.
              </p>
            </div>
          ) : (
            <div className="neo-card bg-white p-8 text-center">
              <p className="text-sm font-black uppercase tracking-wide text-black/40">
                Enter width, height, and quantity to price
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
