import Link from 'next/link';

/** Layout das páginas públicas (privacidade, suporte, termos) — fora do dashboard. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#08090b', color: '#f4f5f7' }}>
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        padding: '1rem 1.25rem',
      }}>
        <Link href="/" style={{
          fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em',
          color: '#fff', textDecoration: 'none',
        }}>
          WIS <span style={{ color: '#8fd0ea' }}>· Worship in Sync</span>
        </Link>
      </header>

      <main style={{ maxWidth: '44rem', margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
        {children}
      </main>

      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.10)',
        padding: '1.5rem 1.25rem', textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          <Link href="/termos" style={{ color: 'rgba(255,255,255,0.55)' }}>Termos de Uso</Link>
          {' · '}
          <Link href="/privacidade" style={{ color: 'rgba(255,255,255,0.55)' }}>Privacidade</Link>
          {' · '}
          <Link href="/suporte" style={{ color: 'rgba(255,255,255,0.55)' }}>Suporte</Link>
        </p>
      </footer>
    </div>
  );
}
