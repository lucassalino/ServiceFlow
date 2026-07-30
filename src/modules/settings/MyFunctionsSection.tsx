'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useMyParticipation, useSaveMyParticipation } from '@/hooks/useParticipation';
import { MinistryFunctionSelector, type SelectorMinistry } from '@/components/MinistryFunctionSelector';
import { Button } from '@/components/ui/button';

export function MyFunctionsSection({ orgId }: { orgId: string }) {
  const { data, isLoading } = useMyParticipation(orgId, true);
  const save = useSaveMyParticipation();
  const [selection, setSelection] = useState<Record<string, string[]>>({});

  const defaults = useMemo(() => new Set(data?.profile.default_functions ?? []), [data]);

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string[]> = {};
    for (const m of data.mine) map[m.ministry_id] = m.functions;
    setSelection(map);
  }, [data]);

  function toggleMinistry(m: SelectorMinistry) {
    setSelection((prev) => {
      const next = { ...prev };
      if (m.id in next) delete next[m.id];
      else next[m.id] = (m.functions ?? []).filter((f) => defaults.has(f));
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
      // Sem telemóvel/aniversário — esses ficam na secção Perfil.
      await save.mutateAsync({ orgId, entries });
      toast.success('Ministérios e funções guardados');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  return (
    <div className="space-y-4">
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
        Escolhe os ministérios onde serves e, em cada um, as tuas funções. As tuas
        funções ficam guardadas e são pré-preenchidas quando entras noutra organização.
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : (
        <MinistryFunctionSelector
          ministries={(data?.ministries ?? []) as SelectorMinistry[]}
          value={selection}
          onToggleMinistry={toggleMinistry}
          onToggleFunction={toggleFunction}
        />
      )}
      <Button onClick={handleSave} disabled={save.isPending || isLoading}>
        {save.isPending ? 'A guardar…' : 'Guardar'}
      </Button>
    </div>
  );
}
