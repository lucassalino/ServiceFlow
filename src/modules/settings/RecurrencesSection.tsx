'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Repeat, CalendarClock, MapPin, Users2 } from 'lucide-react';
import { useMinistries } from '@/hooks/useMinistries';
import {
  useRecurrences, useCreateRecurrence, useUpdateRecurrence,
  useToggleRecurrenceActive, useDeleteRecurrence, type RecurrencePayload,
} from '@/hooks/useRecurrences';
import type { EventRecurrence, RecurrenceMinistry } from '@/actions/recurrences';
import { resolveFunction } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WEEKDAY_LABEL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

type FormState = {
  name: string; weekday: number; time: string; location: string; ministries: RecurrenceMinistry[];
};
const EMPTY_FORM: FormState = { name: '', weekday: 0, time: '19:00', location: '', ministries: [] };

export function RecurrencesSection({ orgId: _orgId }: { orgId: string }) {
  const { data: recurrences = [], isLoading } = useRecurrences();
  const { data: ministries = [] } = useMinistries();
  const create = useCreateRecurrence();
  const update = useUpdateRecurrence();
  const toggleActive = useToggleRecurrenceActive();
  const remove = useDeleteRecurrence();

  const [editing, setEditing] = useState<EventRecurrence | null | 'new'>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const ministryById = useMemo(() => new Map(ministries.map((m) => [m.id, m])), [ministries]);

  function openNew() { setForm(EMPTY_FORM); setEditing('new'); }
  function openEdit(r: EventRecurrence) {
    setForm({
      name: r.name, weekday: r.weekday, time: r.time,
      location: r.location ?? '', ministries: r.ministries,
    });
    setEditing(r);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Dá um nome ao evento'); return; }
    if (form.ministries.length === 0) { toast.error('Escolhe pelo menos um ministério'); return; }
    const payload: RecurrencePayload = {
      name: form.name.trim(), weekday: form.weekday, time: form.time,
      location: form.location.trim() || null, ministries: form.ministries,
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

  function toggleMinistry(ministryId: string) {
    setForm((f) => {
      const exists = f.ministries.find((m) => m.ministryId === ministryId);
      if (exists) return { ...f, ministries: f.ministries.filter((m) => m.ministryId !== ministryId) };
      return { ...f, ministries: [...f.ministries, { ministryId, functions: [] }] };
    });
  }

  function toggleFunction(ministryId: string, fn: string) {
    setForm((f) => ({
      ...f,
      ministries: f.ministries.map((m) => {
        if (m.ministryId !== ministryId) return m;
        const has = m.functions.includes(fn);
        return { ...m, functions: has ? m.functions.filter((x) => x !== fn) : [...m.functions, fn] };
      }),
    }));
  }

  return (
    <div className="space-y-4">
      <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-2)', lineHeight: 1.6 }}>
        Define eventos que se repetem toda a semana (ex.: culto de domingo). A app gera-os
        automaticamente como rascunho — sempre do mês atual e do mês seguinte — e já sugere
        uma pessoa por função, respeitando indisponibilidades. Precisas de rever e publicar
        cada um.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: 'var(--wis-surface-2)' }} />
          ))}
        </div>
      ) : recurrences.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--wis-border-strong)', borderRadius: '0.75rem' }}>
          <Repeat className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--wis-text-4)' }} />
          <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-3)' }}>Nenhum evento recorrente configurado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recurrences.map((r) => {
            const totalFunctions = r.ministries.reduce((n, m) => n + m.functions.length, 0);
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                padding: '0.75rem 1rem', border: '1px solid var(--wis-border)', borderRadius: '0.875rem',
                background: 'var(--wis-surface)', opacity: r.active ? 1 : 0.55,
              }}>
                <div style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '0.65rem', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--wis-blue-soft)', color: 'var(--wis-blue)',
                }}>
                  <Repeat className="h-4 w-4" />
                </div>
                <div style={{ flex: 1, minWidth: '14rem' }}>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--wis-text)' }}>{r.name}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--wis-text-3)' }}>
                      <CalendarClock className="h-3 w-3" /> {WEEKDAY_LABEL[r.weekday]} às {r.time.slice(0, 5)}
                    </span>
                    {r.location && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--wis-text-3)' }}>
                        <MapPin className="h-3 w-3" /> {r.location}
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--wis-text-3)' }}>
                      <Users2 className="h-3 w-3" />
                      {r.ministries.map((m) => ministryById.get(m.ministryId)?.name).filter(Boolean).join(', ') || 'Sem ministérios'}
                    </span>
                  </div>
                  {totalFunctions > 0 && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--wis-text-4)', marginTop: '0.2rem' }}>
                      Sugere automaticamente {totalFunctions} função(ões)
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={toggleActive.isPending}
                  onClick={async () => {
                    try { await toggleActive.mutateAsync({ id: r.id, active: !r.active }); }
                    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
                  }}
                  style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '9999px',
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wis-text-4)', padding: '0.3rem' }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button type="button" className="dark-primary-btn" onClick={openNew}>
        <Plus className="h-4 w-4" /> Novo evento recorrente
      </button>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent style={{ maxWidth: '34rem', maxHeight: '85vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Novo evento recorrente' : 'Editar evento recorrente'}</DialogTitle>
          </DialogHeader>
          <div className="dark-inputs space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="rec-name">Nome do evento</Label>
              <Input id="rec-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Culto de domingo" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dia da semana</Label>
                <Select value={String(form.weekday)} onValueChange={(v) => setForm((f) => ({ ...f, weekday: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_LABEL.map((label, i) => <SelectItem key={i} value={String(i)}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rec-time">Hora</Label>
                <Input id="rec-time" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-location">Local (opcional)</Label>
              <Input id="rec-location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Igreja Base" />
            </div>

            <div className="space-y-2.5" style={{ borderTop: '1px solid var(--wis-border)', paddingTop: '1rem' }}>
              <div>
                <Label>Ministérios que participam</Label>
                <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', marginTop: '0.2rem' }}>
                  Para cada ministério, escolhe as funções a preencher automaticamente — no máximo
                  uma pessoa por função. Sem funções escolhidas, o admin escala manualmente.
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {ministries.map((m) => {
                  const selected = form.ministries.some((fm) => fm.ministryId === m.id);
                  return (
                    <button
                      key={m.id} type="button" onClick={() => toggleMinistry(m.id)}
                      style={{
                        padding: '0.4rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        background: selected ? 'var(--wis-blue-soft)' : 'var(--wis-surface-3)',
                        color: selected ? 'var(--wis-blue)' : 'var(--wis-text-2)',
                        border: `1px solid ${selected ? 'var(--wis-blue-border)' : 'var(--wis-border-strong)'}`,
                      }}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>

              {form.ministries.map((fm) => {
                const ministry = ministryById.get(fm.ministryId);
                if (!ministry) return null;
                return (
                  <div key={fm.ministryId} style={{
                    padding: '0.7rem 0.85rem', borderRadius: '0.65rem',
                    background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
                  }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--wis-text)', marginBottom: '0.45rem' }}>
                      {ministry.name}
                    </p>
                    {ministry.functions.length === 0 ? (
                      <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-4)' }}>Este ministério ainda não tem funções configuradas.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {ministry.functions.map((fn) => {
                          const { label, emoji } = resolveFunction(fn);
                          const active = fm.functions.includes(fn);
                          return (
                            <button
                              key={fn} type="button" onClick={() => toggleFunction(fm.ministryId, fn)}
                              style={{
                                padding: '0.3rem 0.65rem', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                                background: active ? 'var(--wis-success-bg)' : 'var(--wis-surface-3)',
                                color: active ? 'var(--wis-success)' : 'var(--wis-text-3)',
                                border: `1px solid ${active ? 'var(--wis-border-strong)' : 'var(--wis-border-strong)'}`,
                              }}
                            >
                              {emoji} {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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
