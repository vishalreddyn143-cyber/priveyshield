import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { GLOSSARY_TERMS } from '../../utils/categoryTheme';

interface TooltipBadgeProps {
  term: keyof typeof GLOSSARY_TERMS;
  label?: string;
}

export const TooltipBadge: React.FC<TooltipBadgeProps> = ({ term, label }) => {
  const [open, setOpen] = useState(false);
  const definition = GLOSSARY_TERMS[term];
  const tooltipId = `tooltip-desc-${term.replace(/[^a-zA-Z0-9]/g, '_')}`;

  return (
    <span className="relative inline-flex items-center gap-1">
      {label && <span>{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setOpen(false);
          }
        }}
        aria-label={`Explain ${term}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="glass-panel absolute bottom-full left-1/2 z-40 mb-2 w-64 -translate-x-1/2 rounded-xl p-2.5 text-left text-xs font-normal leading-relaxed text-slate-200 shadow-2xl"
        >
          <span className="mb-0.5 block font-semibold text-cyan-300">{term}</span>
          {definition}
        </span>
      )}
    </span>
  );
};
