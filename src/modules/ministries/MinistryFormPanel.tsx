'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateMinistry, useUpdateMinistry } from '@/hooks/useMinistries';
import {
  MEMBER_FUNCTIONS, MINISTRY_COLORS,
  FUNCTION_ICON_CHOICES, encodeCustomFunction, isCustomFunction, getFunctionLabel, getFunctionEmoji,
} from '@/lib/constants';
import type { Ministry } from '@/types/models';

interface Props {
  ministry?: Ministry | null;
  onBack: () => void;
}

export function MinistryFormPanel({ ministry, onBack }: Props) {
  const isEdit = !!ministry;
  const createMinistry = useCreateMinistry();
  const updateMinistry = useUpdateMinistry();

  // O ícone do ministério deixou de ser escolhido — os cartões usam a inicial do nome.
  const icon = ministry?.icon ?? '🎵';

  const [name, setName] = useState(ministry?.name ?? '');
  const [color, setColor] = useState(ministry?.color ?? MINISTRY_COLORS[1]);
  const [functions, setFunctions] = useState<string[]>(ministry?.functions ?? []);

  // Estado do formulário de função personalizada
  const [customLabel, setCustomLabel] = useState('');
  const [customEmoji, setCustomEmoji] = useState(FUNCTION_ICON_CHOICES[0]);

  const saving = createMinistry.isPending || updateMinistry.isPending;

  const customFunctions = functions.filter(isCustomFunction);

  function toggleCatalogFn(key: string) {
    setFunctions((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  function addCustomFunction() {
    const label = customLabel.trim();
    if (!label) { toast.error('Escreve o nome da função'); return; }
    const encoded = encodeCustomFunction(customEmoji, label);
    // Evitar duplicados (mesmo emoji + label)
    if (functions.includes(encoded)) { toast.error('Essa função já existe'); return; }
    setFunctions((prev) => [...prev, encoded]);
    setCustomLabel('');
  }

  function removeFunction(key: string) {
    setFunctions((prev) => prev.filter((k) => k !== key));
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Escreve o nome do ministério'); return; }
    const payload = { name: name.trim(), icon, color, functions };
    try {
      if (isEdit && ministry) {
        await updateMinistry.mutateAsync({ id: ministry.id, ...payload });
        toast.success('Ministério actualizado');
      } else {
        await createMinistry.mutateAsync(payload);
        toast.success('Ministério criado');
      }
      onBack();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
      <div className="panel-pad">

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <button onClick={onBack} style={backBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
            <ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} />
            Ministérios
          </button>
          <button onClick={handleSave} disabled={saving} className="dark-primary-btn">
            <Check style={{ width: '0.875rem', height: '0.875rem' }} />
            {saving ? 'A guardar…' : isEdit ? 'Guardar' : 'Criar ministério'}
          </button>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '1.75rem' }}>
          {isEdit ? 'Editar ministério' : 'Novo ministério'}
        </h1>

        {/* Preview + Nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{
            width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 800, color,
            background: `${color}22`, border: `1px solid ${color}55`,
          }}>
            {name.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, maxWidth: '32rem' }}>
            <Label>Nome do ministério</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Louvor"
              autoFocus
              style={inputStyle}
            />
          </div>
        </div>

        {/* Cor */}
        <Section label="Cor">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {MINISTRY_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                style={{
                  width: '2rem', height: '2rem', borderRadius: '50%', cursor: 'pointer',
                  background: c,
                  border: color === c ? '2px solid #fff' : '2px solid transparent',
                  outline: color === c ? `2px solid ${c}` : 'none',
                  transition: 'transform 0.1s',
                }} />
            ))}
          </div>
        </Section>

        {/* Funções */}
        <Section label="Funções">
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>
            Escolhe as funções deste ministério. Podes usar o catálogo ou criar as tuas próprias.
          </p>

          {/* Catálogo */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
            {MEMBER_FUNCTIONS.map((f) => {
              const selected = functions.includes(f.key);
              return (
                <button key={f.key} type="button" onClick={() => toggleCatalogFn(f.key)}
                  style={chipStyle(selected)}>
                  <span>{f.emoji}</span>
                  <span>{f.label}</span>
                  {selected && <Check style={{ width: '0.7rem', height: '0.7rem' }} />}
                </button>
              );
            })}
          </div>

          {/* Função personalizada */}
          <div style={{
            padding: '1rem', borderRadius: '0.75rem',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Label>Criar função personalizada</Label>

            {/* Escolher ícone */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.5rem 0 0.75rem' }}>
              {FUNCTION_ICON_CHOICES.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setCustomEmoji(emoji)}
                  style={pickBtnStyle(customEmoji === emoji, '2rem')}>
                  {emoji}
                </button>
              ))}
            </div>

            {/* Nome + adicionar */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomFunction(); } }}
                placeholder="Nome da função (ex: Data show)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={addCustomFunction} className="dark-primary-btn"
                style={{ flexShrink: 0 }}>
                <Plus style={{ width: '0.875rem', height: '0.875rem' }} />
                Adicionar
              </button>
            </div>

            {/* Lista de funções personalizadas criadas */}
            {customFunctions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.875rem' }}>
                {customFunctions.map((key) => (
                  <span key={key} style={chipStyle(true, true)}>
                    <span>{getFunctionEmoji(key)}</span>
                    <span>{getFunctionLabel(key)}</span>
                    <button type="button" onClick={() => removeFunction(key)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}>
                      <X style={{ width: '0.75rem', height: '0.75rem' }} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {functions.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.75rem' }}>
              {functions.length} função{functions.length !== 1 ? 'ões' : ''} selecionada{functions.length !== 1 ? 's' : ''}
            </p>
          )}
        </Section>

      </div>
    </div>
  );
}

// ── Helpers de estilo ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <p style={{
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
      {children}
    </label>
  );
}

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
  fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)',
  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  transition: 'color 0.12s',
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: '2.75rem', padding: '0 0.875rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem', color: '#fff', fontSize: '0.875rem', outline: 'none',
};

function pickBtnStyle(active: boolean, size = '2.5rem'): React.CSSProperties {
  return {
    width: size, height: size, borderRadius: '0.5rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
    background: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
    transition: 'background 0.12s, border-color 0.12s',
  };
}

function chipStyle(selected: boolean, isCustom = false): React.CSSProperties {
  const base = isCustom ? '#a5b4fc' : '#6ee7b7';
  return {
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.375rem 0.7rem', borderRadius: '9999px',
    fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
    background: selected ? `${base}22` : 'rgba(255,255,255,0.05)',
    color: selected ? base : 'rgba(255,255,255,0.6)',
    border: `1px solid ${selected ? `${base}55` : 'rgba(255,255,255,0.1)'}`,
    transition: 'background 0.12s, color 0.12s',
  };
}
