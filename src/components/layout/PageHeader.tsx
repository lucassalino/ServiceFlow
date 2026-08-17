'use client';

import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Filtros/pesquisa, mostrados por baixo do título. */
  toolbar?: ReactNode;
}

/**
 * Cabeçalho partilhado por todas as páginas internas: título, uma linha de
 * contexto, a ação principal e (opcionalmente) a barra de filtros. Manter
 * esta estrutura é o que faz uma página nova parecer logo parte do WIS.
 */
export function PageHeader({ title, subtitle, action, toolbar }: Props) {
  return (
    <div className="wis-page-header">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="wis-page-title">{title}</h1>
          {subtitle && <p className="wis-page-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {toolbar && <div className="wis-page-toolbar">{toolbar}</div>}
    </div>
  );
}
