'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useMinistries } from '@/hooks/useMinistries';
import { useMemberMinistries, useUpsertMemberMinistries } from '@/hooks/useMembers';
import { MEMBER_FUNCTIONS } from '@/lib/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

type Assignment = { ministryId: string; functions: string[] };

interface Props {
  userId: string;
  memberName: string;
  memberAvatar?: string | null;
  onBack: () => void;
}

export function MemberMinistriesPanel({ userId, memberName, memberAvatar, onBack }: Props) {
  const { data: ministries = [] } = useMinistries();
  const { data: currentAssignments } = useMemberMinistries(userId);
  const upsert = useUpsertMemberMinistries();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    if (!currentAssignments) return;
    setAssignments(
      currentAssignments.map((a) => ({ ministryId: a.ministry_id, functions: a.functions })),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentAssignments]);

  const activeMinistries = ministries.filter((m) => m.is_active);

  function isIn(ministryId: string) { return assignments.some((a) => a.ministryId === ministryId); }
  function getFns(ministryId: string) { return assignments.find((a) => a.ministryId === ministryId)?.functions ?? []; }

  function toggleMinistry(ministryId: string) {
    setAssignments((prev) =>
      prev.some((a) => a.ministryId === ministryId)
        ? prev.filter((a) => a.ministryId !== ministryId)
        : [...prev, { ministryId, functions: [] }],
    );
  }

  function toggleFn(ministryId: string, fn: string) {
    setAssignments((prev) => prev.map((a) => {
      if (a.ministryId !== ministryId) return a;
      const has = a.functions.includes(fn);
      return { ...a, functions: has ? a.functions.filter((f) => f !== fn) : [...a.functions, fn] };
    }));
  }

  async function handleSave() {
    try {
      await upsert.mutateAsync({ userId, assignments });
      toast.success('Ministérios actualizados');
      onBack();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
      <style>{`
        .mmp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (max-width: 700px) { .mmp-grid { grid-template-columns: 1fr !important; } }
        .mmp-fn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); gap: 0.25rem; }
      `}</style>
      <div className="panel-pad">

        {/* ── Top bar ─────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '2rem',
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          >
            <ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} />
            Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Ministérios
            </h1>
            <button
              onClick={onBack}
              disabled={upsert.isPending}
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                fontSize: '0.8rem', fontWeight: 500,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={upsert.isPending}
              className="dark-primary-btn"
              style={{ cursor: upsert.isPending ? 'not-allowed' : 'pointer', opacity: upsert.isPending ? 0.7 : 1 }}
            >
              {upsert.isPending ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* ── Member badge ─────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.875rem',
          padding: '1rem 1.25rem', borderRadius: '0.875rem', marginBottom: '1.5rem',
          background: 'rgba(165,180,252,0.07)', border: '1px solid rgba(165,180,252,0.14)',
        }}>
          <Avatar className="h-10 w-10 flex-shrink-0">
            {memberAvatar && <AvatarImage src={memberAvatar} />}
            <AvatarFallback style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(165,180,252,0.2)', color: '#a5b4fc' }}>
              {getInitials(memberName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>{memberName}</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', margin: '0.1rem 0 0' }}>
              Seleciona os ministérios e as funções de cada um
            </p>
          </div>
        </div>

        {/* ── Ministries grid ──────────────────────────────── */}
        {activeMinistries.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '3rem 0', margin: 0 }}>
            Nenhum ministério activo na organização.
          </p>
        ) : (
          <div className="mmp-grid">
            {activeMinistries.map((ministry) => {
              const color = ministry.color ?? '#a5b4fc';
              const selected = isIn(ministry.id);
              const fns = getFns(ministry.id);
              const availableFunctions = ministry.functions?.length
                ? MEMBER_FUNCTIONS.filter((f) => ministry.functions.includes(f.key))
                : MEMBER_FUNCTIONS;

              return (
                <div key={ministry.id} style={{
                  borderRadius: '1rem',
                  background: selected ? `${color}08` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected ? color + '30' : 'rgba(255,255,255,0.07)'}`,
                  overflow: 'hidden',
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                  {/* Ministry header */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.875rem 1rem', cursor: 'pointer',
                  }}>
                    <Checkbox checked={selected} onCheckedChange={() => toggleMinistry(ministry.id)} />
                    <div style={{
                      width: '2rem', height: '2rem', borderRadius: '0.5rem', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${color}20`, border: `1px solid ${color}35`,
                      fontSize: '0.8rem', fontWeight: 800, color,
                    }}>
                      {ministry.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', flex: 1 }}>
                      {ministry.name}
                    </span>
                    {selected && fns.length > 0 && (
                      <span style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>
                        {fns.length} função{fns.length !== 1 ? 'ões' : ''}
                      </span>
                    )}
                  </label>

                  {/* Functions */}
                  {selected && availableFunctions.length > 0 && (
                    <div style={{
                      borderTop: `1px solid ${color}20`,
                      padding: '0.75rem 1rem 0.875rem',
                    }}>
                      <div className="mmp-fn-grid">
                        {availableFunctions.map((f) => (
                          <label key={f.key} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.375rem 0.5rem', borderRadius: '0.375rem', cursor: 'pointer',
                            fontSize: '0.78rem',
                            color: fns.includes(f.key) ? '#fff' : 'rgba(255,255,255,0.45)',
                            background: fns.includes(f.key) ? `${color}18` : 'transparent',
                            transition: 'background 0.1s, color 0.1s',
                          }}>
                            <Checkbox
                              checked={fns.includes(f.key)}
                              onCheckedChange={() => toggleFn(ministry.id, f.key)}
                            />
                            <span>{f.emoji} {f.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
