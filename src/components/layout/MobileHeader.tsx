'use client';

import Link from 'next/link';
import { Menu, Megaphone } from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface Props {
  orgId: string;
  onMenuOpen: () => void;
}

export function MobileHeader({ orgId, onMenuOpen }: Props) {
  const { activeOrg, activeMembership } = useOrgStore();

  return (
    <header
      className="lg:hidden flex items-center gap-2.5 h-[52px] px-3.5 sticky top-0 z-40"
      style={{
        background: 'color-mix(in srgb, var(--wis-canvas) 82%, transparent)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--wis-border)',
      }}
    >
      <button
        onClick={onMenuOpen}
        className="sidebar-dark-icon-btn"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'var(--wis-gradient)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wis-symbol-white.svg" alt="WIS" style={{ width: '0.85rem', height: 'auto' }} />
        </div>
        <span className="font-medium text-sm truncate" style={{ color: 'var(--wis-text-2)' }}>
          {activeOrg?.name ?? 'WIS'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/${orgId}/mural`} aria-label="Mural de recados" className="sidebar-dark-icon-btn">
          <Megaphone className="h-5 w-5" />
        </Link>
        <ThemeToggle />
        <NotificationBell orgId={orgId} />
        <Link href={`/${orgId}/settings`} aria-label="Definições" className="shrink-0">
          <Avatar className="h-7 w-7">
            <AvatarImage src={activeMembership?.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs font-semibold"
              style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
              {getInitials(activeMembership?.profile?.full_name ?? 'U')}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
