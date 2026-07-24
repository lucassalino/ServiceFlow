'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMyParticipation, useSaveMyDefaultFunctions } from '@/hooks/useParticipation';
import { FunctionChips } from '@/components/FunctionChips';
import { Button } from '@/components/ui/button';

export function MyFunctionsSection({ orgId }: { orgId: string }) {
  const { data } = useMyParticipation(orgId, true);
  const saveFns = useSaveMyDefaultFunctions();
  const [functions, setFunctions] = useState<string[]>([]);

  useEffect(() => {
    if (data) setFunctions(data.profile.default_functions);
  }, [data]);

  function toggle(key: string) {
    setFunctions((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);
  }

  async function handleSave() {
    try {
      await saveFns.mutateAsync(functions);
      toast.success('Funções guardadas');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  return (
    <div className="dark-inputs space-y-4">
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
        Escolhe as funções que costumas fazer. Ficam guardadas e são pré-preenchidas
        quando entras numa organização.
      </p>
      <FunctionChips selected={functions} onToggle={toggle} />
      <Button onClick={handleSave} disabled={saveFns.isPending}>
        {saveFns.isPending ? 'A guardar…' : 'Guardar funções'}
      </Button>
    </div>
  );
}
