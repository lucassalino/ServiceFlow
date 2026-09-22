'use client';

import { Heart, AlertTriangle } from 'lucide-react';
import type { OrgFamilyLink } from '@/actions/families';

interface MinistryOption { id: string; name: string }

interface Props {
  familyLinks: OrgFamilyLink[] | undefined;
  /** userIds já selecionados, agrupados por ministério deste evento. */
  membersByMinistry: Record<string, { userId: string }[]>;
  /** Elenco de cada ministério selecionado — para saber onde a pessoa sugerida serve e o nome de quem já está selecionado. */
  ministryRoster: Record<string, { userId: string; name?: string }[]>;
  ministries: MinistryOption[];
  onAdd: (ministryId: string, userId: string) => void;
}

/**
 * Avisos de família no passo de escalar um evento: sugere adicionar quem
 * prefere servir junto (e ainda não está no evento) e avisa quando duas
 * pessoas que preferem servir separadas acabaram as duas escaladas. A
 * preferência é por par de pessoas, não por grupo — dá para ter "junto"
 * com uma pessoa e "separado" com outra ao mesmo tempo. Não bloqueia nada
 * — quem escala decide.
 */
export function FamilySchedulingHints({ familyLinks, membersByMinistry, ministryRoster, ministries, onAdd }: Props) {
  if (!familyLinks || familyLinks.length === 0) return null;

  const selected = new Set<string>();
  for (const members of Object.values(membersByMinistry)) for (const m of members) selected.add(m.userId);
  if (selected.size === 0) return null;

  const linksByUserId = new Map<string, OrgFamilyLink[]>();
  for (const link of familyLinks) {
    linksByUserId.set(link.userId, [...(linksByUserId.get(link.userId) ?? []), link]);
  }

  const selectedMinistryIds = Object.keys(ministryRoster);

  function nameOf(userId: string): string | null {
    for (const mid of selectedMinistryIds) {
      const found = (ministryRoster[mid] ?? []).find((rm) => rm.userId === userId);
      if (found?.name) return found.name;
    }
    return null;
  }

  function ministriesFor(userId: string): MinistryOption[] {
    return selectedMinistryIds
      .filter((mid) => (ministryRoster[mid] ?? []).some((rm) => rm.userId === userId))
      .map((mid) => ministries.find((m) => m.id === mid))
      .filter((m): m is MinistryOption => !!m);
  }

  const together: { forName: string; partnerId: string; partnerName: string; options: MinistryOption[] }[] = [];
  const suggestedPartnerIds = new Set<string>();
  const apartSeen = new Set<string>();
  const apart: { aName: string; bName: string }[] = [];

  for (const userId of selected) {
    const links = linksByUserId.get(userId);
    if (!links) continue;
    const forName = nameOf(userId) ?? '';

    for (const link of links) {
      if (link.preference === 'junto' && !selected.has(link.otherUserId) && !suggestedPartnerIds.has(link.otherUserId)) {
        suggestedPartnerIds.add(link.otherUserId);
        together.push({ forName, partnerId: link.otherUserId, partnerName: link.otherName, options: ministriesFor(link.otherUserId) });
      }
      if (link.preference === 'separado' && selected.has(link.otherUserId)) {
        const key = [userId, link.otherUserId].sort().join(':');
        if (apartSeen.has(key)) continue;
        apartSeen.add(key);
        apart.push({ aName: forName, bName: link.otherName });
      }
    }
  }

  if (together.length === 0 && apart.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {together.map((s) => (
        <div key={s.partnerId} style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
          padding: '0.6rem 0.85rem', borderRadius: '0.625rem',
          background: 'var(--wis-blue-soft)', border: '1px solid var(--wis-blue-border)',
        }}>
          <Heart style={{ width: '0.9rem', height: '0.9rem', color: 'var(--wis-blue)', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--wis-text)', minWidth: '12rem' }}>
            <strong>{s.forName}</strong> prefere servir com <strong>{s.partnerName}</strong>.
          </span>
          {s.options.length === 1 ? (
            <button
              type="button"
              onClick={() => onAdd(s.options[0].id, s.partnerId)}
              style={{
                fontSize: '0.75rem', fontWeight: 700, color: 'var(--wis-blue)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem',
              }}
            >
              Adicionar {s.partnerName.split(' ')[0]}
            </button>
          ) : s.options.length > 1 ? (
            <select
              defaultValue=""
              onChange={(e) => { if (e.target.value) onAdd(e.target.value, s.partnerId); }}
              style={{
                fontSize: '0.75rem', fontWeight: 600, color: 'var(--wis-blue)',
                background: 'var(--wis-surface)', border: '1px solid var(--wis-blue-border)',
                borderRadius: '0.4rem', padding: '0.2rem 0.4rem', cursor: 'pointer',
              }}
            >
              <option value="" disabled>Adicionar em…</option>
              {s.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)' }}>não está em nenhum ministério deste evento</span>
          )}
        </div>
      ))}

      {apart.map((w, i) => (
        <div key={`${w.aName}-${w.bName}-${i}`} style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.6rem 0.85rem', borderRadius: '0.625rem',
          background: 'var(--wis-warning-bg)', border: '1px solid #f3ddb6',
        }}>
          <AlertTriangle style={{ width: '0.9rem', height: '0.9rem', color: 'var(--wis-warning)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--wis-text)' }}>
            <strong>{w.aName}</strong> e <strong>{w.bName}</strong> preferem servir separados, mas estão os dois neste evento.
          </span>
        </div>
      ))}
    </div>
  );
}
