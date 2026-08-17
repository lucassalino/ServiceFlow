'use client';

import { ArrowLeft, Pencil, Trash2, PowerOff, Power, Users, SlidersHorizontal } from 'lucide-react';
import type { Ministry } from '@/types/models';
import { getFunctionLabel, getFunctionEmoji } from '@/lib/constants';
import { useMinistryMembers } from '@/hooks/useMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface Props {
  ministry: Ministry;
  isAdmin: boolean;
  canManage?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onEditProperties: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
}

export function MinistryDetailPanel({
  ministry, isAdmin, canManage = isAdmin, onBack, onEdit, onEditProperties, onToggle, onDelete, togglePending,
}: Props) {
  const color = ministry.color ?? 'var(--wis-blue)';
  const initial = ministry.name.charAt(0).toUpperCase();
  const { data: members = [], isLoading: loadingMembers } = useMinistryMembers(ministry.id);

  const createdDate = new Date(ministry.created_at).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
      <style>{`
        .mdp-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 700px) { .mdp-cols { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="panel-pad">

        {/* ── Top bar ────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem',
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
            Ministérios
          </button>

          {canManage && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={onEditProperties}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.875rem', fontSize: '0.775rem', fontWeight: 500,
                  background: 'var(--wis-surface-3)', border: '1px solid var(--wis-border-strong)',
                  borderRadius: '0.5rem', color: 'var(--wis-text)', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--wis-surface-4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--wis-surface-3)')}
              >
                <SlidersHorizontal style={{ width: '0.8rem', height: '0.8rem' }} />
                Editar ministério
              </button>
              <button
                onClick={onEdit}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.875rem', fontSize: '0.775rem', fontWeight: 500,
                  background: 'var(--wis-surface-3)', border: '1px solid var(--wis-border-strong)',
                  borderRadius: '0.5rem', color: 'var(--wis-text)', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--wis-surface-4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--wis-surface-3)')}
              >
                <Pencil style={{ width: '0.8rem', height: '0.8rem' }} />
                Gerir participantes
              </button>
              <button
                onClick={onToggle}
                disabled={togglePending}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.875rem', fontSize: '0.775rem', fontWeight: 500,
                  background: 'var(--wis-surface-3)', border: '1px solid var(--wis-border-strong)',
                  borderRadius: '0.5rem',
                  color: ministry.is_active ? 'var(--wis-warning)' : 'var(--wis-success)',
                  cursor: togglePending ? 'not-allowed' : 'pointer',
                  opacity: togglePending ? 0.6 : 1, transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--wis-surface-4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--wis-surface-3)')}
              >
                {ministry.is_active
                  ? <PowerOff style={{ width: '0.8rem', height: '0.8rem' }} />
                  : <Power style={{ width: '0.8rem', height: '0.8rem' }} />}
                {ministry.is_active ? 'Desactivar' : 'Activar'}
              </button>
              {isAdmin && (
                <button
                  onClick={onDelete}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.375rem 0.875rem', fontSize: '0.775rem', fontWeight: 500,
                    background: 'var(--wis-danger-bg)', border: '1px solid #f5c9cb',
                    borderRadius: '0.5rem', color: 'var(--wis-danger)', cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--wis-danger-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--wis-danger-bg)')}
                >
                  <Trash2 style={{ width: '0.8rem', height: '0.8rem' }} />
                  Remover
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Hero card ──────────────────────────────────────── */}
        <div style={{
          position: 'relative', padding: '1.75rem 2rem',
          borderRadius: '1.25rem', background: 'var(--wis-surface-2)',
          border: '1px solid var(--wis-border)', marginBottom: '1.25rem', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 80%, transparent), color-mix(in srgb, ${color} 20%, transparent))`,
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '4rem', height: '4rem', borderRadius: '1rem', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `color-mix(in srgb, ${color} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
              fontSize: '1.6rem', fontWeight: 800, color,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: '1.5rem', fontWeight: 800, color: 'var(--wis-text)',
                letterSpacing: '-0.02em', margin: 0,
              }}>
                {ministry.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                {ministry.is_active ? (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                    borderRadius: '9999px', letterSpacing: '0.04em',
                    background: 'var(--wis-success-bg)', color: 'var(--wis-success)',
                    border: '1px solid #bfe6d3',
                  }}>Activo</span>
                ) : (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                    borderRadius: '9999px', letterSpacing: '0.04em',
                    background: 'var(--wis-danger-bg)', color: 'var(--wis-danger)',
                    border: '1px solid #f5c9cb',
                  }}>Inactivo</span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--wis-text-3)' }}>
                  Criado a {createdDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────── */}
        <div className="mdp-cols">

          {/* Participants */}
          <div style={{
            padding: '1.5rem', borderRadius: '1rem',
            background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--wis-text-3)', margin: 0,
              }}>
                Participantes · {members.length}
              </p>
              {isAdmin && (
                <button
                  onClick={onEdit}
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

            {loadingMembers ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{
                    height: '3rem', borderRadius: '0.5rem', background: 'var(--wis-surface-2)',
                    animation: 'pulse 2s infinite',
                  }} />
                ))}
              </div>
            ) : members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <Users style={{ width: '1.75rem', height: '1.75rem', color: 'var(--wis-text-4)', margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-3)', margin: 0 }}>
                  Nenhum participante ainda.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {(members as unknown as {
                  user_id: string; functions: string[];
                  profile?: { full_name: string; email: string; avatar_url: string | null };
                }[]).map((m) => {
                  const name = m.profile?.full_name ?? m.profile?.email ?? '?';
                  return (
                    <div key={m.user_id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                      padding: '0.625rem 0.75rem', borderRadius: '0.625rem',
                      background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
                    }}>
                      <Avatar className="h-8 w-8 flex-shrink-0" style={{ marginTop: '0.05rem' }}>
                        {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
                        <AvatarFallback style={{
                          fontSize: '0.65rem', fontWeight: 700,
                          background: `color-mix(in srgb, ${color} 13%, transparent)`, color,
                        }}>
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '0.8rem', fontWeight: 600, color: 'var(--wis-text)',
                          margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {name}
                        </p>
                        {m.functions.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {m.functions.map((fn) => (
                              <span key={fn} style={{
                                fontSize: '0.65rem', fontWeight: 500,
                                padding: '0.1rem 0.4rem', borderRadius: '9999px',
                                background: `color-mix(in srgb, ${color} 8%, transparent)`, color,
                                border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`,
                              }}>
                                {getFunctionEmoji(fn)} {getFunctionLabel(fn)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.7rem', color: 'var(--wis-text-4)', margin: 0 }}>
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

          {/* Functions catalog */}
          <div style={{
            padding: '1.5rem', borderRadius: '1rem',
            background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
          }}>
            <p style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--wis-text-3)', marginBottom: '1rem',
            }}>
              Funções disponíveis · {ministry.functions.length}
            </p>

            {ministry.functions.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--wis-text-3)', margin: 0 }}>
                Nenhuma função definida.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {ministry.functions.map((fn) => (
                  <div key={fn} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.625rem', borderRadius: '0.5rem',
                    background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
                  }}>
                    <span style={{ fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}>
                      {getFunctionEmoji(fn)}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--wis-text)' }}>
                      {getFunctionLabel(fn)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
