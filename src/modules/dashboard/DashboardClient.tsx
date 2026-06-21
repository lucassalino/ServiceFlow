'use client';

import { CalendarDays, Users, LayoutGrid, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/lib/utils';
import type { Event } from '@/types/models';

interface DashboardClientProps {
  upcomingEvents: Event[];
  memberCount: number;
  ministryCount: number;
  orgId: string;
}

export function DashboardClient({
  upcomingEvents,
  memberCount,
  ministryCount,
}: DashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximos eventos
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcomingEvents.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membros
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{memberCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ministérios
            </CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ministryCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Próximos eventos</h2>
        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Nenhum evento agendado.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-start justify-between gap-4 py-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                      style={{ backgroundColor: event.color ?? '#6366f1' }}
                    >
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium leading-tight">{event.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.date)} às {formatTime(event.time)}
                      </p>
                      {event.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                  {event.is_published ? (
                    <Badge variant="default" className="flex-shrink-0">
                      Publicado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex-shrink-0">
                      Rascunho
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
