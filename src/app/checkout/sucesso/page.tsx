import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const metadata = { title: 'Assinatura confirmada · WIS - Services' };

export default function CheckoutSucessoPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000', color: '#fff', padding: '1.5rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <CheckCircle2 style={{ width: '3rem', height: '3rem', color: '#6ee7b7', margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Assinatura confirmada</h1>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
          Obrigado! O pagamento foi processado e o teu plano será atualizado em instantes.
          Se não vires a mudança de imediato nas definições da organização, atualiza a página
          daqui a alguns segundos.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex', padding: '0.6rem 1.2rem', borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)',
            color: '#0a0a0f', fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none',
          }}
        >
          Ir para a organização
        </Link>
      </div>
    </div>
  );
}
