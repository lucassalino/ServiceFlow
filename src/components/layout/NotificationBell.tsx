'use client';

import Link from 'next/link';
import { Bell, CheckCheck, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import { formatDate } from '@/lib/utils';
import type { AppNotification } from '@/types/models';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function NotificationBell({ orgId }: { orgId: string }) {
  const { data: notifications = [], isLoading } = useNotifications();
  const unreadCount = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  function handleOpenNotification(n: AppNotification) {
    if (!n.is_read) markRead.mutate(n.id);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-7 w-7">
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notificações</p>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas como lidas
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">A carregar…</p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Sem notificações por agora.
            </p>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const content = (
                  <div
                    className={`flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-accent ${
                      !n.is_read ? 'bg-accent/40' : ''
                    }`}
                  >
                    <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{n.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {n.event ? `${n.event.name} · ${formatDate(n.event.date)} · ` : ''}
                        {timeAgo(n.sent_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
                return n.event_id ? (
                  <Link
                    key={n.id}
                    href={`/${orgId}/schedule`}
                    onClick={() => handleOpenNotification(n)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    onClick={() => handleOpenNotification(n)}
                    className="block w-full text-left"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
