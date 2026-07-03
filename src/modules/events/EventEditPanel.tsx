'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft, ImagePlus, X, ZoomIn, Search,
  Check, ChevronLeft, ChevronRight, Users, LayoutGrid, ListMusic,
  CalendarDays, Music2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateEvent } from '@/hooks/useEvents';
import { useMinistries } from '@/hooks/useMinistries';
import { useOrgMembers } from '@/hooks/useMembers';
import { useSongs } from '@/hooks/useSongs';
import { uploadEventImageAction } from '@/actions/events';
import { fetchEventSetupAction, replaceEventSetupAction } from '@/actions/schedule';
import { MEMBER_FUNCTIONS } from '@/lib/constants';
import { fetchMinistriesFunctionsAction } from '@/actions/members';
import type { Event, Ministry, Song } from '@/types/models';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getInitials } from '@/lib/utils';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:         z.string().min(1, 'Nome é obrigatório'),
  date:         z.string().min(1, 'Data é obrigatória'),
  time:         z.string().min(1, 'Horário é obrigatório'),
  location:     z.string().nullable().optional(),
  description:  z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  is_published: z.boolean().default(false),
});
type FormValues = z.infer<typeof schema>;
type OrgMember = { user_id: string; is_active: boolean; profile: { full_name: string; email: string } };

