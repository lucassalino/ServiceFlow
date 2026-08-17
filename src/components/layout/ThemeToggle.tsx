'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

/**
 * Alterna entre tema claro e escuro. O tema é guardado pelo next-themes e a
 * predefinição é o do sistema — quem tem o telemóvel em modo escuro abre a
 * app já escura.
 *
 * O ícone só é decidido depois de montar: no servidor não sabemos qual é o
 * tema do utilizador, e pintar o ícone errado provocaria um salto visual.
 */
export function ThemeToggle({ className = 'sidebar-dark-icon-btn' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className}
      aria-label={label}
      title={label}
    >
      {mounted && isDark
        ? <Sun className="h-4 w-4" aria-hidden />
        : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
