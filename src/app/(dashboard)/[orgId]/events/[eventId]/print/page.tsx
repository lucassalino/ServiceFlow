import { EventPrintClient } from '@/modules/events/EventPrintClient';

interface Props { params: Promise<{ orgId: string; eventId: string }> }

export default async function EventPrintPage({ params }: Props) {
  const { orgId, eventId } = await params;
  return <EventPrintClient orgId={orgId} eventId={eventId} />;
}
