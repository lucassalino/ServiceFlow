import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { fetchPublicPlansAction, fetchMyAdminOrgIdAction } from '@/actions/subscriptions';
import type { Currency } from '@/lib/plans';
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
  const [plans, adminOrgId, hdrs] = await Promise.all([
    fetchPublicPlansAction(),
    fetchMyAdminOrgIdAction(),
    headers(),
  ]);
  // O Cloudflare acrescenta este header a todos os pedidos, com o país real
  // do IP — muito mais fiável que o idioma do navegador (há muito PT-PT a
  // navegar com o browser em pt-BR).
  const country = hdrs.get('cf-ipcountry');
  const initialCurrency: Currency = country === 'BR' ? 'BRL' : 'EUR';

  return <PlanosClient plans={plans} adminOrgId={adminOrgId} initialCurrency={initialCurrency} />;
}
