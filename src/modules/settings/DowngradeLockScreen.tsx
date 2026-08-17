'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchDowngradeLockStateAction, chooseDowngradeSurvivorsAction } from '@/actions/downgrade';

interface Props { orgId: string }

/**
 * Quando a org fica `downgraded_locked` (cancelou a assinatura e ficou acima
 * dos limites do Semente), o admin escolhe até 1 ministério e 10 pessoas
 * para se manterem operacionais — nada é apagado, o resto fica só de leitura.
 *
 * O ecrã só abre sozinho enquanto ainda não houver nenhuma escolha feita.
 * Depois de escolhida uma vez, só reabre pelo botão "Atualizar limites".
 */
export function DowngradeLockScreen({ orgId }: Props) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['downgrade-lock', orgId],
    queryFn: () => fetchDowngradeLockStateAction(orgId),
  });

  const [ministryId, setMinistryId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const alreadyChosen = !!data?.selectedMinistryId || (data?.selectedMemberIds?.length ?? 0) > 0;

  useEffect(() => {
    if (data?.locked) {
      setMinistryId(data.selectedMinistryId ?? null);
      setMemberIds(data.selectedMemberIds ?? []);
    }
  }, [data]);

  // Abre sozinho só na primeira vez (ainda sem escolha feita).
  useEffect(() => {
    if (data?.locked && !alreadyChosen) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.locked, alreadyChosen]);

  if (!data?.locked) return null;

  function toggleMember(id: string) {
    setMemberIds((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      if (prev.length >= 10) {
        toast.error('Só podes escolher até 10 pessoas.');
        return prev;
      }
      return [...prev, id];
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await chooseDowngradeSurvivorsAction(orgId, ministryId, memberIds);
      toast.success('Escolha guardada. Estes ficam operacionais; o resto fica só de leitura.');
      qc.invalidateQueries({ queryKey: ['downgrade-lock', orgId] });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar a escolha');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {alreadyChosen && (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.8rem', borderRadius: '0.5rem',
            background: 'var(--wis-warning-bg)', color: 'var(--wis-warning)',
            border: '1px solid #f3ddb6', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 700,
          }}
        >
          <RefreshCw style={{ width: '0.8rem', height: '0.8rem' }} />
          Atualizar limites do plano
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle style={{ width: '1.1rem', height: '1.1rem', color: 'var(--wis-warning)' }} />
              Assinatura cancelada
            </DialogTitle>
          </DialogHeader>

          <p style={{ fontSize: '0.85rem', color: 'var(--wis-text-2)', marginBottom: '1rem' }}>
            A organização voltou ao plano Semente, mas tem mais pessoas ou ministérios do que o
            Semente permite (10 pessoas · 1 ministério). Nada foi apagado — escolhe abaixo o que
            fica operacional. O resto passa a só leitura até voltares a assinar um plano pago.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--wis-text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ministério ativo (escolhe 1)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {data.ministries?.map((m) => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="radio" name="ministry" checked={ministryId === m.id} onChange={() => setMinistryId(m.id)} />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--wis-text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pessoas ativas ({memberIds.length}/10)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                {data.members?.map((m) => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: '0.6rem 1rem', borderRadius: '0.625rem', border: 'none',
                background: 'linear-gradient(135deg, var(--wis-blue-soft) 0%, #818cf8 100%)',
                color: 'var(--wis-text)', fontWeight: 800, fontSize: '0.85rem', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving && <Loader2 style={{ width: '0.9rem', height: '0.9rem' }} className="animate-spin" />}
              {alreadyChosen ? 'Atualizar escolha' : 'Guardar escolha'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
