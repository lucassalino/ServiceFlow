'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useMyParticipation, useSaveMyParticipation } from '@/hooks/useParticipation';
import { resolveFunction } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Modo onboarding muda os textos (ao entrar numa organização). */
  onboarding?: boolean;
}

export function MyParticipationDialog({ orgId, open, onOpenChange, onboarding }: Props) {
  const { data, isLoading } = useMyParticipation(orgId, open);
  const save = useSaveMyParticipation();

  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  // ministryId -> functions[]  (apenas os ministérios selecionados estão no mapa)
  const [selection, setSelection] = useState<Record<string, string[]>>({});

  // Pré-preencher a partir do que já está gravado (perfil + participações + default_functions).
  useEffect(() => {
    if (!open || !data) return;
    setPhone(data.profile.phone ?? '');
    setBirthday(data.profile.birthday ?? '');
    const map: Record<string, string[]> = {};
    for (const m of data.mine) map[m.ministry_id] = m.functions;
    setSelection(map);
  }, [open, data]);

  const defaults = useMemo(() => new Set(data?.profile.default_functions ?? []), [data]);

  function toggleMinistry(minId: string, availableFns: string[]) {
    setSelection((prev) => {
      const next = { ...prev };
      if (minId in next) {
        delete next[minId];
      } else {
        // Ao selecionar, pré-marca as funções deste ministério que o utilizador já costuma fazer.
        next[minId] = availableFns.filter((f) => defaults.has(f));
      }
      return next;
    });
  }

  function toggleFn(minId: string, fn: string) {
    setSelection((prev) => {
      const cur = prev[minId] ?? [];
      const has = cur.includes(fn);
      return { ...prev, [minId]: has ? cur.filter((f) => f !== fn) : [...cur, fn] };
    });
  }

  async function handleSave() {
    try {
      const entries = Object.entries(selection).map(([ministryId, functions]) => ({ ministryId, functions }));
      await save.mutateAsync({ orgId, phone: phone.trim() || null, birthday: birthday || null, entries });
      toast.success('Os teus dados foram guardados');
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{onboarding ? 'Bem-vindo! Completa o teu perfil' : 'As minhas participações'}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {onboarding
              ? 'Diz-nos em que ministérios serves e as tuas funções. Fica gravado para as próximas vezes.'
              : 'Escolhe os ministérios onde serves e as tuas funções.'}
          </p>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">A carregar…</p>
        ) : (
          <div className="space-y-4">
            {/* Dados pessoais */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Telemóvel</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 …" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birthday">Aniversário</Label>
                <Input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              </div>
            </div>

            {/* Ministérios + funções */}
            <div className="space-y-1">
              <Label>Ministérios e funções</Label>
              {(data?.ministries.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground">Esta organização ainda não tem ministérios.</p>
              ) : (
                <ScrollArea className="max-h-[45vh] rounded-md border">
                  <div className="p-2 space-y-0.5">
                    {data!.ministries.map((m) => {
                      const selected = m.id in selection;
                      const fns = selection[m.id] ?? [];
                      const available = (m.functions ?? []).map((k) => resolveFunction(k));
                      return (
                        <div key={m.id}>
                          <label className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent">
                            <Checkbox checked={selected} onCheckedChange={() => toggleMinistry(m.id, m.functions ?? [])} />
                            <span className="text-base">{m.icon}</span>
                            <span className="text-sm flex-1 truncate">{m.name}</span>
                            {selected && fns.length > 0 && (
                              <span className="text-xs text-muted-foreground shrink-0">{fns.length} função{fns.length !== 1 ? 'ões' : ''}</span>
                            )}
                          </label>
                          {selected && available.length > 0 && (
                            <div className="ml-8 pb-1 grid grid-cols-2 gap-0.5">
                              {available.map((f) => (
                                <label key={f.key} className="flex items-center gap-1.5 px-2 py-1.5 text-xs cursor-pointer rounded hover:bg-accent">
                                  <Checkbox checked={fns.includes(f.key)} onCheckedChange={() => toggleFn(m.id, f.key)} />
                                  <span>{f.emoji} {f.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {selected && available.length === 0 && (
                            <p className="ml-8 pb-1 text-[0.7rem] text-muted-foreground">Este ministério não tem funções definidas.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {onboarding ? 'Agora não' : 'Cancelar'}
          </Button>
          <Button onClick={handleSave} disabled={save.isPending || isLoading}>
            {save.isPending ? 'A guardar…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
