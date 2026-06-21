'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Users, Music2, BookOpen,
  Settings, ChevronDown, Plus, LogOut, Moon, Sun, CalendarCheck,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useOrgStore } from '@/stores/orgStore';
import { useOrgMemberships } from '@/hooks/useOrganizations';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: 'dashboard',  label: 'Início',       icon: LayoutDashboard },
  { href: 'events',     label: 'Eventos',      icon: Calendar },
  { href: 'schedule',   label: 'Escalas',      icon: CalendarCheck },
  { href: 'members',    label: 'Pessoas',      icon: Users },
  { href: 'ministries', label: 'Ministérios',  icon: Music2 },
  { href: 'songs',      label: 'Repertório',   icon: BookOpen },
  { href: 'settings',   label: 'Definições',   icon: Settings },
];

export function Sidebar({ orgId }: { orgId: string }) {
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
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r" style={{ backgroundColor: 'hsl(var(--sidebar-background))', borderColor: 'hsl(var(--sidebar-border))' }}>
      <div className="p-3 relative">
        <button
          onClick={() => setShowOrgMenu(!showOrgMenu)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white shrink-0" style={{ backgroundColor: '#4A5A6A' }}>
            {activeOrg?.name?.[0]?.toUpperCase() ?? 'S'}
          </div>
          <span className="flex-1 text-left font-medium truncate">{activeOrg?.name ?? 'ServiceFlow'}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>

        {showOrgMenu && (
          <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-md border bg-popover shadow-md overflow-hidden">
            {memberships?.map((m) => (
              <button key={m.org_id} onClick={() => handleSwitchOrg(m)}
                className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors', m.org_id === orgId && 'bg-accent')}>
                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {m.organization.name[0]?.toUpperCase()}
                </div>
                <span className="truncate">{m.organization.name}</span>
              </button>
            ))}
            <Separator />
            <Link href="/new-org" onClick={() => setShowOrgMenu(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
              <Plus className="h-4 w-4" />Nova organização
            </Link>
          </div>
        )}
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const fullHref = `/${orgId}/${href}`;
            const isActive = pathname.startsWith(fullHref);
            return (
              <Link key={href} href={fullHref}
                className={cn('flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}>
                <Icon className="h-4 w-4 shrink-0" />{label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-3 space-y-1">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="h-7 w-7">
            <AvatarImage src={activeMembership?.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(activeMembership?.profile?.full_name ?? 'U')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{activeMembership?.profile?.full_name ?? '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{activeMembership?.profile?.email ?? ''}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
