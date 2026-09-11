'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import { LoadingRing } from '@/components/ui/LoadingRing';

const MIN_VISIBLE_MS = 220;
const SETTLE_AFTER_NAV_MS = 200;
const FALLBACK_TIMEOUT_MS = 8000;

/**
 * Overlay que aparece assim que o utilizador clica num link interno — não
 * espera a navegação terminar — para dar feedback imediato de que o clique
 * foi registado. Só desaparece quando o novo ecrã montou E as suas queries
 * (TanStack Query) terminaram de carregar.
 */
export function NavProgress() {
  const pathname = usePathname();
  const fetchingCount = useIsFetching();
  const [visible, setVisible] = useState(false);
  const first = useRef(true);
  const shownAtRef = useRef(0);
  const navigatedAtRef = useRef(0);
  const awaitingDataRef = useRef(false);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clique num link interno → mostra o overlay já.
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
      awaitingDataRef.current = false;
      setVisible(true);

      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      fallbackRef.current = setTimeout(() => setVisible(false), FALLBACK_TIMEOUT_MS);
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // A rota mudou (novo ecrã montado) → passa a aguardar as queries dele.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    navigatedAtRef.current = Date.now();
    awaitingDataRef.current = true;
  }, [pathname]);

  // Só esconde quando: já navegou, as queries da nova tela zeraram, e já
  // passou um tempo mínimo desde a navegação (dá tempo às queries arrancarem).
  useEffect(() => {
    if (!visible || !awaitingDataRef.current) return;

    if (settleRef.current) clearTimeout(settleRef.current);

    const check = () => {
      if (fetchingCount > 0) return; // uma query recomeçou — espera o próximo disparo do efeito
      const sinceNav = Date.now() - navigatedAtRef.current;
      const sinceShown = Date.now() - shownAtRef.current;
      const missing = Math.max(SETTLE_AFTER_NAV_MS - sinceNav, MIN_VISIBLE_MS - sinceShown);
      if (missing > 0) {
        settleRef.current = setTimeout(check, missing);
        return;
      }
      setVisible(false);
      awaitingDataRef.current = false;
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    };

    settleRef.current = setTimeout(check, 90);
    return () => { if (settleRef.current) clearTimeout(settleRef.current); };
  }, [fetchingCount, visible, pathname]);

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
