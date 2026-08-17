'use client';

import { Check } from 'lucide-react';
import { MEMBER_FUNCTIONS } from '@/lib/constants';

/** Seletor de funções em chips (estilo do catálogo de ministério). */
export function FunctionChips({
  selected, onToggle,
}: {
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {MEMBER_FUNCTIONS.map((f) => {
        const isSel = selected.includes(f.key);
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onToggle(f.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.375rem 0.7rem', borderRadius: '9999px',
              fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
              background: isSel ? 'var(--wis-success-bg)' : 'var(--wis-surface-2)',
              color: isSel ? 'var(--wis-success)' : 'var(--wis-text-2)',
              border: `1px solid ${isSel ? '#bfe6d3' : 'var(--wis-border-strong)'}`,
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
            {isSel && <Check style={{ width: '0.7rem', height: '0.7rem' }} />}
          </button>
        );
      })}
    </div>
  );
}
