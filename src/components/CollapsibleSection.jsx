import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * A compact disclosure for dense, secondary dashboard content. Important
 * headline balances remain outside this component; only details that take
 * meaningful vertical space on a phone are collapsible.
 */
export default function CollapsibleSection({ title, summary, defaultOpen = false, children, style = {} }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="luxe-card" style={{ padding: 0, overflow: 'hidden', ...style }}>
      <button
        type="button"
        onClick={() => setIsOpen(current => !current)}
        aria-expanded={isOpen}
        style={{
          width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
          padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, color: '#0F172A', textAlign: 'left'
        }}
      >
        <span>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 900 }}>{title}</span>
          {summary && <span style={{ display: 'block', marginTop: 2, color: '#64748B', fontSize: 11, fontWeight: 700 }}>{summary}</span>}
        </span>
        <span style={{ width: 30, height: 30, borderRadius: 10, background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {isOpen && <div style={{ padding: '0 16px 16px' }}>{children}</div>}
    </section>
  );
}
