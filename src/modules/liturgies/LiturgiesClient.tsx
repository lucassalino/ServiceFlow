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
            <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Liturgia
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
              Roteiros de culto
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
              <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : liturgies.length === 0 ? (
          <div className="events-dark-empty">
            <ClipboardList className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {canManage
                ? 'Ainda não há roteiros. Cria o primeiro para organizar o culto.'
                : 'Ainda não há roteiros publicados.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {liturgies.map((l) => (
              <div key={l.id} style={{
                background: 'rgba(22,22,26,0.85)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.875rem', padding: '1.125rem 1.25rem',
              }}>
                <div className="flex items-start justify-between gap-3">
                  <div style={{ minWidth: 0 }}>
                    <h2 className="font-bold text-white" style={{ fontSize: '1.05rem' }}>{l.name}</h2>
                    <p className="flex items-center gap-1.5 mt-1" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                      <CalendarDays style={{ width: '0.8rem', height: '0.8rem' }} />
                      {l.date ? formatDate(l.date) : 'Sem data'}
                      {' · '}
                      {l.moments.length} momento{l.moments.length !== 1 ? 's' : ''}
                    </p>
                    {l.theme && (
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                        {l.theme}
                      </p>
                    )}
                    {l.key_verse && (
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.15rem' }}>
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
                    paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {l.moments.slice(0, 6).map((m, i) => (
                      <span key={i} style={{
                        fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '9999px',
                        background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                      }}>
                        {i + 1}. {m.nome}
                      </span>
                    ))}
                    {l.moments.length > 6 && (
                      <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', color: 'rgba(255,255,255,0.3)' }}>
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
