'use client';

import { useState } from 'react';
import { ArrowLeft, Pencil, History } from 'lucide-react';
import type { OrganizationMember, OrgRole } from '@/types/models';
import { useMemberMinistries } from '@/hooks/useMembers';
import { useMinistries } from '@/hooks/useMinistries';
import { getFunctionLabel, getFunctionEmoji } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { RoleBadge } from '@/components/RoleBadge';
import { MemberMinistriesPanel } from './MemberMinistriesPanel';
import { MemberHistoryPanel } from './MemberHistoryPanel';

type MemberWithProfile = OrganizationMember & {
  profile: { full_name: string; email: string; avatar_url: string | null };
};


interface Props {
  member: MemberWithProfile;
  isAdmin: boolean;
  onBack: () => void;
}

export function MemberDetailPanel({ member, isAdmin, onBack }: Props) {
  const [showMinistriesPanel, setShowMinistriesPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const { data: assignments = [], isLoading } = useMemberMinistries(member.user_id);
  const { data: allMinistries = [] } = useMinistries();

  const memberLabel = member.profile?.full_name ?? member.profile?.email ?? '?';

  if (showMinistriesPanel) {
    return (
      <MemberMinistriesPanel
        userId={member.user_id}
        memberName={memberLabel}
        memberAvatar={member.profile?.avatar_url}
        onBack={() => setShowMinistriesPanel(false)}
      />
    );
  }

  if (showHistoryPanel) {
    return (
      <MemberHistoryPanel
        userId={member.user_id}
        memberName={memberLabel}
        memberAvatar={member.profile?.avatar_url}
        onBack={() => setShowHistoryPanel(false)}
      />
    );
  }

  const role = member.role as OrgRole;
  const name = member.profile?.full_name ?? (isAdmin ? member.profile?.email : undefined) ?? '?';
  const joinedDate = new Date(member.joined_at).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const ministryMap = new Map(allMinistries.map((m) => [m.id, m]));

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
      <style>{`
        .mdp-main { display: grid; grid-template-columns: 22rem 1fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 820px) { .mdp-main { grid-template-columns: 1fr !important; } }
        .mdp-min-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 0.75rem; }
      `}</style>
      <div className="panel-pad">

        {/* ── Top bar ─────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '2rem',
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
            Pessoas
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowHistoryPanel(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.875rem', fontSize: '0.775rem', fontWeight: 500,
                background: 'var(--wis-surface-3)', border: '1px solid var(--wis-border-strong)',
                borderRadius: '0.5rem', color: 'var(--wis-text)', cursor: 'pointer',
                transition: 'background 0.12s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--wis-surface-4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--wis-surface-3)')}
            >
              <History style={{ width: '0.8rem', height: '0.8rem' }} />
              Histórico
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowMinistriesPanel(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.875rem', fontSize: '0.775rem', fontWeight: 500,
                  background: 'var(--wis-surface-3)', border: '1px solid var(--wis-border-strong)',
                  borderRadius: '0.5rem', color: 'var(--wis-text)', cursor: 'pointer',
                  transition: 'background 0.12s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--wis-surface-4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--wis-surface-3)')}
              >
                <Pencil style={{ width: '0.8rem', height: '0.8rem' }} />
                Gerir ministérios
              </button>
            )}
          </div>
        </div>

        {/* ── Two-column main layout ───────────────────────── */}
        <div className="mdp-main">

          {/* Left: Profile card */}
          <div style={{
            padding: '1.75rem', borderRadius: '1.25rem',
            background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.875rem' }}>
              <Avatar className="h-20 w-20">
                {member.profile?.avatar_url && <AvatarImage src={member.profile.avatar_url} alt={name} />}
                <AvatarFallback style={{
                  fontSize: '1.4rem', fontWeight: 700,
                  background: 'var(--wis-blue-soft)', color: 'var(--wis-blue)',
                }}>
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 style={{
                  fontSize: '1.3rem', fontWeight: 800, color: 'var(--wis-text)',
                  letterSpacing: '-0.02em', margin: '0 0 0.5rem',
                }}>
                  {name}
                </h1>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <RoleBadge role={role} size="md" />
                  {!member.is_active && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      background: 'var(--wis-danger-bg)', color: 'var(--wis-danger)',
                      border: '1px solid #f5c9cb',
                    }}>
                      Inactivo
                    </span>
                  )}
                </div>
              </div>
              <div style={{
                width: '100%', paddingTop: '0.875rem',
                borderTop: '1px solid var(--wis-border)',
              }}>
                {isAdmin && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-2)', margin: '0 0 0.25rem', wordBreak: 'break-all' }}>
                    {member.profile?.email}
                  </p>
                )}
                <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', margin: 0 }}>
                  Desde {joinedDate}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Ministries */}
          <div style={{
            padding: '1.5rem', borderRadius: '1.25rem',
            background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--wis-text-3)', margin: 0,
              }}>
                Ministérios · {assignments.length}
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowMinistriesPanel(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    fontSize: '0.7rem', fontWeight: 500, color: 'var(--wis-text-3)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'color 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--wis-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--wis-text-2)')}
                >
                  <Pencil style={{ width: '0.7rem', height: '0.7rem' }} />
                  Editar
                </button>
              )}
            </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  height: '4rem', borderRadius: '0.625rem',
                  background: 'var(--wis-surface-2)', animation: 'pulse 2s infinite',
                }} />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--wis-text-3)', margin: '0 0 0.75rem' }}>
                Nenhum ministério atribuído.
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowMinistriesPanel(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 500,
                    background: 'var(--wis-surface-3)', border: '1px solid var(--wis-border-strong)',
                    borderRadius: '0.5rem', color: 'var(--wis-text)', cursor: 'pointer',
                  }}
                >
                  <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
                  Atribuir ministérios
                </button>
              )}
            </div>
          ) : (
            <div className="mdp-min-grid">
              {assignments.map((a) => {
                const ministry = ministryMap.get(a.ministry_id);
                if (!ministry) return null;
                const color = ministry.color ?? 'var(--wis-blue)';
                return (
                  <div key={a.ministry_id} style={{
                    padding: '0.875rem 1rem', borderRadius: '0.75rem',
                    background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                      background: `linear-gradient(180deg, color-mix(in srgb, ${color} 80%, transparent), color-mix(in srgb, ${color} 20%, transparent))`,
                    }} />
                    <div style={{ paddingLeft: '0.75rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--wis-text)', margin: '0 0 0.375rem' }}>
                        {ministry.name}
                      </p>
                      {a.functions.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {a.functions.map((fn) => (
                            <span key={fn} style={{
                              fontSize: '0.68rem', fontWeight: 500,
                              padding: '0.1rem 0.45rem', borderRadius: '9999px',
                              background: `color-mix(in srgb, ${color} 12%, transparent)`, color: 'var(--wis-text-2)',
                              border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                            }}>
                              {getFunctionEmoji(fn)} {getFunctionLabel(fn)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', margin: 0 }}>
                          Sem função atribuída
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>

        </div>{/* end mdp-main */}

      </div>
    </div>
  );
}
