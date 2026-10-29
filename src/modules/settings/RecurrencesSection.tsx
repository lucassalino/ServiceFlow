'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Repeat } from 'lucide-react';
import { useMinistries } from '@/hooks/useMinistries';
import {
  useRecurrences, useCreateRecurrence, useUpdateRecurrence,
  useToggleRecurrenceActive, useDeleteRecurrence, type RecurrencePayload,
} from '@/hooks/useRecurrences';
import type { EventRecurrence } from '@/actions/recurrences';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const WEEKDAY_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

type FormState = {
  name: string; weekday: number; time: string; arrivalTime: string; location: string; ministryIds: string[];
};
const EMPTY_FORM: FormState = { name: '', weekday: 0, time: '19:00', arrivalTime: '', location: '', ministryIds: [] };

export function RecurrencesSection({ orgId: _orgId }: { orgId: string }) {
  const { data: recurrences = [], isLoading } = useRecurrences();
  const { data: ministries = [] } = useMinistries();
  const create = useCreateRecurrence();
  const update = useUpdateRecurrence();
  const toggleActive = useToggleRecurrenceActive();
  const remove = useDeleteRecurrence();

  const [editing, setEditing] = useState<EventRecurrence | null | 'new'>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const ministryNameById = useMemo(() => new Map(ministries.map((m) => [m.id, m.name])), [ministries]);

  function openNew() { setForm(EMPTY_FORM); setEditing('new'); }
  function openEdit(r: EventRecurrence) {
    setForm({
      name: r.name, weekday: r.weekday, time: r.time, arrivalTime: r.arrivalTime ?? '',
      location: r.location ?? '', ministryIds: r.ministryIds,
    });
    setEditing(r);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Dá um nome ao evento'); return; }
    if (form.ministryIds.length === 0) { toast.error('Escolhe pelo menos um ministério'); return; }
    const payload: RecurrencePayload = {
      name: form.name.trim(), weekday: form.weekday, time: form.time,
      arrivalTime: form.arrivalTime || null, location: form.location.trim() || null,
      ministryIds: form.ministryIds,
    };
    try {
      if (editing === 'new') {
        await create.mutateAsync(payload);
        toast.success('Evento recorrente criado');
      } else if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
        toast.success('Alterações guardadas');
      }
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  function toggleMinistry(id: string) {
    setForm((f) => ({
      ...f,
      ministryIds: f.ministryIds.includes(id) ? f.ministryIds.filter((m) => m !== id) : [...f.ministryIds, id],
    }));
  }

  return (
    <div className="space-y-4">
      <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-2)', lineHeight: 1.6 }}>
        Define eventos que se repetem toda a semana (ex.: culto de domingo). A app gera-os
        automaticamente como rascunho — sempre do mês atual e do mês seguinte — e já sugere
        uma escala com base nas indisponibilidades. Precisas de rever e publicar cada um.
      </p>

      {isLoading ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-3)' }}>A carregar…</p>
      ) : recurrences.length === 0 ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-3)' }}>Nenhum evento recorrente configurado.</p>
      ) : (
        <div className="space-y-2">
          {recurrences.map((r) => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
              padding: '0.65rem 0.85rem', border: '1px solid var(--wis-border)', borderRadius: '0.75rem',
              opacity: r.active ? 1 : 0.55,
            }}>
              <Repeat className="h-4 w-4 shrink-0" style={{ color: 'var(--wis-blue)' }} />
              <div style={{ flex: 1, minWidth: '12rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--wis-text)' }}>{r.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--wis-text-3)' }}>
                  {WEEKDAY_LABEL[r.weekday]} às {r.time.slice(0, 5)}
                  {r.ministryIds.length > 0 && ` · ${r.ministryIds.map((id) => ministryNameById.get(id) ?? '').filter(Boolean).join(', ')}`}
                </p>
              </div>
              <button
                type="button"
                disabled={toggleActive.isPending}
                onClick={async () => {
                  try { await toggleActive.mutateAsync({ id: r.id, active: !r.active }); }
                  catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
                }}
                style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px',
                  cursor: 'pointer', border: '1px solid var(--wis-border-strong)',
                  background: r.active ? 'var(--wis-success-bg)' : 'var(--wis-surface-3)',
                  color: r.active ? 'var(--wis-success)' : 'var(--wis-text-3)',
                }}
              >
                {r.active ? 'Ativo' : 'Pausado'}
              </button>
              <button type="button" onClick={() => openEdit(r)} style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--wis-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Editar
              </button>
              <button
                type="button" title="Eliminar" disabled={remove.isPending}
                onClick={async () => {
                  if (!confirm(`Eliminar "${r.name}"? Os eventos já gerados não são apagados.`)) return;
                  try { await remove.mutateAsync(r.id); toast.success('Eliminado'); }
                  catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wis-text-4)', padding: '0.2rem' }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="dark-primary-btn" onClick={openNew}>
        <Plus className="h-4 w-4" /> Novo evento recorrente
      </button>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === 'new' ? 'Novo evento recorrente' : 'Editar evento recorrente'}</DialogTitle></DialogHeader>
          <div className="dark-inputs space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rec-name">Nome</Label>
              <Input id="rec-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Culto de domingo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rec-weekday">Dia da semana</Label>
                <select
                  id="rec-weekday" value={form.weekday}
                  onChange={(e) => setForm((f) => ({ ...f, weekday: Number(e.target.value) }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  {WEEKDAY_LABEL.map((label, i) => <option key={i} value={i}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rec-time">Hora</Label>
                <Input id="rec-time" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-location">Local (opcional)</Label>
              <Input id="rec-location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Ministérios que participam</Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {ministries.map((m) => (
                  <button
                    key={m.id} type="button" onClick={() => toggleMinistry(m.id)}
                    style={{
                      padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      background: form.ministryIds.includes(m.id) ? 'var(--wis-blue-soft)' : 'var(--wis-surface-3)',
                      color: form.ministryIds.includes(m.id) ? 'var(--wis-blue)' : 'var(--wis-text-2)',
                      border: `1px solid ${form.ministryIds.includes(m.id) ? 'var(--wis-blue-border)' : 'var(--wis-border-strong)'}`,
                    }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <button type="button" className="dark-primary-btn" disabled={create.isPending || update.isPending} onClick={handleSave}>
              {create.isPending || update.isPending ? 'A guardar…' : 'Guardar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
