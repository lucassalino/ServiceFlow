import type { Metadata } from 'next';
import { fetchPublicPlansAction, fetchMyAdminOrgIdAction } from '@/actions/subscriptions';
import { PlanosClient } from './PlanosClient';

export const metadata: Metadata = {
  title: 'Planos · WIS - Services',
  description: 'Escalas, eventos e repertório da tua igreja, em sincronia. Vê os planos do WIS - Services.',
  openGraph: {
    title: 'Planos · WIS - Services',
    description: 'Escalas, eventos e repertório da tua igreja, em sincronia.',
  },
};

export default async function PlanosPage() {
  const [plans, adminOrgId] = await Promise.all([
    fetchPublicPlansAction(),
    fetchMyAdminOrgIdAction(),
  ]);
  return <PlanosClient plans={plans} adminOrgId={adminOrgId} />;
}
