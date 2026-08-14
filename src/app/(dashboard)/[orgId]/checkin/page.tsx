import { CheckinClient } from '@/modules/checkin/CheckinClient';
interface Props { params: Promise<{ orgId: string }> }
export default async function CheckinPage({ params }: Props) {
  const { orgId } = await params;
  return <CheckinClient orgId={orgId} />;
}
