import { CalendarClient } from '@/modules/calendar/CalendarClient';

interface Props { params: Promise<{ orgId: string }> }

export default async function CalendarPage({ params }: Props) {
  const { orgId } = await params;
  return <CalendarClient orgId={orgId} />;
}
