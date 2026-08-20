/**
 * Elementos gráficos "desenhados à mão" da landing /planos.
 *
 * São todos SVG inline, de propósito: não acrescentam nenhum pedido de rede,
 * herdam a cor por `currentColor` e escalam sem perder nitidez. Traços
 * ligeiramente irregulares — a página não deve parecer geométrica.
 */

/**
 * Papel rasgado à mão, não recortado — picos e vales sem regularidade
 * nenhuma, como um bocado de papel que se puxou dos dois lados. Passa a
 * ficar mais alto e mais denteado do que a versão anterior, que era ondulada
 * de mais e parecia recortada a tesoura.
 */
export function TearDivider({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <div className="wis-tear" aria-hidden style={flip ? { transform: 'scaleY(-1)' } : undefined}>
      <svg viewBox="0 0 1200 90" preserveAspectRatio="none" focusable="false">
        <path
          fill={fill}
          d="M0 90 L0 34
             L26 20 L44 38 L61 14 L79 30 L95 8 L118 26 L133 12 L152 33 L171 18
             L189 40 L206 15 L229 28 L246 6 L268 24 L287 11 L309 36 L326 19
             L348 31 L367 9 L389 27 L406 4 L428 22 L449 38 L467 13 L486 29
             L508 6 L527 24 L545 41 L566 16 L584 33 L603 10 L624 27 L642 4
             L664 22 L683 39 L701 14 L723 30 L740 8 L762 26 L781 12 L803 34
             L820 18 L842 30 L861 6 L883 24 L900 40 L922 15 L941 28 L963 5
             L982 23 L1004 38 L1021 13 L1043 30 L1060 8 L1082 26 L1101 12
             L1123 33 L1140 18 L1162 30 L1181 8 L1200 24
             L1200 90 Z"
        />
      </svg>
    </div>
  );
}

/**
 * Bocado de papel solto, com linhas a sugerir texto impresso — não texto
 * real (não temos direitos sobre nenhum recorte de jornal), só a textura.
 * Fica pousado por cima de um `TearDivider`, como se tivesse ficado preso
 * ali quando o papel rasgou.
 */
export function PaperScrap({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`wis-scrap${className ? ` ${className}` : ''}`} style={style} aria-hidden />;
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

/**
 * Autocolante de recorte — a mesma ideia das fotos "sticker" com margem
 * branca rasgada e halftone que às vezes se vê em colagens de jornal, mas
 * feito só com CSS (`clip-path` irregular + pontos em radial-gradient),
 * para não depender de nenhuma imagem externa. Recebe qualquer ícone do
 * lucide-react no centro.
 */
export function Sticker({
  icon: Icon, className, style,
}: { icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`wis-sticker${className ? ` ${className}` : ''}`} style={style} aria-hidden>
      <Icon size={30} strokeWidth={1.5} />
    </div>
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
