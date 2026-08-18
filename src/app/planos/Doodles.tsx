/**
 * Elementos gráficos "desenhados à mão" da landing /planos.
 *
 * São todos SVG inline, de propósito: não acrescentam nenhum pedido de rede,
 * herdam a cor por `currentColor` e escalam sem perder nitidez. Traços
 * ligeiramente irregulares — a página não deve parecer geométrica.
 */

export function TearDivider({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <div className="wis-tear" aria-hidden style={flip ? { transform: 'scaleY(-1)' } : undefined}>
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" focusable="false">
        <path
          fill={fill}
          d="M0 60 L0 26 C 48 14 96 30 148 22 C 210 12 236 34 292 28 C 350 22 372 6 430 16
             C 484 25 516 12 566 20 C 626 30 654 10 712 18 C 770 26 796 8 852 16
             C 912 25 940 6 998 16 C 1052 25 1084 12 1136 20 C 1166 25 1184 32 1200 24 L1200 60 Z"
        />
      </svg>
    </div>
  );
}

/** Mancha de tinta azul espalhada — fundo da composição do hero. */
export function InkBlob({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 420 420" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M228 22c46-8 92 14 118 52 27 40 20 92 8 138-11 44-31 89-68 114-40 27-95 29-139 10-43-19-75-58-90-103-14-44-9-95 17-133 25-37 68-58 111-70 14-4 28-6 43-8z"
      />
      {/* salpicos */}
      <circle fill="currentColor" cx="42" cy="126" r="13" />
      <circle fill="currentColor" cx="24" cy="196" r="7" />
      <circle fill="currentColor" cx="386" cy="272" r="11" />
      <circle fill="currentColor" cx="402" cy="212" r="6" />
      <circle fill="currentColor" cx="330" cy="386" r="9" />
      <circle fill="currentColor" cx="96" cy="392" r="6" />
    </svg>
  );
}

/** Seta curva desenhada à mão (aponta para a direita por omissão). */
export function HandArrow({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 90 42" fill="none" aria-hidden focusable="false">
      <path
        d="M3 30C16 12 40 4 74 12"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M58 4c7 3 12 6 17 8-5 5-8 10-11 17"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Seta longa a apontar para baixo/diagonal — usada junto ao título do hero. */
export function HandArrowDown({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 70 96" fill="none" aria-hidden focusable="false">
      <path d="M12 4c14 24 20 48 16 78" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M8 62c6 12 14 20 20 26 6-10 14-16 24-20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Sublinhado a pincel — corre por baixo de uma palavra. */
export function BrushUnderline({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 300 18" fill="none" preserveAspectRatio="none" aria-hidden focusable="false">
      <path
        d="M4 12c58-7 116-9 174-6 34 2 68 6 118 2"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Círculo rabiscado, para envolver uma palavra. */
export function ScribbleCircle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 320 90" fill="none" preserveAspectRatio="none" aria-hidden focusable="false">
      <path
        d="M162 6C96 4 26 18 12 44c-13 25 44 40 118 41 78 1 168-13 178-40 8-22-42-35-104-39"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Estrela de 4 pontas — pequeno marcador de destaque. */
export function Sparkle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="currentColor" d="M12 0c1.4 6.6 4.9 10.2 12 12-7.1 1.8-10.6 5.4-12 12-1.4-6.6-4.9-10.2-12-12C7.1 10.2 10.6 6.6 12 0z" />
    </svg>
  );
}

/**
 * Recorte de jornal: um retalho de papel com colunas de "texto" impresso,
 * rasgado nos quatro lados. As linhas são barras finas — legibilidade zero
 * de propósito, é textura, não conteúdo.
 */
export function NewsClipping({
  className, style, lines = 7, columns = 2,
}: {
  className?: string;
  style?: React.CSSProperties;
  lines?: number;
  columns?: number;
}) {
  const colWidth = 100 / columns;
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 120 90"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id="wis-clip-tear">
          {/* Contorno irregular — os quatro lados rasgados à mão */}
          <path d="M3 6 L18 2 L34 7 L52 1 L70 6 L88 2 L104 7 L117 3 L115 20 L119 38 L114 56 L118 74 L113 86
                   L96 89 L78 84 L60 89 L42 85 L24 89 L8 85 L2 72 L6 54 L1 36 L5 20 Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#wis-clip-tear)">
        <rect width="120" height="90" fill="#e8e5dd" />
        {/* Manchete */}
        <rect x="8" y="10" width="60" height="6" fill="#1a1a1a" opacity="0.82" />
        <rect x="8" y="19" width="38" height="4" fill="#1a1a1a" opacity="0.6" />
        {/* Colunas de texto */}
        {Array.from({ length: columns }).map((_, c) =>
          Array.from({ length: lines }).map((_, l) => (
            <rect
              key={`${c}-${l}`}
              x={8 + c * colWidth}
              y={30 + l * 6}
              width={colWidth - 12 - (l % 3 === 2 ? 8 : 0)}
              height="2.4"
              fill="#1a1a1a"
              opacity="0.34"
            />
          )),
        )}
      </g>
    </svg>
  );
}

/** Fita adesiva — o pedaço de papel parece colado à página. */
export function TapeStrip({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 90 26" aria-hidden focusable="false">
      <path
        d="M2 7 L88 2 L86 20 L4 24 Z"
        fill="currentColor"
        opacity="0.42"
      />
    </svg>
  );
}
