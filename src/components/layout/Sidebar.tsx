'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Users, Music2, BookOpen,
  Settings, Plus, LogOut, Moon, Sun, CalendarCheck, ChevronDown, X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useOrgStore } from '@/stores/orgStore';
import { useOrgMemberships } from '@/hooks/useOrganizations';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: 'dashboard',  label: 'Início',      icon: LayoutDashboard },
  { href: 'events',     label: 'Eventos',     icon: Calendar },
  { href: 'schedule',   label: 'Escalas',     icon: CalendarCheck },
  { href: 'members',    label: 'Pessoas',     icon: Users },
  { href: 'ministries', label: 'Ministérios', icon: Music2 },
  { href: 'songs',      label: 'Repertório',  icon: BookOpen },
  { href: 'settings',   label: 'Definições',  icon: Settings },
];

interface Props {
  orgId: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ orgId, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const { activeOrg, activeMembership, setActiveOrg } = useOrgStore();
  const { data: memberships } = useOrgMemberships();
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function handleSwitchOrg(m: NonNullable<typeof memberships>[number]) {
    setActiveOrg(m.organization, m);
    router.push(`/${m.organization.id}/dashboard`);
    setShowOrgMenu(false);
    onMobileClose();
  }

  const sidebarContent = (
    <div className="sidebar-dark">

      {/* ── Brand ─────────────────────────────── */}
      <div className="sidebar-dark-section flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span className="text-white text-xs font-bold">SF</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">ServiceFlow</span>
        </div>
        <button
          onClick={onMobileClose}
          className="sidebar-dark-icon-btn lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Org switcher ──────────────────────── */}
      <div className="sidebar-dark-section px-3 py-3 relative">
        <button
          onClick={() => setShowOrgMenu(!showOrgMenu)}
          className="sidebar-dark-btn"
        >
          <div className="h-6 w-6 rounded flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}>
            {activeOrg?.name?.[0]?.toUpperCase() ?? 'S'}
          </div>
          <span className="flex-1 text-left truncate" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
            {activeOrg?.name ?? 'Organização'}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', showOrgMenu && 'rotate-180')}
            style={{ color: 'rgba(255,255,255,0.3)' }} />
        </button>

        {showOrgMenu && (
          <div className="sidebar-dark-popover">
            {memberships?.map((m) => (
              <button key={m.org_id} onClick={() => handleSwitchOrg(m)}
                className="sidebar-dark-btn rounded-none"
                style={{ borderRadius: 0 }}>
                <div className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  {m.organization.name[0]?.toUpperCase()}
                </div>
                <span className="flex-1 truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {m.organization.name}
                </span>
                {m.org_id === orgId && (
                  <div className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: 'rgba(255,255,255,0.6)' }} />
                )}
              </button>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
            <Link
              href="/new-org"
              onClick={() => { setShowOrgMenu(false); onMobileClose(); }}
              className="sidebar-dark-btn"
              style={{ borderRadius: 0 }}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Nova organização
            </Link>
          </div>
        )}
      </div>

      {/* ── Nav ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-none">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const fullHref = `/${orgId}/${href}`;
          const isActive = pathname.startsWith(fullHref);
          return (
            <Link
              key={href}
              href={fullHref}
              onClick={onMobileClose}
              className={cn('sidebar-dark-nav-item', isActive && 'active')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────── */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={activeMembership?.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
              {getInitials(activeMembership?.profile?.full_name ?? 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {activeMembership?.profile?.full_name ?? '—'}
            </p>
            <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {activeMembership?.profile?.email ?? ''}
            </p>
          </div>
          <div className="flex items-center shrink-0">
            <NotificationBell orgId={orgId} />
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="sidebar-dark-icon-btn relative"
              aria-label="Alternar tema"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all" />
              <Moon className="absolute inset-0 m-auto h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
            </button>
            <button
              onClick={handleSignOut}
              className="sidebar-dark-icon-btn hover:!text-red-400 hover:!bg-red-500/10"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block h-screen w-60 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
