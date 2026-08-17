'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, Pencil, Trash2, Printer, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { useOrgStore } from '@/stores/orgStore';
import { useLiturgies, useDeleteLiturgy } from '@/hooks/useLiturgies';
import type { Liturgy } from '@/types/models';
import { formatDate } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LiturgyEditorPanel } from './LiturgyEditorPanel';

interface Props { orgId: string }

export function LiturgiesClient({ orgId }: Props) {
  const { activeMembership } = useOrgStore();
  const canManage = activeMembership?.role === 'admin' || activeMembership?.role === 'leader';

  const { data: liturgies = [], isLoading } = useLiturgies();
  const deleteLiturgy = useDeleteLiturgy();

  const [editorTarget, setEditorTarget] = useState<'create' | Liturgy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Liturgy | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteLiturgy.mutateAsync(deleteTarget.id);
      toast.success('Roteiro removido');
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover');
    }
  }

  if (editorTarget !== null) {
    return (
      <LiturgyEditorPanel
        liturgy={editorTarget === 'create' ? null : editorTarget}
        onClose={() => setEditorTarget(null)}
      />
    );
  }

  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: 'var(--wis-text-3)' }}>
              Liturgia
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[color:var(--wis-text)] mt-1">
              Roteiros de culto
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--wis-text-3)' }}>
              A sequência dos momentos de cada culto
            </p>
          </div>
          {canManage && (
            <button onClick={() => setEditorTarget('create')} className="dark-primary-btn">
              <Plus className="h-4 w-4" />
              Novo roteiro
            </button>
          )}
        </div>

        {/* ── Lista ─────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: 'var(--wis-surface-2)' }} />
            ))}
          </div>
        ) : liturgies.length === 0 ? (
          <div className="events-dark-empty">
            <ClipboardList className="h-10 w-10 mb-3" style={{ color: 'var(--wis-text-4)' }} />
            <p className="text-sm" style={{ color: 'var(--wis-text-3)' }}>
              {canManage
                ? 'Ainda não há roteiros. Cria o primeiro para organizar o culto.'
                : 'Ainda não há roteiros publicados.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {liturgies.map((l) => (
              <div key={l.id} style={{
                background: 'var(--wis-surface)',
                border: '1px solid var(--wis-border)',
                borderRadius: '0.875rem', padding: '1.125rem 1.25rem',
              }}>
                <div className="flex items-start justify-between gap-3">
                  <div style={{ minWidth: 0 }}>
                    <h2 className="font-bold text-[color:var(--wis-text)]" style={{ fontSize: '1.05rem' }}>{l.name}</h2>
                    <p className="flex items-center gap-1.5 mt-1" style={{ fontSize: '0.75rem', color: 'var(--wis-text-3)' }}>
                      <CalendarDays style={{ width: '0.8rem', height: '0.8rem' }} />
                      {l.date ? formatDate(l.date) : 'Sem data'}
                      {' · '}
                      {l.moments.length} momento{l.moments.length !== 1 ? 's' : ''}
                    </p>
                    {l.theme && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-2)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                        {l.theme}
                      </p>
                    )}
                    {l.key_verse && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--wis-text-3)', marginTop: '0.15rem' }}>
                        {l.key_verse}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/${orgId}/liturgies/${l.id}/print`} className="dark-icon-btn" title="Imprimir / PDF">
                      <Printer style={{ width: '0.75rem', height: '0.75rem' }} />
                    </Link>
                    {canManage && (
                      <>
                        <button className="dark-icon-btn" onClick={() => setEditorTarget(l)} title="Editar">
                          <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
                        </button>
                        <button className="dark-icon-btn danger" onClick={() => setDeleteTarget(l)} title="Remover">
                          <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {l.moments.length > 0 && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.75rem',
                    paddingTop: '0.75rem', borderTop: '1px solid var(--wis-border)',
                  }}>
                    {l.moments.slice(0, 6).map((m, i) => (
                      <span key={i} style={{
                        fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '9999px',
                        background: 'var(--wis-surface-3)', color: 'var(--wis-text-2)',
                      }}>
                        {i + 1}. {m.nome}
                      </span>
                    ))}
                    {l.moments.length > 6 && (
                      <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', color: 'var(--wis-text-3)' }}>
                        +{l.moments.length - 6}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover roteiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que quer remover <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteLiturgy.isPending}
            >
              {deleteLiturgy.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
