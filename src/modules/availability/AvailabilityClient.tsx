'use client';

import { Users, CalendarOff } from 'lucide-react';
import { useOrgMembers } from '@/hooks/useMembers';
import { useOrgUnavailability } from '@/hooks/useAvailability';
import { describeUnavailability } from '@/lib/availability';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import type { OrganizationMember } from '@/types/models';
import { UnavailabilitySection } from './UnavailabilitySection';

type MemberWithProfile = OrganizationMember & {
  profile: { full_name: string; email: string; avatar_url: string | null };
};

export function AvailabilityClient() {
  const { data: rawMembers = [], isLoading: membersLoading } = useOrgMembers();
  const members = rawMembers as unknown as MemberWithProfile[];
  const { data: unavailabilityByUser, isLoading: unavailLoading } = useOrgUnavailability();
  const isLoading = membersLoading || unavailLoading;

  const todayStr = new Date().toISOString().slice(0, 10);
  const isUpcoming = (e: { kind: string; endDate: string | null }) =>
    e.kind !== 'date_range' || !e.endDate || e.endDate >= todayStr;

  const membersWithUnavailability = members
    .map((m) => ({ m, entries: (unavailabilityByUser?.[m.user_id] ?? []).filter(isUpcoming) }))
    .filter(({ entries }) => entries.length > 0);

  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* Hero */}
        <div className="pt-2">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[color:var(--wis-text-3)]">Organização</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[color:var(--wis-text)] mt-1">Indisponibilidade</h1>
          <p className="text-[color:var(--wis-text-3)] text-sm mt-0.5">Marca os teus períodos de indisponibilidade — só tu e quem escala veem o motivo</p>
        </div>

        {/* Self */}
        <div className="dash-glass-card p-5 md:p-6">
          <UnavailabilitySection />
        </div>

        {/* Team overview — visível a todos; o motivo só aparece para quem tem permissão (aplicado no servidor) */}
        <div className="dash-glass-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-4">
            <Users className="h-4 w-4" style={{ color: 'var(--wis-blue)' }} />
            <p className="text-[color:var(--wis-text-3)] text-[11px] font-semibold uppercase tracking-widest">
              Indisponibilidade da equipa
            </p>
          </div>
          {isLoading ? (
            <div className="px-5 pb-6 space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.75rem' }}>
                  <div className="wis-skeleton h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="wis-skeleton h-3.5 w-32 rounded" />
                    <div className="wis-skeleton h-3 w-48 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : membersWithUnavailability.length === 0 ? (
            <div className="px-5 pb-6">
              <p className="text-sm text-[color:var(--wis-text-3)]">Ninguém registou indisponibilidades ainda.</p>
            </div>
          ) : (
            <div className="px-5 pb-5 space-y-2.5">
              {membersWithUnavailability.map(({ m, entries }) => {
                const name = m.profile?.full_name ?? m.profile?.email ?? '?';
                return (
                  <div key={m.user_id} style={{
                    display: 'flex', gap: '0.75rem',
                    padding: '0.75rem', borderRadius: '0.75rem',
                    background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
                  }}>
                    <Avatar className="h-8 w-8 shrink-0">
                      {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} alt={name} />}
                      <AvatarFallback className="text-xs" style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[color:var(--wis-text)]">{name}</p>
                      <div className="flex flex-col gap-1 mt-1">
                        {entries.map((e) => (
                          <p key={e.id} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--wis-text-2)' }}>
                            <CalendarOff className="h-3 w-3 shrink-0" style={{ color: 'var(--wis-danger)' }} />
                            {describeUnavailability(e)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
