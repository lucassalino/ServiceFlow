import type { Metadata } from 'next';
import { PlanosClient } from './PlanosClient';

export const metadata: Metadata = {
  title: 'Planos · WIS - Services',
  description: 'Escalas, eventos e repertório da tua igreja, em sincronia. Vê os planos do WIS - Services.',
  openGraph: {
    title: 'Planos · WIS - Services',
    description: 'Escalas, eventos e repertório da tua igreja, em sincronia.',
  },
};

export default function PlanosPage() {
  return <PlanosClient />;
}
