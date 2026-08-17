'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useMinistryMembers, useOrgMembers } from '@/hooks/useMembers';
import { upsertMinistryMembersAction } from '@/actions/members';
import { MEMBER_FUNCTIONS } from '@/lib/constants';
import type { Ministry } from '@/types/models';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

type MemberEntry = { userId: string; functions: string[] };
type OrgMember = {
  user_id: string; is_active: boolean;
  profile: { full_name: string; email: string; avatar_url: string | null };
};

interface Props {
  ministry: Ministry;
  onBack: () => void;
}

export function MinistryMembersPanel({ ministry, onBack }: Props) {
  const color = ministry.color ?? 'var(--wis-blue)';
  const { data: orgMembers = [] } = useOrgMembers();
  const { data: existingData } = useMinistryMembers(ministry.id);
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingData) return;
    setMembers(existingData.map((m) => ({ userId: m.user_id, functions: m.functions })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ministry.id, existingData]);

  const activeMembers = (orgMembers as unknown as OrgMember[]).filter((m) => m.is_active);
  const availableFunctions = ministry.functions?.length
    ? MEMBER_FUNCTIONS.filter((f) => ministry.functions.includes(f.key))
    : MEMBER_FUNCTIONS;

  function isSelected(userId: string) { return members.some((m) => m.userId === userId); }
  function getFns(userId: string) { return members.find((m) => m.userId === userId)?.functions ?? []; }

  function toggleMember(userId: string) {
    setMembers((prev) =>
      prev.some((m) => m.userId === userId)
        ? prev.filter((m) => m.userId !== userId)
        : [...prev, { userId, functions: [] }],
    );
  }

  function toggleFn(userId: string, fn: string) {
    setMembers((prev) => prev.map((m) => {
      if (m.userId !== userId) return m;
      const has = m.functions.includes(fn);
      return { ...m, functions: has ? m.functions.filter((f) => f !== fn) : [...m.functions, fn] };
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await upsertMinistryMembersAction(ministry.id, members);
      toast.success('Participantes actualizados');
      onBack();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
      <style>{`
        .mmp-mem-fn { display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); gap: 0.25rem; }
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
              fontSize: '0.8rem', fontWeight: 500, color: 'var(--wis-text-2)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--wis-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--wis-text-2)')}
          >
            <ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} />
            {ministry.name}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--wis-text)', margin: 0 }}>
              Participantes
            </h1>
            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                fontSize: '0.8rem', fontWeight: 500,
                background: 'var(--wis-surface-3)', border: '1px solid var(--wis-border-strong)',
                color: 'var(--wis-text)', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="dark-primary-btn"
              style={{ cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* ── Ministry badge ──────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.875rem 1.25rem', borderRadius: '0.875rem', marginBottom: '1.25rem',
          background: `color-mix(in srgb, ${color} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`,
        }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: '0.5rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `color-mix(in srgb, ${color} 13%, transparent)`, fontSize: '0.85rem', fontWeight: 800, color,
          }}>
            {ministry.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--wis-text)', margin: 0 }}>{ministry.name}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', margin: 0 }}>
              Seleciona os membros e as funções de cada um
            </p>
          </div>
        </div>

        {/* ── Members list ─────────────────────────────────── */}
        <div style={{
          borderRadius: '1rem', background: 'var(--wis-surface-2)',
          border: '1px solid var(--wis-border)', overflow: 'hidden',
          marginBottom: '1.5rem',
        }}>
          {activeMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <Users style={{ width: '2rem', height: '2rem', color: 'var(--wis-text-4)', margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--wis-text-3)', margin: 0 }}>
                Nenhum membro activo na organização.
              </p>
            </div>
          ) : activeMembers.map((member, i) => {
            const name = member.profile?.full_name || member.profile?.email || '?';
            const selected = isSelected(member.user_id);
            const fns = getFns(member.user_id);
            return (
              <div key={member.user_id} style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--wis-border)',
              }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem 1.25rem', cursor: 'pointer',
                  background: selected ? `color-mix(in srgb, ${color} 3%, transparent)` : 'transparent',
                  transition: 'background 0.12s',
                }}>
                  <Checkbox checked={selected} onCheckedChange={() => toggleMember(member.user_id)} />
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {member.profile?.avatar_url && <AvatarImage src={member.profile.avatar_url} />}
                    <AvatarFallback style={{ fontSize: '0.65rem', fontWeight: 700, background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--wis-text)', flex: 1 }}>{name}</span>
                  {selected && fns.length > 0 && (
                    <span style={{ fontSize: '0.7rem', color: color, fontWeight: 500 }}>
                      {fns.length} {fns.length !== 1 ? 'funções' : 'função'}
                    </span>
                  )}
                </label>

                {selected && availableFunctions.length > 0 && (
                  <div className="mmp-mem-fn" style={{ padding: '0.25rem 1.25rem 0.875rem 3.5rem' }}>
                    {availableFunctions.map((f) => (
                      <label key={f.key} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.375rem 0.5rem', borderRadius: '0.375rem', cursor: 'pointer',
                        fontSize: '0.78rem', color: fns.includes(f.key) ? 'var(--wis-text)' : 'var(--wis-text-2)',
                        background: fns.includes(f.key) ? `color-mix(in srgb, ${color} 9%, transparent)` : 'transparent',
                        transition: 'background 0.1s, color 0.1s',
                      }}>
                        <Checkbox
                          checked={fns.includes(f.key)}
                          onCheckedChange={() => toggleFn(member.user_id, f.key)}
                        />
                        <span>{f.emoji} {f.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
