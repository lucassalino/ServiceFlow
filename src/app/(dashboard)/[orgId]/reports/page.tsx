import { ReportsClient } from '@/modules/reports/ReportsClient';

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <ReportsClient orgId={orgId} />;
}
