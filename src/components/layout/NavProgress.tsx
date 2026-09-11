'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LoadingRing } from '@/components/ui/LoadingRing';

const MIN_VISIBLE_MS = 220;
const FALLBACK_TIMEOUT_MS = 6000;

/**
 * Overlay que aparece assim que o utilizador clica num link interno — não
 * espera a navegação terminar — para dar feedback imediato de que o clique
 * foi registado. Desaparece quando o novo ecrã termina de montar.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef(0);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/') || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const targetPath = href.split('?')[0].split('#')[0];
      if (targetPath === window.location.pathname) return;

      shownAtRef.current = Date.now();
      setVisible(true);

      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      fallbackRef.current = setTimeout(() => setVisible(false), FALLBACK_TIMEOUT_MS);
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    setVisible((wasVisible) => {
      if (!wasVisible) return wasVisible;
      const elapsed = Date.now() - shownAtRef.current;
      const remain = Math.max(0, MIN_VISIBLE_MS - elapsed);
      const t = setTimeout(() => {
        setVisible(false);
        if (fallbackRef.current) clearTimeout(fallbackRef.current);
      }, remain);
      fallbackRef.current && clearTimeout(fallbackRef.current);
      fallbackRef.current = t;
      return wasVisible;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'color-mix(in srgb, var(--wis-canvas) 78%, transparent)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <LoadingRing />
    </div>
  );
}
