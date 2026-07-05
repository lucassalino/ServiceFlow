'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, LogIn, ChevronRight, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Organization, OrganizationMember } from '@/types/models';

interface OrgSelectionClientProps {
  initialMemberships: (OrganizationMember & { organization: Organization })[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  leader: 'Líder',
  member: 'Membro',
};

export function OrgSelectionClient({ initialMemberships }: OrgSelectionClientProps) {
  const router = useRouter();

  async function handleBackToLogin() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="auth-bg">
      {/* Voltar ao login */}
      <button
        type="button"
        onClick={handleBackToLogin}
        aria-label="Voltar ao login"
        style={{
          position: 'absolute', top: '1.5rem', left: '1.5rem',
          width: '2.5rem', height: '2.5rem', borderRadius: '9999px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
      >
        <ArrowLeft style={{ width: '1.1rem', height: '1.1rem' }} />
      </button>

      <div className="w-full max-w-[420px]">
        <div className="auth-glass">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-10 w-10 rounded-xl items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Selecionar Organização
            </h1>
            <p className="text-[13px] text-white/40 mt-1">
              Escolhe uma organização para continuar
            </p>
          </div>

          {/* Org list */}
          {initialMemberships.length === 0 ? (
            <p className="text-center text-[13px] text-white/35 py-6">
              Ainda não pertences a nenhuma organização.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {initialMemberships.map((membership) => (
                <button
                  key={membership.id}
                  type="button"
                  onClick={() => router.push(`/${membership.org_id}/dashboard`)}
                  className="org-select-item"
                >
                  {membership.organization.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={membership.organization.logo_url}
                      alt={membership.organization.name}
                      style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: '2.5rem', height: '2.5rem', borderRadius: '9999px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#fff', color: '#0a0a0e', fontSize: '0.95rem', fontWeight: 700,
                    }}>
                      {membership.organization.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {membership.organization.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem' }}>
                      {ROLE_LABELS[membership.role] ?? membership.role}
                    </p>
                  </div>
                  <ChevronRight style={{ width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            margin: '0.25rem 0 1rem',
          }}>
            <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ou</span>
            <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/new-org" className="org-select-action">
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Criar organização
            </Link>
            <Link href="/join-org" className="org-select-action">
              <LogIn style={{ width: '1rem', height: '1rem' }} />
              Entrar numa organização
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
