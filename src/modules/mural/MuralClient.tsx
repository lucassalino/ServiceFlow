'use client';

import { useState } from 'react';
import { Megaphone, Plus, Pin, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrgStore } from '@/stores/orgStore';
import {
  useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
} from '@/hooks/useAnnouncements';
import type { Announcement } from '@/types/models';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MuralClient() {
  const { activeMembership } = useOrgStore();
  const canManage = activeMembership?.role === 'admin' || activeMembership?.role === 'leader';

  const { data: announcements = [], isLoading } = useAnnouncements();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [formTarget, setFormTarget] = useState<'create' | Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteAnnouncement.mutateAsync(deleteTarget.id);
      toast.success('Recado removido');
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover');
    }
  }

  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Organização
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
              Mural de recados
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Avisos e informações gerais do ministério
            </p>
          </div>
          {canManage && (
            <button onClick={() => setFormTarget('create')} className="dark-primary-btn">
              <Plus className="h-4 w-4" />
              Novo recado
            </button>
          )}
        </div>

        {/* ── List ──────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="events-dark-empty">
            <Megaphone className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Nenhum recado por aqui ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} style={{
                background: 'rgba(22,22,26,0.85)',
                border: a.pinned ? '1px solid rgba(252,211,77,0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.875rem', padding: '1.25rem 1.375rem',
              }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.pinned && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
                        padding: '0.15rem 0.5rem', borderRadius: '9999px',
                        background: 'rgba(252,211,77,0.12)', color: '#fcd34d',
                        border: '1px solid rgba(252,211,77,0.25)',
                      }}>
                        <Pin className="h-2.5 w-2.5" />
                        FIXADO
                      </span>
                    )}
                    <h2 className="font-bold text-white" style={{ fontSize: '1.05rem' }}>{a.title}</h2>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="dark-icon-btn" onClick={() => setFormTarget(a)} title="Editar">
                        <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
                      </button>
                      <button className="dark-icon-btn danger" onClick={() => setDeleteTarget(a)} title="Remover">
                        <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                      </button>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {a.body}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Avatar style={{ width: '1.25rem', height: '1.25rem' }}>
                    <AvatarFallback style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                      {getInitials(a.profile?.full_name ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                    {a.profile?.full_name ?? 'Alguém'} · {formatDateTime(a.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnnouncementFormDialog
        target={formTarget}
        onOpenChange={(open) => { if (!open) setFormTarget(null); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover recado?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que quer remover <strong>{deleteTarget?.title}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteAnnouncement.isPending}
            >
              {deleteAnnouncement.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Create/Edit dialog ──────────────────────────────────────────────────────

function AnnouncementFormDialog({
  target, onOpenChange,
}: {
  target: 'create' | Announcement | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const isEdit = target !== null && target !== 'create';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);

  // Sincroniza o formulário sempre que um novo alvo é aberto.
  const [lastTargetId, setLastTargetId] = useState<string | null>(null);
  const targetId = isEdit ? (target as Announcement).id : target === 'create' ? 'create' : null;
  if (targetId !== lastTargetId) {
    setLastTargetId(targetId);
    if (isEdit) {
      setTitle((target as Announcement).title);
      setBody((target as Announcement).body);
      setPinned((target as Announcement).pinned);
    } else if (target === 'create') {
      setTitle(''); setBody(''); setPinned(false);
    }
  }

  const isPending = createAnnouncement.isPending || updateAnnouncement.isPending;

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) {
      toast.error('Preencha o título e o texto do recado');
      return;
    }
    try {
      if (isEdit) {
        await updateAnnouncement.mutateAsync({ id: (target as Announcement).id, title: title.trim(), body: body.trim(), pinned });
        toast.success('Recado atualizado');
      } else {
        await createAnnouncement.mutateAsync({ title: title.trim(), body: body.trim(), pinned });
        toast.success('Recado publicado');
      }
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar recado' : 'Novo recado'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Título</Label>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Regras de uso do equipamento" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Texto</Label>
            <Textarea id="ann-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Escreva o aviso aqui…" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={pinned} onCheckedChange={(v) => setPinned(v === true)} />
            <span className="text-sm">Fixar no topo</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'A guardar…' : isEdit ? 'Guardar' : 'Publicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
