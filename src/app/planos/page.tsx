import type { Metadata } from 'next';
import { Anton } from 'next/font/google';
import { fetchPublicPlansAction, fetchMyAdminOrgIdAction } from '@/actions/subscriptions';
import { PlanosClient } from './PlanosClient';

/**
 * Fonte display condensada da landing. Vem por `next/font`, portanto é
 * auto-hospedada no build — nenhum pedido a um CDN em runtime, e sem o
 * salto de layout típico de fontes externas.
 */
const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--wis-display',
});

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
  return (
    <div className={anton.variable}>
      <PlanosClient plans={plans} adminOrgId={adminOrgId} />
    </div>
  );
}
