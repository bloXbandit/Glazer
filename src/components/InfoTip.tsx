'use client';

// InfoTip — a small "?" circle that reveals a short explainer bubble.
// Desktop: hover (or click). Mobile: tap toggles; press-and-hold also works.
// Deliberately tiny and inert — never affects layout or intercepts flow.

import { useState, useRef, useEffect, useCallback } from 'react';

interface InfoTipProps {
  tip: string;
  /** Which side the bubble opens toward. Default 'top'. */
  side?: 'top' | 'bottom';
  /** Horizontal alignment of the bubble relative to the icon. Default 'center'. */
  align?: 'center' | 'left' | 'right';
  /** Render on dark backgrounds (clients pages). */
  dark?: boolean;
}

export default function InfoTip({ tip, side = 'top', align = 'center', dark = false }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside tap/click
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  const startHold = useCallback(() => {
    holdTimer.current = setTimeout(() => setOpen(true), 350);
  }, []);
  const cancelHold = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  }, []);

  const alignClass =
    align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  const sideClass = side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5';

  return (
    <span ref={rootRef} className="relative inline-flex align-middle ml-1.5">
      <button
        type="button"
        aria-label="What does this do?"
        aria-expanded={open}
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        className={`flex items-center justify-center w-[15px] h-[15px] rounded-full border font-black text-[9px] leading-none select-none cursor-help transition-colors
          ${dark
            ? 'border-slate-500 text-slate-400 hover:border-slate-300 hover:text-slate-200 bg-transparent'
            : 'border-black/60 text-black/60 hover:border-black hover:text-black hover:bg-[#FFD93D] bg-white'}`}
      >
        ?
      </button>

      {open && (
        <span
          role="tooltip"
          className={`absolute z-[60] ${sideClass} ${alignClass} w-56 max-w-[75vw] p-2.5 text-left normal-case
            text-[11px] font-medium leading-relaxed tracking-normal neo-slide-in pointer-events-none
            ${dark
              ? 'bg-[#1a1d27] text-slate-200 border border-slate-600 rounded-lg shadow-lg'
              : 'bg-white text-black border-2 border-black'}`}
          style={dark ? undefined : { boxShadow: '3px 3px 0 #000' }}
        >
          {tip}
        </span>
      )}
    </span>
  );
}
