import { ScheduleClient } from '@/modules/schedule/ScheduleClient';
interface Props { params: Promise<{ orgId: string }> }
export default async function SchedulePage({ params }: Props) {
  const { orgId } = await params;
  return <ScheduleClient orgId={orgId} />;
}
