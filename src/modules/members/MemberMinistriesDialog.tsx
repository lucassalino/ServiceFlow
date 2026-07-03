'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMinistries } from '@/hooks/useMinistries';
import { useMemberMinistries, useUpsertMemberMinistries } from '@/hooks/useMembers';
import { MEMBER_FUNCTIONS } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  userId: string;
  memberName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Assignment = { ministryId: string; functions: string[] };

export function MemberMinistriesDialog({ userId, memberName, open, onOpenChange }: Props) {
  const { data: ministries = [] } = useMinistries();
  const { data: currentAssignments } = useMemberMinistries(open ? userId : null);
  const upsert = useUpsertMemberMinistries();

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    if (!open || !currentAssignments) return;
    setAssignments(
      currentAssignments.map((a) => ({ ministryId: a.ministry_id, functions: a.functions })),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, currentAssignments]);

  useEffect(() => { if (!open) setAssignments([]); }, [open]);

  const activeMinistries = ministries.filter((m) => m.is_active);

  function isIn(ministryId: string) { return assignments.some((a) => a.ministryId === ministryId); }
  function getFns(ministryId: string) { return assignments.find((a) => a.ministryId === ministryId)?.functions ?? []; }

  function toggleMinistry(ministryId: string) {
    setAssignments((prev) =>
      prev.some((a) => a.ministryId === ministryId)
        ? prev.filter((a) => a.ministryId !== ministryId)
        : [...prev, { ministryId, functions: [] }],
    );
  }

  function toggleFn(ministryId: string, fn: string) {
    setAssignments((prev) => prev.map((a) => {
      if (a.ministryId !== ministryId) return a;
      const has = a.functions.includes(fn);
      return { ...a, functions: has ? a.functions.filter((f) => f !== fn) : [...a.functions, fn] };
    }));
  }

  async function handleSave() {
    try {
      await upsert.mutateAsync({ userId, assignments });
      toast.success('Ministérios actualizados');
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ministérios de {memberName}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Seleciona os ministérios e as funções de cada um.
          </p>
        </DialogHeader>

        {activeMinistries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum ministério activo na organização.
          </p>
        ) : (
          <ScrollArea className="max-h-[55vh] rounded-md border">
            <div className="p-2 space-y-1">
              {activeMinistries.map((ministry) => {
                const color = ministry.color ?? '#a5b4fc';
                const selected = isIn(ministry.id);
                const fns = getFns(ministry.id);
                const availableFunctions = ministry.functions?.length
                  ? MEMBER_FUNCTIONS.filter((f) => ministry.functions.includes(f.key))
                  : MEMBER_FUNCTIONS;

                return (
                  <div key={ministry.id}>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.625rem 0.5rem', borderRadius: '0.5rem', cursor: 'pointer',
                    }}
                      className="hover:bg-accent">
                      <Checkbox checked={selected} onCheckedChange={() => toggleMinistry(ministry.id)} />
                      <div style={{
                        width: '1.75rem', height: '1.75rem', borderRadius: '0.4rem', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${color}20`, border: `1px solid ${color}35`,
                        fontSize: '0.8rem', fontWeight: 800, color,
                      }}>
                        {ministry.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm flex-1">{ministry.name}</span>
                      {selected && fns.length > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {fns.length} função{fns.length !== 1 ? 'ões' : ''}
                        </span>
                      )}
                    </label>

                    {selected && availableFunctions.length > 0 && (
                      <div className="ml-8 pb-1 grid grid-cols-2 gap-0.5">
                        {availableFunctions.map((f) => (
                          <label key={f.key}
                            className="flex items-center gap-1.5 px-2 py-1.5 text-xs cursor-pointer rounded hover:bg-accent">
                            <Checkbox
                              checked={fns.includes(f.key)}
                              onCheckedChange={() => toggleFn(ministry.id, f.key)}
                            />
                            <span>{f.emoji} {f.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? 'A guardar…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
