'use client';

import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/**
 * Barra de atividade no topo. Aparece sempre que há uma gravação/edição em
 * curso (mutação) ou os dados estão a ser recarregados, dando um sinal claro
 * de "a carregar…" em qualquer ecrã ao gravar ou editar.
 */
export function GlobalActivityBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      return;
    }
    const t = setTimeout(() => setVisible(false), 350);
    return () => clearTimeout(t);
  }, [active]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        zIndex: 210, pointerEvents: 'none', overflow: 'hidden',
        background: 'var(--wis-surface-3)',
        opacity: active ? 1 : 0, transition: 'opacity 0.3s ease-out',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, height: '100%', width: '40%',
          background: 'linear-gradient(90deg, transparent, var(--wis-blue-soft), var(--wis-success-bg), transparent)',
          boxShadow: '0 0 10px var(--wis-blue-soft)',
          animation: 'wis-activity 1.1s ease-in-out infinite',
        }}
      />
    </div>
  );
}
