import { LiturgiesClient } from '@/modules/liturgies/LiturgiesClient';

interface Props { params: Promise<{ orgId: string }> }

export default async function LiturgiesPage({ params }: Props) {
  const { orgId } = await params;
  return <LiturgiesClient orgId={orgId} />;
}
