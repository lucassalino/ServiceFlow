import { Suspense } from 'react';
import { LiturgyPrintClient } from '@/modules/liturgies/LiturgyPrintClient';

interface Props { params: Promise<{ orgId: string; liturgyId: string }> }

export default async function LiturgyPrintPage({ params }: Props) {
  const { orgId, liturgyId } = await params;
  return (
    <Suspense fallback={null}>
      <LiturgyPrintClient orgId={orgId} liturgyId={liturgyId} />
    </Suspense>
  );
}
