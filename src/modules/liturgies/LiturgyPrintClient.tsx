'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { useLiturgies } from '@/hooks/useLiturgies';
import { formatDate } from '@/lib/utils';
import type { LiturgyMoment } from '@/types/models';

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
      <div className="dash-purple-bg" style={{ minHeight: '100vh', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
        A carregar…
      </div>
    );
  }

  if (!liturgy) {
    return (
      <div className="dash-purple-bg" style={{ minHeight: '100vh', padding: '2rem' }}>
        <p style={{ marginBottom: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Roteiro não encontrado.</p>
        <Link href={`/${orgId}/liturgies`} style={{ color: '#fff' }}>Voltar aos roteiros</Link>
      </div>
    );
  }

  return (
    <div className="dash-purple-bg liturgy-print-screen" style={{ minHeight: '100vh' }}>
      {/* Barra de ações — não sai impressa */}
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(10,10,14,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href={`/${orgId}/liturgies`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none',
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
        background: '#fff', color: '#18181b', fontFamily: 'system-ui, sans-serif',
        borderRadius: '0.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a' }}>
          {activeOrg?.name ?? 'Roteiro de culto'}
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.4rem' }}>{liturgy.name}</h1>
        {liturgy.date && (
          <p style={{ fontSize: '0.9rem', color: '#3f3f46' }}>{formatDate(liturgy.date)}</p>
        )}
        {liturgy.theme && (
          <p style={{ fontSize: '0.95rem', color: '#18181b', marginTop: '0.75rem' }}>
            <strong>Tema:</strong> {liturgy.theme}
          </p>
        )}
        {liturgy.key_verse && (
          <p style={{ fontSize: '0.85rem', color: '#71717a', fontStyle: 'italic', marginTop: '0.15rem' }}>
            {liturgy.key_verse}
          </p>
        )}

        <div style={{ borderTop: '2px solid #18181b', margin: '1.5rem 0 1.25rem' }} />

        {liturgy.moments.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Este roteiro ainda não tem momentos.</p>
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
      borderBottom: '1px solid #e4e4e7', breakInside: 'avoid',
    }}>
      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#18181b', width: '1.75rem', flexShrink: 0 }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>
          {moment.nome}
          {responsible && <span style={{ fontWeight: 400, color: '#71717a' }}>  {responsible}</span>}
        </p>

        {moment.musicas.length > 0 && (
          <div style={{ marginTop: '0.35rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, fontStyle: 'italic', color: '#3f3f46' }}>Louvores</p>
            <ol style={{ margin: '0.15rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#3f3f46' }}>
              {moment.musicas.map((mu, j) => <li key={j}>{mu}</li>)}
            </ol>
          </div>
        )}

        {moment.avisos.length > 0 && (
          <ol style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#3f3f46' }}>
            {moment.avisos.map((av, j) => <li key={j}>{av}</li>)}
          </ol>
        )}

        {moment.palavraTema && (
          <p style={{ fontSize: '0.82rem', color: '#3f3f46', marginTop: '0.3rem' }}>
            <strong style={{ fontStyle: 'italic' }}>Tema:</strong> <em style={{ color: '#71717a' }}>{moment.palavraTema}</em>
          </p>
        )}
        {moment.palavraTexto && (
          <p style={{ fontSize: '0.82rem', color: '#3f3f46' }}>
            <strong style={{ fontStyle: 'italic' }}>Texto base:</strong> <em style={{ color: '#71717a' }}>{moment.palavraTexto}</em>
          </p>
        )}
        {moment.obs && (
          <p style={{ fontSize: '0.8rem', color: '#71717a', fontStyle: 'italic', marginTop: '0.3rem' }}>{moment.obs}</p>
        )}
      </div>

      {moment.duracao && (
        <span style={{ fontSize: '0.78rem', color: '#71717a', flexShrink: 0 }}>{moment.duracao}</span>
      )}
    </div>
  );
}
