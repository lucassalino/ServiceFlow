'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft, ImagePlus, X, ZoomIn, Search,
  Check, Users, LayoutGrid, ListMusic,
  CalendarDays, Music2, Clock, Plus, CalendarOff, FileUp, GripVertical, AlertTriangle,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateEvent } from '@/hooks/useEvents';
import { useMinistries } from '@/hooks/useMinistries';
import { useSongs } from '@/hooks/useSongs';
import { useOrgUnavailability } from '@/hooks/useAvailability';
import { uploadEventImageAction } from '@/actions/events';
import { fetchEventSetupAction, replaceEventSetupAction } from '@/actions/schedule';
import { unwrapLockGuarded } from '@/lib/downgrade-lock';
import { resolveFunction, SONG_KEYS } from '@/lib/constants';
import { findConflictingUnavailability, describeUnavailability } from '@/lib/availability';
import { fetchMinistryMembersAction } from '@/actions/members';
import type { Event, Ministry, Song } from '@/types/models';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getInitials } from '@/lib/utils';
import { SongCsvImportDialog } from '@/modules/songs/SongCsvImportDialog';
import type { ImportedSong } from '@/actions/setlist-import';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:         z.string().min(1, 'Nome é obrigatório'),
  date:         z.string().min(1, 'Data é obrigatória'),
  time:         z.string().min(1, 'Horário é obrigatório'),
  arrival_time: z.string().nullable().optional(),
  location:     z.string().nullable().optional(),
  description:  z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  is_published: z.boolean().default(false),
});
type FormValues = z.infer<typeof schema>;

const STEPS: { label: string; description: string; icon: React.ReactNode }[] = [
  { label: 'Informações', description: 'Nome, data, horário e local', icon: <CalendarDays style={{ width: '0.9rem', height: '0.9rem' }} /> },
  { label: 'Ministérios', description: 'Quais equipas participam',    icon: <LayoutGrid   style={{ width: '0.9rem', height: '0.9rem' }} /> },
  { label: 'Integrantes', description: 'Escala de membros',           icon: <Users        style={{ width: '0.9rem', height: '0.9rem' }} /> },
  { label: 'Setlist',     description: 'Músicas do evento',           icon: <Music2       style={{ width: '0.9rem', height: '0.9rem' }} /> },
  { label: 'Roteiro',     description: 'Horários do evento',          icon: <Clock        style={{ width: '0.9rem', height: '0.9rem' }} /> },
];

// ── Shared styles ─────────────────────────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.55rem 1.375rem', borderRadius: '0.5rem',
  background: '#fff', color: '#0a0a0f',
  fontSize: '0.875rem', fontWeight: 700,
  border: 'none', cursor: 'pointer', transition: 'opacity 0.12s',
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.55rem 1rem', borderRadius: '0.5rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', fontWeight: 500,
  cursor: 'pointer', transition: 'background 0.12s',
};

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '0.875rem', overflow: 'hidden',
};

const rowBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.875rem',
  padding: '0.75rem 1rem', cursor: 'pointer', transition: 'background 0.1s',
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ current, event, onBack, onStepClick }: {
  current: number; event: Event; onBack: () => void;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="ep-sidebar" style={{
      width: '260px', flexShrink: 0,
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(0,0,0,0.15)',
    }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.45)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          marginBottom: '2.25rem', transition: 'color 0.12s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
      >
        <ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} />
        Voltar ao evento
      </button>

      <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: '0.25rem' }}>
        Editar Evento
      </h1>
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2rem' }}>
        Passo {current} de {STEPS.length}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {STEPS.map((s, i) => {
          const num = i + 1;
          const done = current > num;
          const active = current === num;
          return (
            <button
              key={i}
              onClick={() => onStepClick(num)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.625rem 0.75rem', borderRadius: '0.625rem',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: '1.625rem', height: '1.625rem', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 800,
                border: `2px solid ${active ? '#fff' : done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
                background: active ? '#fff' : 'transparent',
                color: active ? '#0a0a0f' : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.2s',
              }}>
                {done ? <Check style={{ width: '0.7rem', height: '0.7rem' }} /> : num}
              </div>
              <div style={{ paddingTop: '0.05rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: active ? 700 : 500, color: active ? '#fff' : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.22)', lineHeight: 1.3 }}>
                  {s.label}
                </p>
                <p style={{ fontSize: '0.7rem', color: active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)', marginTop: '0.1rem' }}>
                  {s.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Event name chip */}
      <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: '0.5rem' }}>
          A editar
        </p>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.name}
        </p>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.2rem' }}>
          {event.date}
        </p>
      </div>
    </div>
  );
}

// ── Save bar (grava todas as tabs de uma vez) ──────────────────────────────────

function SaveBar({ onCancel, onSave, saving }: {
  onCancel: () => void; onSave: () => void; saving: boolean;
}) {
  return (
    <div className="ep-savebar" style={{
      display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem',
      paddingTop: '1.5rem', marginTop: '2rem',
      borderTop: '1px solid rgba(255,255,255,0.07)',
    }}>
      <button type="button" style={{ ...ghostBtn, opacity: saving ? 0.5 : 1 }} onClick={onCancel} disabled={saving}>
        Cancelar
      </button>
      <button type="button" style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }} onClick={onSave} disabled={saving}>
        <Check style={{ width: '0.9rem', height: '0.9rem' }} />
        {saving ? 'A guardar…' : 'Gravar alterações'}
      </button>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { event: Event; onBack: () => void }

export function EventEditPanel({ event, onBack }: Props) {
  const qc = useQueryClient();
  const updateEvent = useUpdateEvent();
  const { data: ministries = [] } = useMinistries();
  const { data: songs = [] } = useSongs();
  const { data: unavailabilityByUser } = useOrgUnavailability();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [saving, setSaving] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(true);

  // image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event.cover_image_url ?? null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // step 2
  const [selectedMinistryIds, setSelectedMinistryIds] = useState<string[]>([]);

  // step 3
  const [membersByMinistry, setMembersByMinistry] = useState<Record<string, { userId: string; functions: string[] }[]>>({});
  const [ministryRoster, setMinistryRoster] = useState<Record<string, { userId: string; name: string; avatarUrl: string | null; functions: string[] }[]>>({});

  // step 4
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [songKeys, setSongKeys] = useState<Record<string, string>>({});
  const [songNotes, setSongNotes] = useState<Record<string, string>>({});
  const [songSearch, setSongSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  // Junta as músicas importadas do CSV à setlist (mantém ordem, sem duplicar).
  function handleImported(imported: ImportedSong[]) {
    setSelectedSongIds((prev) => {
      const next = [...prev];
      for (const s of imported) if (!next.includes(s.songId)) next.push(s.songId);
      return next;
    });
    setSongKeys((prev) => {
      const next = { ...prev };
      for (const s of imported) if (s.musical_key && !next[s.songId]) next[s.songId] = s.musical_key;
      return next;
    });
  }

  // step 5
  const [timelineItems, setTimelineItems] = useState<{ time: string; title: string }[]>([]);
  const [newTimelineTime, setNewTimelineTime] = useState('');
  const [newTimelineTitle, setNewTimelineTitle] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: event.name, date: event.date, time: event.time,
      arrival_time: event.arrival_time ?? '',
      location: event.location ?? '', description: event.description ?? '',
      observations: event.observations ?? '', is_published: event.is_published,
    },
  });
  const isPublished = watch('is_published');
  const watchedDate = watch('date');
  const watchedTime = watch('time');

  // Pre-load existing setup
  useEffect(() => {
    let cancelled = false;
    setLoadingSetup(true);
    fetchEventSetupAction(event.id)
      .then((setup) => {
        if (cancelled) return;
        setSelectedMinistryIds(setup.ministryIds);
        setMembersByMinistry(setup.membersByMinistry);
        setSelectedSongIds(setup.songIds);
        setSongKeys(setup.songKeys);
        setSongNotes(setup.songNotes);
        setTimelineItems(setup.timeline);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSetup(false); });
    return () => { cancelled = true; };
  }, [event.id]);

  // Load ministry roster (members + their functions) when entering step 3
  useEffect(() => {
    if (step !== 3 || selectedMinistryIds.length === 0) return;
    let cancelled = false;
    type RM = { user_id: string; functions: string[]; profile: { full_name: string; email: string; avatar_url: string | null } | null };
    Promise.all(selectedMinistryIds.map(async (mid) => {
      const members = await fetchMinistryMembersAction(mid);
      return [mid, members as unknown as RM[]] as const;
    }))
      .then((results) => {
        if (cancelled) return;
        const map: Record<string, { userId: string; name: string; avatarUrl: string | null; functions: string[] }[]> = {};
        for (const [mid, members] of results) {
          map[mid] = members.map((m) => ({
            userId: m.user_id,
            name: m.profile?.full_name || m.profile?.email || 'Sem nome',
            avatarUrl: m.profile?.avatar_url ?? null,
            functions: m.functions ?? [],
          }));
        }
        setMinistryRoster(map);
      })
      .catch(() => { if (!cancelled) setMinistryRoster({}); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedMinistryIds]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function toggleMinistry(id: string) {
    setSelectedMinistryIds((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
    setMembersByMinistry((prev) => { if (!prev[id]) return prev; const { [id]: _, ...rest } = prev; return rest; });
  }

  function isMemberSelected(ministryId: string, userId: string) {
    return (membersByMinistry[ministryId] ?? []).some((m) => m.userId === userId);
  }

  function getMemberFunctions(ministryId: string, userId: string) {
    return (membersByMinistry[ministryId] ?? []).find((m) => m.userId === userId)?.functions ?? [];
  }

  // Nomes dos outros ministérios (deste evento) onde a pessoa já está selecionada.
  function otherMinistriesFor(currentMinistryId: string, userId: string): string[] {
    return Object.entries(membersByMinistry)
      .filter(([mid, members]) => mid !== currentMinistryId && members.some((m) => m.userId === userId))
      .map(([mid]) => (ministries as unknown as Ministry[]).find((m) => m.id === mid)?.name)
      .filter((name): name is string => !!name);
  }

  function toggleMember(ministryId: string, userId: string) {
    setMembersByMinistry((prev) => {
      const cur = prev[ministryId] ?? [];
      const has = cur.some((m) => m.userId === userId);
      return { ...prev, [ministryId]: has ? cur.filter((m) => m.userId !== userId) : [...cur, { userId, functions: [] }] };
    });
  }

  function toggleMemberFunction(ministryId: string, userId: string, fn: string) {
    setMembersByMinistry((prev) => {
      const cur = prev[ministryId] ?? [];
      return { ...prev, [ministryId]: cur.map((m) => m.userId !== userId ? m : { ...m, functions: m.functions.includes(fn) ? m.functions.filter((f) => f !== fn) : [...m.functions, fn] }) };
    });
  }

  const setlistSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  function handleSetlistDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setSelectedSongIds((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function toggleSong(songId: string) {
    setSelectedSongIds((prev) => {
      if (prev.includes(songId)) return prev.filter((id) => id !== songId);
      const song = (songs as unknown as Song[]).find((s) => s.id === songId);
      if (song?.musical_key) setSongKeys((k) => ({ ...k, [songId]: song.musical_key! }));
      return [...prev, songId];
    });
  }

  function setSongKey(songId: string, key: string) {
    setSongKeys((prev) => {
      if (!key) { const next = { ...prev }; delete next[songId]; return next; }
      return { ...prev, [songId]: key };
    });
  }

  function setSongNote(songId: string, note: string) {
    setSongNotes((prev) => {
      if (!note) { const next = { ...prev }; delete next[songId]; return next; }
      return { ...prev, [songId]: note };
    });
  }

  function addTimelineItem() {
    if (!newTimelineTime || !newTimelineTitle.trim()) {
      toast.error('Preenche a hora e o título do momento');
      return;
    }
    setTimelineItems((prev) =>
      [...prev, { time: newTimelineTime, title: newTimelineTitle.trim() }]
        .sort((a, b) => a.time.localeCompare(b.time)),
    );
    setNewTimelineTime('');
    setNewTimelineTitle('');
  }

  function removeTimelineItem(index: number) {
    setTimelineItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Grava TUDO de uma vez: informações + imagem + ministérios/integrantes + setlist.
  const doSaveAll = handleSubmit(
    async (values) => {
      setSaving(true);
      try {
        let coverImageUrl: string | null = event.cover_image_url ?? null;
        if (imageFile) {
          const fd = new FormData();
          fd.append('file', imageFile);
          fd.append('orgId', event.org_id);
          coverImageUrl = await uploadEventImageAction(fd);
        } else if (!imagePreview) {
          coverImageUrl = null;
        }
        await updateEvent.mutateAsync({
          id: event.id, name: values.name, date: values.date, time: values.time,
          arrival_time: values.arrival_time || null,
          location: values.location || null, description: values.description || null,
          observations: values.observations || null, is_published: values.is_published,
          color: event.color, cover_image_url: coverImageUrl,
        });
        const setup = selectedMinistryIds.map((mid) => ({ ministryId: mid, members: membersByMinistry[mid] ?? [] }));
        unwrapLockGuarded(await replaceEventSetupAction(event.id, setup, selectedSongIds, songKeys, timelineItems, songNotes));
        qc.invalidateQueries({ queryKey: ['events'] });
        qc.invalidateQueries({ queryKey: ['event-setlist', event.id] });
        qc.invalidateQueries({ queryKey: ['event-ministries', event.id] });
        qc.invalidateQueries({ queryKey: ['event-timeline', event.id] });
        toast.success('Evento atualizado com sucesso');
        onBack();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
      } finally {
        setSaving(false);
      }
    },
    () => { setStep(1); toast.error('Preenche o nome, a data e a hora'); },
  );

  const activeMinistries = (ministries as unknown as { id: string; name: string; icon: string; color: string; is_active: boolean }[]).filter((m) => m.is_active);

  const filteredSongs = useMemo(() => {
    const q = songSearch.trim().toLowerCase();
    if (!q) return songs as unknown as Song[];
    return (songs as unknown as Song[]).filter((s) => s.name.toLowerCase().includes(q) || (s.artist?.toLowerCase().includes(q) ?? false));
  }, [songs, songSearch]);

  const totalSelectedMembers = Object.values(membersByMinistry).reduce((acc, m) => acc + m.length, 0);
  const isPending = updateEvent.isPending || isSubmitting;

  return (
    <>
      <style>{`
        .ep-layout { display: flex; min-height: 100%; max-width: 100%; }
        .ep-sidebar { display: flex; }
        .ep-steptabs { display: none; }
        .ep-content { padding: 2.5rem 3rem 4rem; min-width: 0; }
        .ep-member-grid > *, .ep-ministry-grid > *, .ep-date-grid > * { min-width: 0; }
        .ep-two-col { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.5rem; }
        .ep-date-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0.875rem; }
        .ep-ministry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
        .ep-member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .ep-setlist-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
        .ep-setlist-grid > * { min-width: 0; }
        @media (max-width: 767px) {
          .ep-sidebar { display: none !important; }
          .ep-steptabs { display: flex; gap: 0.375rem; overflow-x: auto; margin-bottom: 1.25rem; }
          .ep-content { padding: 1.25rem 1.1rem 2rem; overflow-x: hidden; }
          .ep-two-col { grid-template-columns: minmax(0, 1fr); }
          .ep-date-grid { grid-template-columns: minmax(0, 1fr); }
          .ep-ministry-grid { grid-template-columns: minmax(0, 1fr); }
          .ep-member-grid { grid-template-columns: minmax(0, 1fr); }
          .ep-setlist-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>

      <div className="dash-purple-bg ep-layout">

        {/* Desktop sidebar */}
        <Sidebar current={step} event={event} onBack={onBack} onStepClick={(n) => setStep(n as 1 | 2 | 3 | 4 | 5)} />

        <div style={{ flex: 1, overflowY: 'auto' }} className="ep-content">

          {/* Abas de passos (só mobile) */}
          <div className="ep-steptabs scrollbar-none">
            {STEPS.map((s, i) => {
              const num = (i + 1) as 1 | 2 | 3 | 4 | 5;
              const active = step === num;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(num)}
                  style={{
                    flexShrink: 0, padding: '0.4rem 0.8rem', borderRadius: '9999px',
                    fontSize: '0.78rem', fontWeight: active ? 600 : 500, cursor: 'pointer',
                    background: active ? '#fff' : 'rgba(255,255,255,0.06)',
                    color: active ? '#0a0a0f' : 'rgba(255,255,255,0.55)',
                    border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {i + 1}. {s.label}
                </button>
              );
            })}
          </div>

          {/* Step title */}
          <div style={{ marginBottom: '1.75rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '0.375rem' }}>
              {STEPS[step - 1].description}
            </p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              {STEPS[step - 1].label}
            </h2>
          </div>

          {/* ─── Step 1: Informações ──────────────────────────────────── */}
          {step === 1 && (
            <form ref={formRef} onSubmit={doSaveAll} className="dark-inputs">
              <div className="ep-two-col">

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                  <div className="space-y-1.5">
                    <Label>Nome <span style={{ color: '#f87171' }}>*</span></Label>
                    <Input placeholder="Nome do evento" {...register('name')} />
                    {errors.name && <p style={{ fontSize: '0.75rem', color: '#fca5a5' }}>{errors.name.message}</p>}
                  </div>

                  <div className="ep-date-grid">
                    <div className="space-y-1.5">
                      <Label>Data <span style={{ color: '#f87171' }}>*</span></Label>
                      <Input type="date" {...register('date')} />
                      {errors.date && <p style={{ fontSize: '0.75rem', color: '#fca5a5' }}>{errors.date.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Horário <span style={{ color: '#f87171' }}>*</span></Label>
                      <Input type="time" {...register('time')} />
                      {errors.time && <p style={{ fontSize: '0.75rem', color: '#fca5a5' }}>{errors.time.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Hora de chegada da equipa</Label>
                    <Input type="time" {...register('arrival_time')} />
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                      Opcional — a que horas a equipa deve chegar (ensaio/passagem de som).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Local</Label>
                    <Input placeholder="Local do evento" {...register('location')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Textarea placeholder="Descrição do evento" rows={3} {...register('description')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Observações</Label>
                    <Textarea placeholder="Observações internas" rows={2} {...register('observations')} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Checkbox
                      id="is_published"
                      checked={isPublished}
                      onCheckedChange={(v) => setValue('is_published', v === true)}
                      style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                    />
                    <Label htmlFor="is_published" style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                      Publicar evento
                    </Label>
                  </div>
                </div>

                {/* Cover image */}
                <div className="space-y-1.5">
                  <Label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>Imagem de capa</Label>
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden group" style={{ height: '16rem' }}>
                      <img src={imagePreview} alt="Capa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <button type="button" onClick={() => setLightboxOpen(true)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
                      </button>
                      <button type="button" onClick={clearImage}
                        className="absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100%', height: '16rem',
                        border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '0.75rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        background: 'rgba(255,255,255,0.03)', cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                      <ImagePlus style={{ width: '2rem', height: '2rem' }} />
                      <span style={{ fontSize: '0.85rem' }}>Clica para adicionar imagem</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
              </div>

            </form>
          )}

          {/* ─── Step 2: Ministérios ──────────────────────────────────── */}
          {step === 2 && (
            <div>
              {loadingSetup ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse" style={{ height: '3.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)' }} />
                  ))}
                </div>
              ) : activeMinistries.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', ...card }}>
                  <LayoutGrid style={{ width: '2.5rem', height: '2.5rem', color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem' }} />
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>Nenhum ministério activo.</p>
                </div>
              ) : (
                <div className="ep-ministry-grid" style={{ ...card }}>
                  {activeMinistries.map((m, idx) => {
                    const checked = selectedMinistryIds.includes(m.id);
                    return (
                      <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.125rem', cursor: 'pointer', background: checked ? 'rgba(255,255,255,0.07)' : 'transparent', borderBottom: idx < activeMinistries.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleMinistry(m.id)} />
                        <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${m.color}18`, border: `1px solid ${m.color}30`, fontSize: '0.9rem', fontWeight: 800, color: m.color }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                        {checked && <Check style={{ width: '0.875rem', height: '0.875rem', color: '#6ee7b7', flexShrink: 0 }} />}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Integrantes ──────────────────────────────────── */}
          {step === 3 && (
            <div>
              {selectedMinistryIds.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', ...card }}>
                  <Users style={{ width: '2.5rem', height: '2.5rem', color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem' }} />
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>Nenhum ministério selecionado.</p>
                  <button style={ghostBtn} onClick={() => setStep(2)}>← Seleccionar ministérios</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {totalSelectedMembers > 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{totalSelectedMembers}</span> membro{totalSelectedMembers !== 1 ? 's' : ''} selecionado{totalSelectedMembers !== 1 ? 's' : ''}
                    </p>
                  )}
                  <div className="ep-member-grid">
                    {selectedMinistryIds.map((ministryId) => {
                      const ministry = (ministries as unknown as Ministry[]).find((m) => m.id === ministryId);
                      if (!ministry) return null;
                      const selectedIds = membersByMinistry[ministryId] ?? [];
                      const roster = ministryRoster[ministryId] ?? [];
                      return (
                        <div key={ministryId} style={card}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ width: '1.625rem', height: '1.625rem', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${ministry.color ?? '#a5b4fc'}18`, fontSize: '0.65rem', fontWeight: 800, color: ministry.color ?? '#a5b4fc' }}>
                              {ministry.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', flex: 1 }}>{ministry.name}</span>
                            {selectedIds.length > 0 && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>{selectedIds.length}</span>
                            )}
                          </div>
                          {roster.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', padding: '0.75rem 1rem' }}>
                              Nenhum membro neste ministério. Adiciona pessoas ao ministério primeiro.
                            </p>
                          ) : (
                            roster.map((rm) => {
                              const name = rm.name;
                              const checked = isMemberSelected(ministryId, rm.userId);
                              const fns = getMemberFunctions(ministryId, rm.userId);
                              const personFunctions = rm.functions.map(resolveFunction);
                              const conflict = watchedDate
                                ? findConflictingUnavailability(unavailabilityByUser?.[rm.userId], watchedDate, watchedTime)
                                : null;
                              const otherMinistries = checked ? otherMinistriesFor(ministryId, rm.userId) : [];
                              return (
                                <div key={rm.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', cursor: 'pointer', background: checked ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'background 0.1s' }}>
                                    <Checkbox checked={checked} onCheckedChange={() => toggleMember(ministryId, rm.userId)} />
                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                      <AvatarFallback style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>{getInitials(name)}</AvatarFallback>
                                    </Avatar>
                                    <span style={{ flex: 1, fontSize: '0.82rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                    {otherMinistries.length > 0 && (
                                      <span title={`Também escalado em: ${otherMinistries.join(', ')}`} style={{ display: 'inline-flex', flexShrink: 0 }}>
                                        <AlertTriangle style={{ width: '0.75rem', height: '0.75rem', color: '#fbbf24' }} />
                                      </span>
                                    )}
                                    {conflict && (
                                      <span title={describeUnavailability(conflict)} style={{ display: 'inline-flex', flexShrink: 0 }}>
                                        <CalendarOff style={{ width: '0.75rem', height: '0.75rem', color: '#f87171' }} />
                                      </span>
                                    )}
                                    {checked && fns.length > 0 && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{fns.length} fn</span>}
                                  </label>
                                  {checked && (
                                    <div style={{ margin: '0 1rem 0.625rem', padding: '0.625rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                                      {personFunctions.length === 0 ? (
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Esta pessoa não tem funções neste ministério.</p>
                                      ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                                          {personFunctions.map((f) => (
                                            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                                              <Checkbox checked={fns.includes(f.key)} onCheckedChange={() => toggleMemberFunction(ministryId, rm.userId, f.key)} />
                                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.emoji} {f.label}</span>
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 4: Setlist ──────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <div className="ep-setlist-grid">
                {/* Search + list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }} className="dark-inputs">
                      <Search style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                      <Input placeholder="Pesquisar músicas…" className="pl-9" value={songSearch} onChange={(e) => setSongSearch(e.target.value)} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImportOpen(true)}
                      title="Importar setlist de um ficheiro CSV"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0,
                        padding: '0.5rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                        background: 'rgba(165,180,252,0.12)', border: '1px solid rgba(165,180,252,0.25)',
                        color: '#a5b4fc', cursor: 'pointer',
                      }}
                    >
                      <FileUp style={{ width: '0.9rem', height: '0.9rem' }} /> Importar CSV
                    </button>
                  </div>
                  <div style={{ ...card, maxHeight: '22rem', overflowY: 'auto' }}>
                    {filteredSongs.length === 0 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                        <ListMusic style={{ width: '2rem', height: '2rem', color: 'rgba(255,255,255,0.15)', margin: '0 auto 0.75rem' }} />
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>{songSearch ? 'Nenhuma música encontrada.' : 'Nenhuma música criada ainda.'}</p>
                      </div>
                    ) : (
                      filteredSongs.map((song, idx) => {
                        const checked = selectedSongIds.includes(song.id);
                        return (
                          <label key={song.id} style={{ ...rowBase, borderBottom: idx < filteredSongs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: checked ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                            onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                            onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = checked ? 'rgba(255,255,255,0.06)' : 'transparent'; }}
                          >
                            <Checkbox checked={checked} onCheckedChange={() => toggleSong(song.id)} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.name}</p>
                              {song.artist && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</p>}
                            </div>
                            {song.musical_key && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                                {song.musical_key}
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected setlist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                    Setlist seleccionado ({selectedSongIds.length}) {selectedSongIds.length > 1 && '· arrasta para ordenar'}
                  </p>
                  {selectedSongIds.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', ...card }}>
                      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.25)' }}>Nenhuma música seleccionada</p>
                    </div>
                  ) : (
                    <div style={card}>
                      <DndContext sensors={setlistSensors} collisionDetection={closestCenter} onDragEnd={handleSetlistDragEnd}>
                        <SortableContext items={selectedSongIds} strategy={verticalListSortingStrategy}>
                          {selectedSongIds.map((id, idx) => {
                            const song = (songs as unknown as Song[]).find((s) => s.id === id);
                            if (!song) return null;
                            return (
                              <SortableSetlistRow key={id} id={id} isLast={idx === selectedSongIds.length - 1}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', minWidth: 0 }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', width: '1.25rem', textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.82rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.name}</p>
                                    {song.artist && <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</p>}
                                  </div>
                                  <select
                                    value={songKeys[id] ?? ''}
                                    onChange={(e) => setSongKey(id, e.target.value)}
                                    title="Tom para este evento"
                                    style={{
                                      flexShrink: 0, fontSize: '0.72rem', fontWeight: 600,
                                      padding: '0.2rem 0.4rem', borderRadius: '0.4rem',
                                      background: 'rgba(255,255,255,0.06)', color: '#fff',
                                      border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                                    }}
                                  >
                                    <option value="" style={{ background: '#1a1a20' }}>Tom</option>
                                    {SONG_KEYS.map((k) => (
                                      <option key={k} value={k} style={{ background: '#1a1a20' }}>{k}</option>
                                    ))}
                                  </select>
                                  <button type="button" onClick={() => toggleSong(id)} style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.375rem', flexShrink: 0 }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                                  >
                                    <X style={{ width: '0.75rem', height: '0.75rem' }} />
                                  </button>
                                </div>
                                <input
                                  value={songNotes[id] ?? ''}
                                  onChange={(e) => setSongNote(id, e.target.value)}
                                  placeholder="Observação para este evento (ex.: começa no pré-refrão)"
                                  style={{
                                    width: '100%', minWidth: 0, fontSize: '0.72rem',
                                    padding: '0.25rem 0.45rem', borderRadius: '0.375rem',
                                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)',
                                    border: '1px solid rgba(255,255,255,0.08)', boxSizing: 'border-box',
                                  }}
                                />
                              </SortableSetlistRow>
                            );
                          })}
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ─── Step 5: Roteiro ──────────────────────────────────────── */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="dark-inputs">
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                Opcional — os momentos do evento (chegada, ensaio, devocional, início do culto…), por ordem de hora.
              </p>
              <div className="ep-date-grid" style={{ alignItems: 'end' }}>
                <div className="space-y-1.5">
                  <Label>Hora</Label>
                  <Input type="time" value={newTimelineTime} onChange={(e) => setNewTimelineTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Momento</Label>
                  <Input
                    placeholder="Ex: Início do ensaio"
                    value={newTimelineTitle}
                    onChange={(e) => setNewTimelineTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTimelineItem(); } }}
                  />
                </div>
              </div>
              <button type="button" onClick={addTimelineItem} style={{ ...ghostBtn, alignSelf: 'flex-start' }}>
                <Plus style={{ width: '0.875rem', height: '0.875rem' }} />
                Adicionar momento
              </button>

              {timelineItems.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', ...card }}>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.25)' }}>Nenhum momento adicionado</p>
                </div>
              ) : (
                <div style={card}>
                  {timelineItems.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 1rem',
                      borderBottom: idx < timelineItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', width: '3rem', flexShrink: 0 }}>
                        {item.time}
                      </span>
                      <span style={{ flex: 1, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{item.title}</span>
                      <button
                        type="button"
                        onClick={() => removeTimelineItem(idx)}
                        style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.375rem', flexShrink: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                      >
                        <X style={{ width: '0.75rem', height: '0.75rem' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Barra de gravação única — grava todas as tabs (desktop) */}
          <SaveBar onCancel={onBack} onSave={() => doSaveAll()} saving={saving || isPending} />

        </div>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0 shadow-2xl [&>button]:hidden">
          {imagePreview && <img src={imagePreview} alt="Imagem de capa" className="w-full h-auto max-h-[85vh] object-contain" />}
        </DialogContent>
      </Dialog>

      <SongCsvImportDialog
        orgId={event.org_id}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={handleImported}
        title="Importar setlist de CSV"
      />
    </>
  );
}

/** Linha arrastável do setlist — a pega (grip) inicia o drag, o resto da linha fica interativo (select, remover). */
function SortableSetlistRow({ id, isLast, children }: { id: string; isLast: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.625rem 1rem',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
        transform: CSS.Transform.toString(transform), transition,
        background: isDragging ? 'rgba(255,255,255,0.06)' : 'transparent',
        opacity: isDragging ? 0.6 : 1, position: 'relative', zIndex: isDragging ? 1 : 'auto',
        minWidth: 0, maxWidth: '100%',
      }}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastar para reordenar"
        style={{
          display: 'flex', alignItems: 'center', flexShrink: 0, color: 'rgba(255,255,255,0.25)',
          background: 'none', border: 'none', padding: '0.25rem', cursor: 'grab', touchAction: 'none',
          marginTop: '0.15rem',
        }}
      >
        <GripVertical style={{ width: '0.9rem', height: '0.9rem' }} />
      </button>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {children}
      </div>
    </div>
  );
}
