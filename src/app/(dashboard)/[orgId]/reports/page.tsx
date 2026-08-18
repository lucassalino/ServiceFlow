import { ReportsClient } from '@/modules/reports/ReportsClient';
import { OrgFeatureGate } from '@/components/OrgFeatureGate';

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return (
    <OrgFeatureGate feature="engagement_reports">
      <ReportsClient orgId={orgId} />
    </OrgFeatureGate>
  );
}
