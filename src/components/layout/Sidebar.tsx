'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Users, Music2, BookOpen,
  Settings, Plus, LogOut, CalendarCheck, CalendarDays, CalendarOff, ChevronDown, X, KeyRound, Megaphone, QrCode,
  ClipboardList, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgStore } from '@/stores/orgStore';
import { useOrgMemberships } from '@/hooks/useOrganizations';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { usePlanState, PlanBadge } from '@/components/FeatureGate';
import { useEffect, useState } from 'react';

/**
 * Navegação agrupada — dá hierarquia ao menu em vez de uma lista corrida de
 * doze itens. Os grupos são só rótulos visuais; as rotas não mudaram.
 */
const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: typeof Users }[] }[] = [
  {
    label: 'Início',
    items: [{ href: 'dashboard', label: 'Painel', icon: LayoutDashboard }],
  },
  {
    label: 'Gestão',
    items: [
      { href: 'members',    label: 'Pessoas',     icon: Users },
      { href: 'ministries', label: 'Ministérios', icon: Music2 },
      { href: 'schedule',   label: 'Escalas',     icon: CalendarCheck },
    ],
  },
  {
    label: 'Agenda',
    items: [
      { href: 'events',       label: 'Eventos',           icon: Calendar },
      { href: 'calendar',     label: 'Calendário',        icon: CalendarDays },
      { href: 'checkin',      label: 'Check-in',          icon: QrCode },
      { href: 'availability', label: 'Indisponibilidade', icon: CalendarOff },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: 'songs',     label: 'Repertório', icon: BookOpen },
      { href: 'liturgies', label: 'Roteiros',   icon: ClipboardList },
      { href: 'mural',     label: 'Mural',      icon: Megaphone },
    ],
  },
  {
    label: 'Sistema',
    items: [{ href: 'settings', label: 'Definições', icon: Settings }],
  },
];

const COLLAPSE_KEY = 'wis_sidebar_collapsed';

interface Props {
  orgId: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ orgId, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const { activeOrg, activeMembership, setActiveOrg } = useOrgStore();
  const { data: memberships } = useOrgMemberships();
  const { data: planState } = usePlanState();
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  // A preferência de sidebar recolhida sobrevive à navegação e ao recarregar.
  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_KEY) === '1') setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? '0' : '1');
      return !v;
    });
  }

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
    <div className={cn('sidebar-dark', collapsed && 'sidebar-collapsed')}>

      {/* ── Brand ─────────────────────────────── */}
      <div className="sidebar-dark-section flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #0D3B66 0%, #0F5C6E 100%)', border: '1px solid var(--wis-border-strong)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wis-symbol-white.svg" alt="WIS" style={{ width: '1.15rem', height: 'auto' }} />
          </div>
          <span className="sidebar-hide-collapsed text-[color:var(--wis-text)] font-semibold text-sm tracking-tight shrink-0">WIS</span>
          {planState && <span className="sidebar-hide-collapsed"><PlanBadge state={planState} /></span>}
        </div>
        <button
          onClick={onMobileClose}
          className="sidebar-dark-icon-btn lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={toggleCollapsed}
          className="sidebar-dark-icon-btn hidden lg:flex"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Org switcher ──────────────────────── */}
      <div className="sidebar-dark-section sidebar-hide-collapsed px-3 py-3 relative">
        <button
          onClick={() => setShowOrgMenu(!showOrgMenu)}
          className="sidebar-dark-btn"
        >
          <div className="h-6 w-6 rounded flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
            {activeOrg?.name?.[0]?.toUpperCase() ?? 'S'}
          </div>
          <span className="flex-1 text-left truncate" style={{ color: 'var(--wis-text)', fontWeight: 500 }}>
            {activeOrg?.name ?? 'Organização'}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', showOrgMenu && 'rotate-180')}
            style={{ color: 'var(--wis-text-3)' }} />
        </button>

        {showOrgMenu && (
          <div className="sidebar-dark-popover">
            {memberships?.map((m) => (
              <button key={m.org_id} onClick={() => handleSwitchOrg(m)}
                className="sidebar-dark-btn rounded-none"
                style={{ borderRadius: 0 }}>
                <div className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
                  {m.organization.name[0]?.toUpperCase()}
                </div>
                <span className="flex-1 truncate" style={{ color: 'var(--wis-text)' }}>
                  {m.organization.name}
                </span>
                {m.org_id === orgId && (
                  <div className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: 'var(--wis-surface-4)' }} />
                )}
              </button>
            ))}
            <div style={{ borderTop: '1px solid var(--wis-border)' }} />
            <Link
              href="/new-org"
              onClick={() => { setShowOrgMenu(false); onMobileClose(); }}
              className="sidebar-dark-btn"
              style={{ borderRadius: 0 }}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Nova organização
            </Link>
            <Link
              href="/join-org"
              onClick={() => { setShowOrgMenu(false); onMobileClose(); }}
              className="sidebar-dark-btn"
              style={{ borderRadius: 0 }}
            >
              <KeyRound className="h-3.5 w-3.5 shrink-0" />
              Entrar com código
            </Link>
          </div>
        )}
      </div>

      {/* ── Nav ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none" aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="sidebar-group-label">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const fullHref = `/${orgId}/${href}`;
                const isActive = pathname.startsWith(fullHref);
                return (
                  <Link
                    key={href}
                    href={fullHref}
                    onClick={onMobileClose}
                    title={collapsed ? label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn('sidebar-dark-nav-item', isActive && 'active')}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="sidebar-nav-label">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ────────────────────────────── */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--wis-border)' }}>
        <div className="flex items-center gap-2.5">
          <Link href={`/${orgId}/settings`} onClick={onMobileClose}
            className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg -mx-1 px-1 py-0.5 hover:bg-[var(--wis-surface-2)] transition-colors"
            aria-label="Abrir definições">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={activeMembership?.profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs font-semibold"
                style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
                {getInitials(activeMembership?.profile?.full_name ?? 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--wis-text)' }}>
                {activeMembership?.profile?.full_name ?? '—'}
              </p>
              <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'var(--wis-text-3)' }}>
                {activeMembership?.profile?.email ?? ''}
              </p>
            </div>
          </Link>
          <div className="flex items-center shrink-0">
            <ThemeToggle />
            <NotificationBell orgId={orgId} />
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
      <aside
        className="hidden lg:block h-screen flex-shrink-0 transition-[width] duration-200"
        style={{ width: collapsed ? '4.25rem' : '15rem' }}
      >
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
