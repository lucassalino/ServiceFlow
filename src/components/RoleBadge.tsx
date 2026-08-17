'use client';

import type { OrgRole } from '@/types/models';

export const ROLE_LABEL: Record<OrgRole, string> = {
  admin: 'Administrador',
  leader: 'Líder',
  member: 'Membro',
};

/**
 * Etiqueta do papel de uma pessoa na organização.
 *
 * Fonte única: antes cada ecrã tinha a sua tabela de cores de fundo e de
 * texto, e bastava as duas divergirem para a etiqueta ficar ilegível. Aqui
 * só se escolhe a variante do sistema — o par fundo/texto/borda vem sempre
 * do mesmo sítio e funciona nos dois temas.
 */
const ROLE_VARIANT: Record<OrgRole, string> = {
  admin: 'wis-badge-info',
  leader: 'wis-badge-accent',
  member: 'wis-badge-neutral',
};

export function RoleBadge({ role, size = 'sm' }: { role: OrgRole; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`wis-badge ${ROLE_VARIANT[role]}`}
      style={size === 'md' ? { fontSize: '0.8rem', padding: '0.25rem 0.7rem' } : undefined}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
