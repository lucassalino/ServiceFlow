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
              background: isSel ? 'rgba(110,231,183,0.13)' : 'rgba(255,255,255,0.05)',
              color: isSel ? '#6ee7b7' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${isSel ? 'rgba(110,231,183,0.35)' : 'rgba(255,255,255,0.1)'}`,
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
