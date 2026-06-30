'use client';

import { Menu } from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { NotificationBell } from './NotificationBell';
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
      className="lg:hidden flex items-center gap-3 h-14 px-4 sticky top-0 z-40"
      style={{
        background: 'rgba(5,5,5,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
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
        <div className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}>
          {activeOrg?.name?.[0]?.toUpperCase() ?? 'S'}
        </div>
        <span className="font-semibold text-sm truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {activeOrg?.name ?? 'ServiceFlow'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <NotificationBell orgId={orgId} />
        <Avatar className="h-7 w-7">
          <AvatarImage src={activeMembership?.profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
            {getInitials(activeMembership?.profile?.full_name ?? 'U')}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
