'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchEventActivityAction } from '@/actions/activity';

export function useEventActivity(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['event-activity', eventId],
    queryFn: () => fetchEventActivityAction(eventId),
    enabled,
  });
}
