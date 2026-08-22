'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { useLiturgies } from '@/hooks/useLiturgies';
import { formatDate } from '@/lib/utils';
import type { LiturgyMoment } from '@/types/models';

/**
 * A folha impressa é sempre branca, mesmo com a app em tema escuro — por
 * isso as cores do texto aqui são fixas, nunca `var(--wis-text*)`: essas
 * variáveis mudam de valor com o tema e, no escuro, ficavam quase
 * ilegíveis sobre o papel branco (só o contentor tinha a cor forçada, o
 * texto lá dentro herdava do tema).
 */
const PRINT_TEXT = '#18181b';
const PRINT_TEXT_3 = '#71717a';
const PRINT_BORDER = '#e4e4e7';

interface Props { orgId: string; liturgyId: string }

export function LiturgyPrintClient({ orgId, liturgyId }: Props) {
  const { activeOrg } = useOrgStore();
  const { data: liturgies = [], isLoading } = useLiturgies();
  const liturgy = liturgies.find((l) => l.id === liturgyId) ?? null;

  // ?print=1 (usado pelo botão "Exportar" do evento) abre logo a caixa de
  // impressão/guardar-PDF, sem obrigar a um segundo clique.
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';
  const printedRef = useRef(false);
  useEffect(() => {
    if (!autoPrint || !liturgy || printedRef.current) return;
    printedRef.current = true;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [autoPrint, liturgy]);

  if (isLoading) {
    return (
      <div className="dash-purple-bg" style={{ minHeight: '100vh', padding: '2rem', color: 'var(--wis-text-2)' }}>
        A carregar…
      </div>
    );
  }

  if (!liturgy) {
    return (
      <div className="dash-purple-bg" style={{ minHeight: '100vh', padding: '2rem' }}>
        <p style={{ marginBottom: '0.75rem', color: 'var(--wis-text-2)' }}>Roteiro não encontrado.</p>
        <Link href={`/${orgId}/liturgies`} style={{ color: 'var(--wis-text)' }}>Voltar aos roteiros</Link>
      </div>
    );
  }

  return (
    <div className="dash-purple-bg liturgy-print-screen" style={{ minHeight: '100vh' }}>
      {/* Barra de ações — não sai impressa */}
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--wis-border)',
        background: 'var(--wis-surface)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href={`/${orgId}/liturgies`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.85rem', color: 'var(--wis-text-2)', textDecoration: 'none',
        }}>
          <ArrowLeft size={16} /> Voltar aos roteiros
        </Link>
        <button onClick={() => window.print()} className="dark-primary-btn">
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* Folha imprimível — mantém-se branca (é o que sai no PDF) */}
      <div id="print-area" style={{
        maxWidth: '780px', margin: '2rem auto', padding: '2.5rem 2rem',
        background: '#ffffff', color: '#18181b', fontFamily: 'system-ui, sans-serif',
        borderRadius: '0.75rem', boxShadow: 'var(--wis-shadow-md)',
      }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: PRINT_TEXT_3 }}>
          {activeOrg?.name ?? 'Roteiro de culto'}
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.4rem', color: PRINT_TEXT }}>{liturgy.name}</h1>
        {liturgy.date && (
          <p style={{ fontSize: '0.9rem', color: PRINT_TEXT }}>{formatDate(liturgy.date)}</p>
        )}
        {liturgy.theme && (
          <p style={{ fontSize: '0.95rem', color: PRINT_TEXT, marginTop: '0.75rem' }}>
            <strong>Tema:</strong> {liturgy.theme}
          </p>
        )}
        {liturgy.key_verse && (
          <p style={{ fontSize: '0.85rem', color: PRINT_TEXT_3, fontStyle: 'italic', marginTop: '0.15rem' }}>
            {liturgy.key_verse}
          </p>
        )}

        <div style={{ borderTop: `2px solid ${PRINT_BORDER}`, margin: '1.5rem 0 1.25rem' }} />

        {liturgy.moments.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: PRINT_TEXT_3 }}>Este roteiro ainda não tem momentos.</p>
        ) : (
          liturgy.moments.map((m, i) => <PrintMoment key={i} moment={m} index={i} />)
        )}
      </div>
    </div>
  );
}

function PrintMoment({ moment, index }: { moment: LiturgyMoment; index: number }) {
  const responsible = moment.tipo === 'pessoa' ? moment.responsavel
    : moment.tipo === 'video' ? 'Vídeo' : 'Projeção';

  return (
    <div style={{
      display: 'flex', gap: '0.9rem', padding: '0.75rem 0',
      borderBottom: `1px solid ${PRINT_BORDER}`, breakInside: 'avoid',
    }}>
      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: PRINT_TEXT, width: '1.75rem', flexShrink: 0 }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: PRINT_TEXT }}>
          {moment.nome}
          {responsible && <span style={{ fontWeight: 400, color: PRINT_TEXT_3 }}>  {responsible}</span>}
        </p>

        {moment.musicas.length > 0 && (
          <div style={{ marginTop: '0.35rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, fontStyle: 'italic', color: PRINT_TEXT }}>Louvores</p>
            <ol style={{ margin: '0.15rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: PRINT_TEXT }}>
              {moment.musicas.map((mu, j) => <li key={j}>{mu}</li>)}
            </ol>
          </div>
        )}

        {moment.avisos.length > 0 && (
          <ol style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: PRINT_TEXT }}>
            {moment.avisos.map((av, j) => <li key={j}>{av}</li>)}
          </ol>
        )}

        {moment.palavraTema && (
          <p style={{ fontSize: '0.82rem', color: PRINT_TEXT, marginTop: '0.3rem' }}>
            <strong style={{ fontStyle: 'italic' }}>Tema:</strong> <em style={{ color: PRINT_TEXT_3 }}>{moment.palavraTema}</em>
          </p>
        )}
        {moment.palavraTexto && (
          <p style={{ fontSize: '0.82rem', color: PRINT_TEXT }}>
            <strong style={{ fontStyle: 'italic' }}>Texto base:</strong> <em style={{ color: PRINT_TEXT_3 }}>{moment.palavraTexto}</em>
          </p>
        )}
        {moment.obs && (
          <p style={{ fontSize: '0.8rem', color: PRINT_TEXT_3, fontStyle: 'italic', marginTop: '0.3rem' }}>{moment.obs}</p>
        )}
      </div>

      {moment.duracao && (
        <span style={{ fontSize: '0.78rem', color: PRINT_TEXT_3, flexShrink: 0 }}>{moment.duracao}</span>
      )}
    </div>
  );
}
