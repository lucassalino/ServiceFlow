'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Barra fina no topo que pisca em cada mudança de ecrã, dando sinal visual
 * de que a app está a carregar a nova página.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setPhase('loading');
    const t1 = setTimeout(() => setPhase('done'), 450);
    const t2 = setTimeout(() => setPhase('idle'), 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname]);

  if (phase === 'idle') return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '2px',
        zIndex: 200, pointerEvents: 'none',
        background: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: phase === 'loading' ? '85%' : '100%',
          background: 'linear-gradient(90deg, #a5b4fc, #6ee7b7)',
          transition: phase === 'loading' ? 'width 0.45s ease-out' : 'width 0.2s ease-out, opacity 0.3s ease-out',
          opacity: phase === 'done' ? 0 : 1,
          boxShadow: '0 0 8px rgba(165,180,252,0.6)',
        }}
      />
    </div>
  );
}
