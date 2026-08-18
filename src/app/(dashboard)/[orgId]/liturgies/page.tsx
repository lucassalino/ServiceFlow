import { LiturgiesClient } from '@/modules/liturgies/LiturgiesClient';
import { OrgFeatureGate } from '@/components/OrgFeatureGate';

interface Props { params: Promise<{ orgId: string }> }

export default async function LiturgiesPage({ params }: Props) {
  const { orgId } = await params;
  return (
    <OrgFeatureGate feature="liturgies">
      <LiturgiesClient orgId={orgId} />
    </OrgFeatureGate>
  );
}
