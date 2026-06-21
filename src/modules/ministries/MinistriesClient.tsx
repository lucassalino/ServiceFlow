'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrgStore } from '@/stores/orgStore';
import { useMinistries, useDeleteMinistry } from '@/hooks/useMinistries';
import type { Ministry } from '@/types/models';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MinistryDialog } from './MinistryDialog';

export function MinistriesClient() {
  const { activeOrg } = useOrgStore();
  const { data: ministries = [], isLoading } = useMinistries();
  const deleteMinistry = useDeleteMinistry();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Ministry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ministry | null>(null);

  function handleNew() { setSelected(null); setDialogOpen(true); }
  function handleEdit(m: Ministry) { setSelected(m); setDialogOpen(true); }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMinistry.mutateAsync(deleteTarget.id);
      toast.success('Ministério removido');
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ministérios</h1>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Ministério
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      ) : ministries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum ministério criado.</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={handleNew}>
            <Plus className="h-4 w-4" />Criar primeiro
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ministries.map((ministry) => (
            <div key={ministry.id} className="group relative flex flex-col items-center gap-3 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="absolute right-3 top-3 h-3 w-3 rounded-full" style={{ backgroundColor: ministry.color }} />
              <span className="text-4xl leading-none">{ministry.icon}</span>
              <span className="text-center text-sm font-semibold leading-tight">{ministry.name}</span>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(ministry)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(ministry)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MinistryDialog
        orgId={activeOrg?.id ?? ''}
        ministry={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ministério?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres remover <strong>{deleteTarget?.name}</strong>? Esta acção não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete} disabled={deleteMinistry.isPending}>
              {deleteMinistry.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
