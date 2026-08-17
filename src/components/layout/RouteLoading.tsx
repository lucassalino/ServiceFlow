import { Loader2 } from 'lucide-react';

/** Indicador de carregamento centrado — usado nos loading.tsx das rotas. */
export function RouteLoading() {
  return (
    <div
      className="dash-purple-bg"
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5rem 1rem',
      }}
    >
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--wis-text-2)' }} />
    </div>
  );
}
