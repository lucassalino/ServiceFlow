'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, CalendarCheck, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const TAB_ITEMS = [
  { href: 'dashboard',  label: 'Início',     icon: LayoutDashboard },
  { href: 'events',     label: 'Eventos',    icon: Calendar },
  { href: 'schedule',   label: 'Escalas',    icon: CalendarCheck },
  { href: 'members',    label: 'Pessoas',    icon: Users },
  { href: 'songs',      label: 'Repertório', icon: BookOpen },
];

export function BottomNav({ orgId }: { orgId: string }) {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex"
      style={{
        background: 'rgba(5,5,5,0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TAB_ITEMS.map(({ href, label, icon: Icon }) => {
        const fullHref = `/${orgId}/${href}`;
        const isActive = pathname.startsWith(fullHref);
        return (
          <Link
            key={href}
            href={fullHref}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-white'
                : 'hover:text-white/70',
            )}
            style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.35)' }}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
