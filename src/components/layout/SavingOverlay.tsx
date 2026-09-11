'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { LoadingRing } from '@/components/ui/LoadingRing';

const SHOW_DELAY_MS = 150;

/**
 * Overlay com o anel de carregamento enquanto qualquer ação (criar evento,
 * guardar, convidar, etc.) está em curso — cobre automaticamente todas as
 * mutations do TanStack Query, sem precisar de estado próprio em cada ecrã.
 * Só aparece se a ação demorar mais de SHOW_DELAY_MS, para não piscar em
 * ações instantâneas.
 */
export function SavingOverlay() {
  const mutatingCount = useIsMutating();
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mutatingCount > 0) {
      if (!showTimerRef.current && !visible) {
        showTimerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      }
    } else {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      setVisible(false);
    }
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [mutatingCount, visible]);

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
      <LoadingRing percent={null} label="A guardar…" />
    </div>
  );
}
