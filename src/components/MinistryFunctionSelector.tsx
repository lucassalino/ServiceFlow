'use client';

import { Check } from 'lucide-react';
import { resolveFunction } from '@/lib/constants';

export interface SelectorMinistry {
  id: string;
  name: string;
  icon: string;
  functions: string[];
}

/**
 * Seletor "ministérios → funções": mostra os ministérios da organização; ao
 * selecionar um, aparecem apenas as funções desse ministério para escolher.
 * `value` é um mapa ministryId -> funções escolhidas (só ministérios
 * selecionados estão presentes).
 */
export function MinistryFunctionSelector({
  ministries, value, onToggleMinistry, onToggleFunction,
}: {
  ministries: SelectorMinistry[];
  value: Record<string, string[]>;
  onToggleMinistry: (ministry: SelectorMinistry) => void;
  onToggleFunction: (ministryId: string, fnKey: string) => void;
}) {
  if (ministries.length === 0) {
    return <p className="text-xs text-muted-foreground">Esta organização ainda não tem ministérios.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Ministérios (chips) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {ministries.map((m) => {
          const sel = m.id in value;
          return (
            <button key={m.id} type="button" onClick={() => onToggleMinistry(m)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.75rem', borderRadius: '9999px',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: sel ? 'var(--wis-blue-soft)' : 'var(--wis-surface-2)',
                color: sel ? 'var(--wis-blue)' : 'var(--wis-text-2)',
                border: `1px solid ${sel ? 'var(--wis-blue-border)' : 'var(--wis-border-strong)'}`,
              }}>
              <span>{m.icon}</span>
              <span>{m.name}</span>
              {sel && <Check style={{ width: '0.72rem', height: '0.72rem' }} />}
            </button>
          );
        })}
      </div>

      {/* Funções de cada ministério selecionado */}
      {ministries.filter((m) => m.id in value).map((m) => {
        const chosen = value[m.id] ?? [];
        const available = (m.functions ?? []).map((k) => resolveFunction(k));
        return (
          <div key={m.id} style={{
            padding: '0.85rem', borderRadius: '0.75rem',
            background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
          }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--wis-text)', marginBottom: '0.6rem' }}>
              <span style={{ marginRight: '0.35rem' }}>{m.icon}</span>{m.name} — funções
            </p>
            {available.length === 0 ? (
              <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)' }}>
                Este ministério não tem funções definidas.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {available.map((f) => {
                  const isSel = chosen.includes(f.key);
                  return (
                    <button key={f.key} type="button" onClick={() => onToggleFunction(m.id, f.key)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.35rem 0.65rem', borderRadius: '9999px',
                        fontSize: '0.76rem', fontWeight: 500, cursor: 'pointer',
                        background: isSel ? 'var(--wis-success-bg)' : 'var(--wis-surface-2)',
                        color: isSel ? 'var(--wis-success)' : 'var(--wis-text-2)',
                        border: `1px solid ${isSel ? '#bfe6d3' : 'var(--wis-border-strong)'}`,
                      }}>
                      <span>{f.emoji}</span><span>{f.label}</span>
                      {isSel && <Check style={{ width: '0.66rem', height: '0.66rem' }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
