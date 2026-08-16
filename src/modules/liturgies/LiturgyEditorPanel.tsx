'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Liturgy, LiturgyMoment } from '@/types/models';
import { useCreateLiturgy, useUpdateLiturgy } from '@/hooks/useLiturgies';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LiturgyMomentDialog } from './LiturgyMomentDialog';

interface Props {
  /** Roteiro a editar, ou null para criar um novo. */
  liturgy: Liturgy | null;
  onClose: () => void;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function LiturgyEditorPanel({ liturgy, onClose }: Props) {
  const createLiturgy = useCreateLiturgy();
  const updateLiturgy = useUpdateLiturgy();

  const [name, setName] = useState(liturgy?.name ?? '');
  const [date, setDate] = useState(liturgy?.date ?? todayISO());
  const [theme, setTheme] = useState(liturgy?.theme ?? '');
  const [keyVerse, setKeyVerse] = useState(liturgy?.key_verse ?? '');
  const [moments, setMoments] = useState<LiturgyMoment[]>(liturgy?.moments ?? []);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [momentDialogOpen, setMomentDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const isPending = createLiturgy.isPending || updateLiturgy.isPending;

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = Number(active.id);
    const to = Number(over.id);
    setMoments((prev) => arrayMove(prev, from, to));
  }

  function openNewMoment() {
    setEditingIndex(null);
    setMomentDialogOpen(true);
  }

  function openEditMoment(index: number) {
    setEditingIndex(index);
    setMomentDialogOpen(true);
  }

  function handleSaveMoment(moment: LiturgyMoment) {
    setMoments((prev) => {
      if (editingIndex === null) return [...prev, moment];
      const next = [...prev];
      next[editingIndex] = moment;
      return next;
    });
  }

  function removeMoment(index: number) {
    setMoments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Dá um nome ao roteiro');
      return;
    }
    const payload = {
      name: name.trim(),
      date: date || null,
      theme: theme.trim(),
      key_verse: keyVerse.trim(),
      moments,
    };
    try {
      if (liturgy) {
        await updateLiturgy.mutateAsync({ id: liturgy.id, ...payload });
        toast.success('Roteiro atualizado');
      } else {
        await createLiturgy.mutateAsync(payload);
        toast.success('Roteiro criado');
      }
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar o roteiro');
    }
  }

  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6 dark-inputs">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button onClick={onClose} className="dark-icon-btn" aria-label="Voltar">
            <ArrowLeft style={{ width: '0.9rem', height: '0.9rem' }} />
          </button>
          <h1 className="text-lg font-bold text-white flex-1 text-center">
            {liturgy ? 'Editar roteiro' : 'Novo roteiro'}
          </h1>
          <button onClick={handleSave} disabled={isPending} className="dark-primary-btn">
            <Save className="h-4 w-4" />
            {isPending ? 'A guardar…' : 'Guardar'}
          </button>
        </div>

        {/* ── Dados do culto ─────────────────────────────── */}
        <div style={{
          background: 'rgba(22,22,26,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0.875rem', padding: '1.25rem',
        }} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="lit-name">Nome do culto</Label>
            <Input id="lit-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Culto de Domingo" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lit-date">Data</Label>
            <Input id="lit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lit-theme">Tema (opcional)</Label>
            <Input id="lit-theme" value={theme} onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Amor e gratidão" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lit-verse">Versículo-chave (opcional)</Label>
            <Input id="lit-verse" value={keyVerse} onChange={(e) => setKeyVerse(e.target.value)}
              placeholder="Ex: João 3:16" />
          </div>
        </div>

        {/* ── Momentos ───────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
          }}>
            Momentos do culto
          </p>
          <button onClick={openNewMoment} className="dark-icon-btn" aria-label="Adicionar momento">
            <Plus style={{ width: '0.8rem', height: '0.8rem' }} />
          </button>
        </div>

        {moments.length === 0 ? (
          <div className="events-dark-empty">
            <ClipboardList className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Ainda sem momentos. Toca em + para adicionar.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={moments.map((_, i) => String(i))} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {moments.map((m, i) => (
                  <SortableMomentRow
                    key={i}
                    id={String(i)}
                    moment={m}
                    index={i}
                    onEdit={() => openEditMoment(i)}
                    onRemove={() => removeMoment(i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <LiturgyMomentDialog
        open={momentDialogOpen}
        onOpenChange={setMomentDialogOpen}
        moment={editingIndex !== null ? moments[editingIndex] : null}
        onSave={handleSaveMoment}
      />
    </div>
  );
}

// ── Linha de momento (arrastável) ──────────────────────────────────────────

function SortableMomentRow({ id, moment, index, onEdit, onRemove }: {
  id: string; moment: LiturgyMoment; index: number;
  onEdit: () => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform), transition,
        opacity: isDragging ? 0.6 : 1, position: 'relative', zIndex: isDragging ? 1 : 'auto',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: 'rgba(22,22,26,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '0.75rem', padding: '0.75rem 0.875rem',
      }}>
        <button
          {...attributes}
          {...listeners}
          style={{
            background: 'none', border: 'none', cursor: 'grab',
            color: 'rgba(255,255,255,0.25)', touchAction: 'none', padding: 0,
          }}
          aria-label="Reordenar"
        >
          <GripVertical style={{ width: '1rem', height: '1rem' }} />
        </button>

        <span style={{
          width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)',
          fontSize: '0.7rem', fontWeight: 700,
        }}>
          {index + 1}
        </span>

        <button
          onClick={onEdit}
          style={{
            flex: 1, minWidth: 0, textAlign: 'left',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <p style={{
            fontSize: '0.85rem', fontWeight: 600, color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {moment.nome}
          </p>
          <MomentSubtitle moment={moment} />
        </button>

        <MomentBadge moment={moment} />

        <button className="dark-icon-btn danger" onClick={onRemove} aria-label="Remover momento">
          <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
        </button>
      </div>
    </div>
  );
}

function MomentSubtitle({ moment }: { moment: LiturgyMoment }) {
  const parts: string[] = [];
  if (moment.musicas.length) parts.push(`🎵 ${moment.musicas.join(' · ')}`);
  if (moment.avisos.length) parts.push(`📢 ${moment.avisos.length} aviso${moment.avisos.length > 1 ? 's' : ''}`);
  if (moment.palavraTema) parts.push(moment.palavraTema);
  if (moment.duracao) parts.push(moment.duracao);
  if (moment.obs) parts.push(moment.obs);
  if (parts.length === 0) return null;
  return (
    <p style={{
      fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.1rem',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {parts.join(' · ')}
    </p>
  );
}

function MomentBadge({ moment }: { moment: LiturgyMoment }) {
  const label = moment.tipo === 'pessoa' ? (moment.responsavel || 'Pessoa')
    : moment.tipo === 'video' ? 'Vídeo' : 'Projeção';
  const color = moment.tipo === 'pessoa' ? '#a5b4fc'
    : moment.tipo === 'video' ? '#f9a8d4' : '#6ee7b7';
  const bg = moment.tipo === 'pessoa' ? 'rgba(165,180,252,0.12)'
    : moment.tipo === 'video' ? 'rgba(249,168,212,0.12)' : 'rgba(110,231,183,0.12)';
  return (
    <span style={{
      flexShrink: 0, maxWidth: '7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
      borderRadius: '9999px', background: bg, color,
    }}>
      {label}
    </span>
  );
}
