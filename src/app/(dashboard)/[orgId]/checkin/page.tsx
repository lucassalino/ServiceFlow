import { CheckinClient } from '@/modules/checkin/CheckinClient';
import { OrgFeatureGate } from '@/components/OrgFeatureGate';

interface Props { params: Promise<{ orgId: string }> }

export default async function CheckinPage({ params }: Props) {
  const { orgId } = await params;
  return (
    <OrgFeatureGate feature="checkin">
      <CheckinClient orgId={orgId} />
    </OrgFeatureGate>
  );
}
