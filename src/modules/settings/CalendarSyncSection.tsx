'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarSync, Copy, Check, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import {
  fetchCalendarFeedAction, createCalendarFeedAction,
  regenerateCalendarFeedAction, deleteCalendarFeedAction,
} from '@/actions/calendar-feed';
import { copyToClipboard, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FeatureGate } from '@/components/FeatureGate';

/**
 * Subscrição do calendário pessoal.
 *
 * Ao contrário do botão "Guardar no calendário" (um evento, uma fotografia),
 * o feed mantém-se sincronizado: se a escala mudar, o calendário acompanha.
 */
export function CalendarSyncSection({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const { data: feed, isLoading } = useQuery({
    queryKey: ['calendar-feed', orgId],
    queryFn: () => fetchCalendarFeedAction(orgId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['calendar-feed', orgId] });

  const create = useMutation({
    mutationFn: () => createCalendarFeedAction(orgId),
    onSuccess: () => { invalidate(); toast.success('Link criado'); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Erro'),
  });

  const regenerate = useMutation({
    mutationFn: () => regenerateCalendarFeedAction(orgId),
    onSuccess: () => {
      invalidate(); setConfirmRegen(false);
      toast.success('Link novo gerado. O anterior deixou de funcionar.');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Erro'),
  });

  const remove = useMutation({
    mutationFn: () => deleteCalendarFeedAction(orgId),
    onSuccess: () => { invalidate(); toast.success('Sincronização desativada'); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Erro'),
  });

  async function handleCopy() {
    if (!feed) return;
    const ok = await copyToClipboard(feed.url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copiado');
    } else {
      toast.error('Não foi possível copiar');
    }
  }

  return (
    <FeatureGate feature="calendar_sync">
    <div className="space-y-4">
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
        Subscreve as tuas escalas no Google Calendar ou no Calendário da Apple.
        Ao contrário de guardar um evento de cada vez, este link{' '}
        <strong style={{ color: 'rgba(255,255,255,0.75)' }}>mantém-se atualizado</strong>:
        se a escala mudar, o teu calendário acompanha.
      </p>

      {isLoading ? (
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>A carregar…</p>
      ) : !feed ? (
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          <CalendarSync className="h-4 w-4" />
          {create.isPending ? 'A criar…' : 'Ativar sincronização'}
        </Button>
      ) : (
        <>
          {/* Link */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 0.75rem', borderRadius: '0.625rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <code style={{
              flex: 1, minWidth: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {feed.url}
            </code>
            <button
              onClick={handleCopy}
              aria-label="Copiar link"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0,
                padding: '0.3rem 0.6rem', borderRadius: '0.4rem', cursor: 'pointer',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                color: copied ? '#6ee7b7' : 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600,
              }}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          {/* Aviso de privacidade — consentimento informado */}
          <div style={{
            display: 'flex', gap: '0.625rem', padding: '0.75rem 0.875rem', borderRadius: '0.625rem',
            background: 'rgba(252,211,77,0.07)', border: '1px solid rgba(252,211,77,0.2)',
          }}>
            <ShieldAlert style={{ width: '0.9rem', height: '0.9rem', color: '#fcd34d', flexShrink: 0, marginTop: '0.1rem' }} />
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
              Trata este link como uma palavra-passe: <strong>quem o tiver consegue ver
              as tuas escalas</strong>, sem precisar de entrar na app. Se o partilhares
              por engano, gera um link novo — o antigo deixa de funcionar.
            </p>
          </div>

          {/* Como usar */}
          <details>
            <summary style={{ fontSize: '0.8rem', color: '#a5b4fc', cursor: 'pointer' }}>
              Como adicionar ao meu calendário
            </summary>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginTop: '0.5rem' }}>
              <p style={{ margin: '0 0 0.5rem' }}>
                <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Google Calendar:</strong>{' '}
                no computador, Outros calendários → + → A partir de URL → cola o link.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: 'rgba(255,255,255,0.65)' }}>iPhone / Apple:</strong>{' '}
                Definições → Aplicações → Calendário → Contas → Adicionar Conta →
                Outra → toca em <strong>&quot;Calendário Assinado&quot;</strong> (não
                &quot;Conta CalDAV&quot;) → cola o link → Seguinte → Guardar.
              </p>
            </div>
          </details>

          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            Criado a {formatDate(feed.createdAt)}
            {feed.lastUsedAt
              ? ` · última leitura a ${formatDate(feed.lastUsedAt)}`
              : ' · ainda não foi lido por nenhum calendário'}
          </p>

          {/* Ações */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {confirmRegen ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setConfirmRegen(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
                  {regenerate.isPending ? 'A gerar…' : 'Confirmar — invalidar o antigo'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setConfirmRegen(true)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Gerar link novo
                </Button>
                <Button variant="outline" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Desativar
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
    </FeatureGate>
  );
}
