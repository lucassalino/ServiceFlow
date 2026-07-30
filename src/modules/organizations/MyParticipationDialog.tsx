'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useMyParticipation, useSaveMyParticipation } from '@/hooks/useParticipation';
import { MinistryFunctionSelector, type SelectorMinistry } from '@/components/MinistryFunctionSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onboarding?: boolean;
}

export function MyParticipationDialog({ orgId, open, onOpenChange, onboarding }: Props) {
  const { data, isLoading } = useMyParticipation(orgId, open);
  const save = useSaveMyParticipation();

  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  // ministryId -> funções escolhidas (só ministérios selecionados)
  const [selection, setSelection] = useState<Record<string, string[]>>({});

  const defaults = useMemo(() => new Set(data?.profile.default_functions ?? []), [data]);

  useEffect(() => {
    if (!open || !data) return;
    setPhone(data.profile.phone ?? '');
    setBirthday(data.profile.birthday ?? '');
    const map: Record<string, string[]> = {};
    for (const m of data.mine) map[m.ministry_id] = m.functions;
    setSelection(map);
  }, [open, data]);

  function toggleMinistry(m: SelectorMinistry) {
    setSelection((prev) => {
      const next = { ...prev };
      if (m.id in next) {
        delete next[m.id];
      } else {
        // Pré-marca as funções deste ministério que o utilizador já costuma fazer.
        next[m.id] = (m.functions ?? []).filter((f) => defaults.has(f));
      }
      return next;
    });
  }

  function toggleFunction(minId: string, fnKey: string) {
    setSelection((prev) => {
      const cur = prev[minId] ?? [];
      const has = cur.includes(fnKey);
      return { ...prev, [minId]: has ? cur.filter((f) => f !== fnKey) : [...cur, fnKey] };
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
              ? 'Escolhe os teus ministérios e funções, e preenche os teus dados. Fica gravado para as próximas vezes.'
              : 'Escolhe os ministérios onde serves e, em cada um, as tuas funções.'}
          </p>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">A carregar…</p>
        ) : (
          <div className="space-y-5">
            {/* Dados pessoais */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Telemóvel</Label>
                <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 …" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birthday">Data de nascimento</Label>
                <Input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            {/* Ministérios → funções */}
            <div className="space-y-2">
              <Label>Os meus ministérios e funções</Label>
              <MinistryFunctionSelector
                ministries={(data?.ministries ?? []) as SelectorMinistry[]}
                value={selection}
                onToggleMinistry={toggleMinistry}
                onToggleFunction={toggleFunction}
              />
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
