import { EventsClient } from '@/modules/events/EventsClient';
interface Props { params: Promise<{ orgId: string }> }
export default async function EventsPage({ params }: Props) {
  const { orgId } = await params;
  return <EventsClient orgId={orgId} />;
}