const STEPS: { label: string; description: string; icon: React.ReactNode }[] = [
  { label: 'Informações', description: 'Nome, data, horário e local', icon: <CalendarDays style={{ width: '0.9rem', height: '0.9rem' }} /> },
  { label: 'Ministérios', description: 'Quais equipas participam',    icon: <LayoutGrid   style={{ width: '0.9rem', height: '0.9rem' }} /> },
  { label: 'Integrantes', description: 'Escala de membros',           icon: <Users        style={{ width: '0.9rem', height: '0.9rem' }} /> },
  { label: 'Setlist',     description: 'Músicas do evento',           icon: <Music2       style={{ width: '0.9rem', height: '0.9rem' }} /> },
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

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer({ onPrev, onSkip, onNext, nextLabel, saving, showPrev, skipLabel }: {
  onPrev?: () => void; onSkip: () => void; onNext?: () => void;
  nextLabel: string; saving?: boolean; showPrev?: boolean; skipLabel: string;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: '1.5rem', marginTop: '0.5rem',
      borderTop: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div>
        {showPrev && onPrev && (
          <button style={ghostBtn} onClick={onPrev}>
            <ChevronLeft style={{ width: '0.875rem', height: '0.875rem' }} /> Anterior
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button style={{ ...ghostBtn, opacity: saving ? 0.5 : 1 }} onClick={onSkip} disabled={saving}>
          {skipLabel}
        </button>
        {onNext && (
          <button style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }} onClick={onNext} disabled={saving}>
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { event: Event; onBack: () => void }

export function EventEditPanel({ event, onBack }: Props) {
  const qc = useQueryClient();
  const updateEvent = useUpdateEvent();
  const { data: ministries = [] } = useMinistries();
  const { data: orgMembers = [] } = useOrgMembers();
  const { data: songs = [] } = useSongs();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
  const [ministryFunctions, setMinistryFunctions] = useState<Record<string, string[]>>({});

  // step 4
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [songSearch, setSongSearch] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: event.name, date: event.date, time: event.time,
      location: event.location ?? '', description: event.description ?? '',
      observations: event.observations ?? '', is_published: event.is_published,
    },
  });
  const isPublished = watch('is_published');

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
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSetup(false); });
    return () => { cancelled = true; };
  }, [event.id]);

  // Load ministry functions when entering step 3
  useEffect(() => {
    if (step !== 3 || selectedMinistryIds.length === 0) return;
    let cancelled = false;
    fetchMinistriesFunctionsAction(selectedMinistryIds)
      .then((fns) => { if (!cancelled) setMinistryFunctions(fns); })
      .catch(() => { if (!cancelled) setMinistryFunctions({}); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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

  function toggleSong(songId: string) {
    setSelectedSongIds((prev) => prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]);
  }

  async function onSubmitStep1(values: FormValues) {
    let coverImageUrl: string | null = event.cover_image_url ?? null;
    if (imageFile) {
      try {
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('orgId', event.org_id);
        coverImageUrl = await uploadEventImageAction(fd);
      } catch { toast.error('Erro ao carregar imagem'); return; }
    } else if (!imagePreview) {
      coverImageUrl = null;
    }
    updateEvent.mutate(
      { id: event.id, name: values.name, date: values.date, time: values.time, location: values.location || null, description: values.description || null, observations: values.observations || null, is_published: values.is_published, color: event.color, cover_image_url: coverImageUrl },
      { onSuccess: () => setStep(2), onError: () => toast.error('Erro ao actualizar evento') },
    );
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const setup = selectedMinistryIds.map((mid) => ({ ministryId: mid, members: membersByMinistry[mid] ?? [] }));
      await replaceEventSetupAction(event.id, setup, selectedSongIds);
      qc.invalidateQueries({ queryKey: ['event-setlist', event.id] });
      qc.invalidateQueries({ queryKey: ['event-ministries', event.id] });
      toast.success('Evento actualizado com sucesso');
      onBack();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    } finally { setSaving(false); }
  }

  const activeMembers = (orgMembers as unknown as OrgMember[]).filter((m) => m.is_active);
  const activeMinistries = (ministries as unknown as { id: string; name: string; icon: string; color: string; is_active: boolean }[]).filter((m) => m.is_active);

  const filteredSongs = useMemo(() => {
    const q = songSearch.trim().toLowerCase();
    if (!q) return songs as unknown as Song[];
    return (songs as unknown as Song[]).filter((s) => s.name.toLowerCase().includes(q) || (s.artist?.toLowerCase().includes(q) ?? false));
  }, [songs, songSearch]);

  const totalSelectedMembers = Object.values(membersByMinistry).reduce((acc, m) => acc + m.length, 0);
  const isPending = updateEvent.isPending || isSubmitting;

  function handleMobilePrev() {
    if (step === 1) onBack();
    else setStep((step - 1) as 1 | 2 | 3 | 4);
  }

  function handleMobileNext() {
    if (step === 1) { formRef.current?.requestSubmit(); return; }
    if (step === 4) { handleFinish(); return; }
    setStep((step + 1) as 2 | 3 | 4);
  }

  return (
    <>
      <style>{`
        .ep-layout { display: flex; min-height: 100%; }
        .ep-sidebar { display: flex; }
        .ep-mobile-nav { display: none; }
        .ep-content { padding: 2.5rem 3rem 4rem; }
        .ep-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .ep-date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
        .ep-ministry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
        .ep-member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .ep-setlist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 767px) {
          .ep-sidebar { display: none !important; }
          .ep-mobile-nav {
            display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
            position: fixed; left: 0; right: 0; z-index: 30;
            bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
            padding: 0.75rem 1.25rem;
            background: rgba(12,12,16,0.97);
            border-top: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(16px);
          }
          .ep-content { padding: 1.25rem 1.25rem calc(3.75rem + 4rem + env(safe-area-inset-bottom, 0px)); }
          .ep-two-col { grid-template-columns: 1fr; }
          .ep-date-grid { grid-template-columns: 1fr 1fr; }
          .ep-ministry-grid { grid-template-columns: 1fr; }
          .ep-member-grid { grid-template-columns: 1fr; }
          .ep-setlist-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dash-purple-bg ep-layout">

        {/* Mobile bottom nav */}
        <div className="ep-mobile-nav">
          {/* Prev arrow */}
          <button onClick={handleMobilePrev} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', flexShrink: 0 }}>
            <ChevronLeft style={{ width: '1rem', height: '1rem', color: '#fff' }} />
          </button>

          {/* Step dots + label */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              {STEPS.map((_, i) => {
                const num = i + 1;
                const active = step === num;
                const done = step > num;
                return (
                  <button key={i} onClick={() => setStep(num as 1|2|3|4)} style={{ width: active ? '1.5rem' : '0.5rem', height: '0.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: active ? '#fff' : done ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)', padding: 0 }} />
                );
              })}
            </div>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
              {STEPS[step - 1].label}
            </span>
          </div>

          {/* Next arrow */}
          <button onClick={handleMobileNext} disabled={saving || isPending} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step === 4 ? 'rgba(255,255,255,0.9)' : '#fff', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: (saving || isPending) ? 0.5 : 1 }}>
            <ChevronRight style={{ width: '1rem', height: '1rem', color: '#0a0a0f' }} />
          </button>
        </div>

        {/* Desktop sidebar */}
        <Sidebar current={step} event={event} onBack={onBack} onStepClick={(n) => setStep(n as 1 | 2 | 3 | 4)} />

        <div style={{ flex: 1, overflowY: 'auto' }} className="ep-content">

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
            <form ref={formRef} onSubmit={handleSubmit(onSubmitStep1)} className="dark-inputs">
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.5rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button type="button" style={{ ...ghostBtn, opacity: isPending ? 0.5 : 1 }} onClick={onBack} disabled={isPending}>Cancelar</button>
                <button type="submit" style={{ ...primaryBtn, opacity: isPending ? 0.7 : 1 }} disabled={isPending}>
                  {isPending ? 'A guardar…' : 'Continuar →'}
                </button>
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
              <Footer
                onSkip={onBack} skipLabel="Fechar sem alterar"
                onNext={() => setStep(3)}
                nextLabel={`Próximo${selectedMinistryIds.length > 0 ? ` (${selectedMinistryIds.length})` : ' →'}`}
              />
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
                      const ministryFns = ministryFunctions[ministryId] ?? [];
                      const availableFunctions = ministryFns.length > 0 ? MEMBER_FUNCTIONS.filter((f) => ministryFns.includes(f.key)) : MEMBER_FUNCTIONS;
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
                          {activeMembers.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', padding: '0.75rem 1rem' }}>Sem membros activos.</p>
                          ) : (
                            activeMembers.map((member) => {
                              const name = member.profile?.full_name || member.profile?.email || '?';
                              const checked = isMemberSelected(ministryId, member.user_id);
                              const fns = getMemberFunctions(ministryId, member.user_id);
                              return (
                                <div key={member.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', cursor: 'pointer', background: checked ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'background 0.1s' }}>
                                    <Checkbox checked={checked} onCheckedChange={() => toggleMember(ministryId, member.user_id)} />
                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                      <AvatarFallback style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>{getInitials(name)}</AvatarFallback>
                                    </Avatar>
                                    <span style={{ flex: 1, fontSize: '0.82rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                    {checked && fns.length > 0 && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{fns.length} fn</span>}
                                  </label>
                                  {checked && (
                                    <div style={{ margin: '0 1rem 0.625rem', padding: '0.625rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                                      {availableFunctions.length === 0 ? (
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Nenhuma função definida.</p>
                                      ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                                          {availableFunctions.map((f) => (
                                            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                                              <Checkbox checked={fns.includes(f.key)} onCheckedChange={() => toggleMemberFunction(ministryId, member.user_id, f.key)} />
                                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
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
              <Footer
                showPrev onPrev={() => setStep(2)}
                onSkip={onBack} skipLabel="Fechar sem alterar"
                onNext={() => setStep(4)} nextLabel="Próximo →"
              />
            </div>
          )}

          {/* ─── Step 4: Setlist ──────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <div className="ep-setlist-grid">
                {/* Search + list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ position: 'relative' }} className="dark-inputs">
                    <Search style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    <Input placeholder="Pesquisar músicas…" className="pl-9" value={songSearch} onChange={(e) => setSongSearch(e.target.value)} />
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
                    Setlist seleccionado ({selectedSongIds.length})
                  </p>
                  {selectedSongIds.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', ...card }}>
                      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.25)' }}>Nenhuma música seleccionada</p>
                    </div>
                  ) : (
                    <div style={card}>
                      {selectedSongIds.map((id, idx) => {
                        const song = (songs as unknown as Song[]).find((s) => s.id === id);
                        if (!song) return null;
                        return (
                          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', borderBottom: idx < selectedSongIds.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', width: '1.25rem', textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '0.82rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.name}</p>
                              {song.artist && <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</p>}
                            </div>
                            <button type="button" onClick={() => toggleSong(id)} style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.375rem', flexShrink: 0 }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                            >
                              <X style={{ width: '0.75rem', height: '0.75rem' }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <Footer
                showPrev onPrev={() => setStep(3)} saving={saving}
                onSkip={onBack} skipLabel="Fechar sem alterar"
                onNext={handleFinish} nextLabel={saving ? 'A guardar…' : 'Guardar alterações ✓'}
              />
            </div>
          )}

        </div>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0 shadow-2xl [&>button]:hidden">
          {imagePreview && <img src={imagePreview} alt="Imagem de capa" className="w-full h-auto max-h-[85vh] object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
