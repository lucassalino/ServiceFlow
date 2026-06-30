'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ImagePlus, X, ZoomIn, Search, Check, ChevronLeft } from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { useCreateEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useMinistries } from '@/hooks/useMinistries';
import { useOrgMembers } from '@/hooks/useMembers';
import { useSongs } from '@/hooks/useSongs';
import { uploadEventImageAction } from '@/actions/events';
import {
  fetchEventSetupAction,
  setupEventScheduleAction,
  setupEventSetlistAction,
  replaceEventSetupAction,
} from '@/actions/schedule';
import { MEMBER_FUNCTIONS } from '@/lib/constants';
import { fetchMinistriesFunctionsAction } from '@/actions/members';
import type { Event, Ministry, Song } from '@/types/models';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';

// ── Schema ───────────────────────────────────────────────────────────────────

const eventSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Horário é obrigatório'),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  is_published: z.boolean().default(false),
});
type EventFormValues = z.infer<typeof eventSchema>;
type OrgMember = { user_id: string; is_active: boolean; profile: { full_name: string; email: string } };

// ── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Informações', 'Ministérios', 'Integrantes', 'Setlist'] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start mb-4">
      {STEPS.map((label, i) => {
        const num = i + 1;
        const done = current > num;
        const active = current === num;
        return (
          <div key={i} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-colors flex-shrink-0',
                active && 'border-primary bg-primary text-primary-foreground',
                done && 'border-primary bg-primary/15 text-primary',
                !active && !done && 'border-muted text-muted-foreground',
              )}>
                {done ? <Check className="h-3.5 w-3.5" /> : num}
              </div>
              <span className={cn(
                'text-[10px] mt-1 text-center leading-tight',
                active ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 flex-1 mx-1 mt-3.5', done ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  event?: Event | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function EventDialog({ event, open, onOpenChange }: Props) {
  const { activeOrg } = useOrgStore();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { data: ministries = [] } = useMinistries();
  const { data: orgMembers = [] } = useOrgMembers();
  const { data: songs = [] } = useSongs();

  const isEditing = !!event;

  // ── step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  // set after create (step 1) — edit uses event.id directly
  const [newEventId, setNewEventId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(false);

  // ── image ─────────────────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── step 2: ministries ────────────────────────────────────────────────────
  const [selectedMinistryIds, setSelectedMinistryIds] = useState<string[]>([]);

  // ── step 3: members per ministry (with functions per member) ─────────────
  const [membersByMinistry, setMembersByMinistry] = useState<Record<string, { userId: string; functions: string[] }[]>>({});

  // ── step 3: functions available per ministry (union of ministry_members functions)
  const [ministryFunctions, setMinistryFunctions] = useState<Record<string, string[]>>({});

  // ── step 4: setlist ───────────────────────────────────────────────────────
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [songSearch, setSongSearch] = useState('');

  // ── form ──────────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema) as never,
    defaultValues: { name: '', date: '', time: '', location: '', description: '', observations: '', is_published: false },
  });
  const isPublished = watch('is_published');

  // ── reset + pre-load on open ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setNewEventId(null);
    setSaving(false);
    setImageFile(null);
    setImagePreview(event?.cover_image_url ?? null);
    reset(event ? {
      name: event.name, date: event.date, time: event.time,
      location: event.location ?? '', description: event.description ?? '',
      observations: event.observations ?? '', is_published: event.is_published,
    } : { name: '', date: '', time: '', location: '', description: '', observations: '', is_published: false });

    if (event?.id) {
      // Pre-load existing schedule + setlist for edit mode
      let cancelled = false;
      setLoadingSetup(true);
      setSelectedMinistryIds([]);
      setMembersByMinistry({});
      setSelectedSongIds([]);
      setSongSearch('');
      fetchEventSetupAction(event.id)
        .then((setup) => {
          if (cancelled) return;
          setSelectedMinistryIds(setup.ministryIds);
          setMembersByMinistry(setup.membersByMinistry);
          setSelectedSongIds(setup.songIds);
        })
        .catch(() => { /* silent — user can configure manually */ })
        .finally(() => { if (!cancelled) setLoadingSetup(false); });
      return () => { cancelled = true; };
    } else {
      setSelectedMinistryIds([]);
      setMembersByMinistry({});
      setSelectedSongIds([]);
      setSongSearch('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?.id, reset]);

  // Load ministry functions (union of member functions) when entering step 3
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (step !== 3 || selectedMinistryIds.length === 0) return;
    let cancelled = false;
    fetchMinistriesFunctionsAction(selectedMinistryIds).then((fns) => {
      if (!cancelled) setMinistryFunctions(fns);
    }).catch(() => {
      if (!cancelled) setMinistryFunctions({});
    });
    return () => { cancelled = true; };
  }, [step]);

  // ── image handlers ────────────────────────────────────────────────────────
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

  // ── step 2 handlers ───────────────────────────────────────────────────────
  function toggleMinistry(id: string) {
    setSelectedMinistryIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
    setMembersByMinistry((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }

  // ── step 3 handlers ───────────────────────────────────────────────────────
  function isMemberSelected(ministryId: string, userId: string): boolean {
    return (membersByMinistry[ministryId] ?? []).some((m) => m.userId === userId);
  }

  function getMemberFunctions(ministryId: string, userId: string): string[] {
    return (membersByMinistry[ministryId] ?? []).find((m) => m.userId === userId)?.functions ?? [];
  }

  function toggleMember(ministryId: string, userId: string) {
    setMembersByMinistry((prev) => {
      const cur = prev[ministryId] ?? [];
      const has = cur.some((m) => m.userId === userId);
      return {
        ...prev,
        [ministryId]: has
          ? cur.filter((m) => m.userId !== userId)
          : [...cur, { userId, functions: [] }],
      };
    });
  }

  function toggleMemberFunction(ministryId: string, userId: string, fn: string) {
    setMembersByMinistry((prev) => {
      const cur = prev[ministryId] ?? [];
      return {
        ...prev,
        [ministryId]: cur.map((m) => {
          if (m.userId !== userId) return m;
          const hasFn = m.functions.includes(fn);
          return { ...m, functions: hasFn ? m.functions.filter((f) => f !== fn) : [...m.functions, fn] };
        }),
      };
    });
  }

  // ── step 4 handlers ───────────────────────────────────────────────────────
  function toggleSong(songId: string) {
    setSelectedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId],
    );
  }

  // ── submit step 1 ─────────────────────────────────────────────────────────
  async function onSubmit(values: EventFormValues) {
    let coverImageUrl: string | null = event?.cover_image_url ?? null;
    if (imageFile && activeOrg?.id) {
      try {
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('orgId', activeOrg.id);
        coverImageUrl = await uploadEventImageAction(fd);
      } catch {
        toast.error('Erro ao carregar imagem');
        return;
      }
    } else if (!imagePreview) {
      coverImageUrl = null;
    }

    const payload = {
      ...values,
      color: null,
      cover_image_url: coverImageUrl,
      location: values.location || null,
      description: values.description || null,
      observations: values.observations || null,
    };

    if (isEditing && event) {
      updateEvent.mutate({ id: event.id, ...payload }, {
        onSuccess: () => setStep(2),
        onError: () => toast.error('Erro ao actualizar evento'),
      });
    } else {
      createEvent.mutate(payload, {
        onSuccess: (newEvent) => { setNewEventId(newEvent.id); setStep(2); },
        onError: () => toast.error('Erro ao criar evento'),
      });
    }
  }

  // ── finish: save all remaining steps ─────────────────────────────────────
  async function handleFinish() {
    const eventId = isEditing ? event?.id : newEventId;
    if (!eventId) { onOpenChange(false); return; }
    setSaving(true);
    try {
      const setup = selectedMinistryIds.map((ministryId) => ({
        ministryId,
        members: membersByMinistry[ministryId] ?? [],
      }));
      if (isEditing) {
        await replaceEventSetupAction(eventId, setup, selectedSongIds);
        toast.success('Evento actualizado com sucesso');
      } else {
        if (setup.length > 0) await setupEventScheduleAction(eventId, setup);
        if (selectedSongIds.length > 0) await setupEventSetlistAction(eventId, selectedSongIds);
        toast.success('Evento criado com sucesso');
      }
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    toast.success(
      isEditing
        ? 'Informações actualizadas. Escala e setlist mantidos.'
        : 'Evento criado. Configura escala e setlist mais tarde.',
    );
    onOpenChange(false);
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const activeMembers = (orgMembers as unknown as OrgMember[]).filter((m) => m.is_active);
  const activeMinistries = (ministries as unknown as { id: string; name: string; icon: string; color: string; is_active: boolean }[]).filter((m) => m.is_active);

  const filteredSongs = useMemo(() => {
    const q = songSearch.trim().toLowerCase();
    if (!q) return songs as unknown as Song[];
    return (songs as unknown as Song[]).filter((s) =>
      s.name.toLowerCase().includes(q) || (s.artist?.toLowerCase().includes(q) ?? false),
    );
  }, [songs, songSearch]);

  const totalSelectedMembers = Object.values(membersByMinistry).reduce((acc, members) => acc + members.length, 0);
  const isPending = createEvent.isPending || updateEvent.isPending || isSubmitting;
  const skipLabel = isEditing ? 'Fechar sem alterar' : 'Configurar depois';
  const finishLabel = isEditing ? 'Guardar alterações' : 'Concluir ✓';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">

          <StepIndicator current={step} />

          {/* ─── Step 1: Informações ─────────────────────────────────────── */}
          {step === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Cover image */}
                <div className="space-y-1.5">
                  <Label>Imagem de capa</Label>
                  {imagePreview ? (
                    <div className="relative rounded-lg overflow-hidden h-36 group">
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
                      className="w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-accent transition-colors">
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">Clica para adicionar imagem</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
                  <Input id="name" placeholder="Nome do evento" {...register('name')} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="date">Data <span className="text-destructive">*</span></Label>
                    <Input id="date" type="date" {...register('date')} />
                    {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="time">Horário <span className="text-destructive">*</span></Label>
                    <Input id="time" type="time" {...register('time')} />
                    {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">Local</Label>
                  <Input id="location" placeholder="Local do evento" {...register('location')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" placeholder="Descrição do evento" rows={3} {...register('description')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea id="observations" placeholder="Observações internas" rows={2} {...register('observations')} />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="is_published" checked={isPublished}
                    onCheckedChange={(v) => setValue('is_published', v === true)} />
                  <Label htmlFor="is_published" className="cursor-pointer">Publicar evento</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'A guardar…' : 'Continuar →'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {/* ─── Step 2: Ministérios ──────────────────────────────────────── */}
          {step === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>Ministérios</DialogTitle>
                <p className="text-sm text-muted-foreground">Quais ministérios participam neste evento?</p>
              </DialogHeader>

              {loadingSetup ? (
                <div className="space-y-2 py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  {activeMinistries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum ministério activo. Cria ministérios primeiro.</p>
                  ) : (
                    <div className="space-y-1 pr-2">
                      {activeMinistries.map((m) => (
                        <label key={m.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors',
                            selectedMinistryIds.includes(m.id) && 'bg-accent/50',
                          )}>
                          <Checkbox
                            checked={selectedMinistryIds.includes(m.id)}
                            onCheckedChange={() => toggleMinistry(m.id)}
                          />
                          <span className="text-xl">{m.icon}</span>
                          <span className="font-medium flex-1">{m.name}</span>
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="outline" onClick={handleSkip}>{skipLabel}</Button>
                <Button onClick={() => setStep(3)}>
                  Próximo
                  {selectedMinistryIds.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{selectedMinistryIds.length}</Badge>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ─── Step 3: Integrantes ──────────────────────────────────────── */}
          {step === 3 && (
            <>
              <DialogHeader>
                <DialogTitle>Integrantes</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Quem participa em cada ministério?
                  {totalSelectedMembers > 0 && (
                    <span className="ml-1 font-medium text-foreground">
                      {totalSelectedMembers} selecionado{totalSelectedMembers !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </DialogHeader>

              {selectedMinistryIds.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhum ministério selecionado no passo anterior.</p>
                  <Button variant="link" onClick={() => setStep(2)} className="mt-2">← Voltar e seleccionar ministérios</Button>
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-4 pr-2">
                    {selectedMinistryIds.map((ministryId) => {
                      const ministry = (ministries as unknown as Ministry[]).find((m) => m.id === ministryId);
                      if (!ministry) return null;
                      const selectedIds = membersByMinistry[ministryId] ?? [];
                      // Filter to only functions registered in this ministry; fallback to all if none defined
                      const ministryFns = ministryFunctions[ministryId] ?? [];
                      const availableFunctions = ministryFns.length > 0
                        ? MEMBER_FUNCTIONS.filter((f) => ministryFns.includes(f.key))
                        : MEMBER_FUNCTIONS;
                      return (
                        <div key={ministryId} className="rounded-lg border overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
                            <span className="text-base">{ministry.icon}</span>
                            <span className="font-medium text-sm">{ministry.name}</span>
                            {selectedIds.length > 0 && (
                              <Badge variant="secondary" className="ml-auto text-xs">{selectedIds.length}</Badge>
                            )}
                          </div>
                          {activeMembers.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-3 py-2">Sem membros ativos na organização.</p>
                          ) : (
                            <div className="divide-y">
                              {activeMembers.map((member) => {
                                const name = member.profile?.full_name || member.profile?.email || '?';
                                const checked = isMemberSelected(ministryId, member.user_id);
                                const fns = getMemberFunctions(ministryId, member.user_id);
                                return (
                                  <div key={member.user_id}>
                                    <label className={cn(
                                      'flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors text-sm',
                                      checked && 'bg-accent/30',
                                    )}>
                                      <Checkbox checked={checked}
                                        onCheckedChange={() => toggleMember(ministryId, member.user_id)} />
                                      <Avatar className="h-5 w-5 flex-shrink-0">
                                        <AvatarFallback className="text-[9px]">{getInitials(name)}</AvatarFallback>
                                      </Avatar>
                                      <span className="flex-1 truncate">{name}</span>
                                      {checked && fns.length > 0 && (
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                          {fns.length} função{fns.length !== 1 ? 'ões' : ''}
                                        </span>
                                      )}
                                    </label>
                                    {checked && (
                                      <div className="mx-3 mb-2 rounded-md bg-muted/40 p-1.5">
                                        {availableFunctions.length === 0 ? (
                                          <p className="text-xs text-muted-foreground px-1 py-0.5">
                                            Nenhuma função definida para este ministério.
                                          </p>
                                        ) : (
                                          <div className="grid grid-cols-2 gap-0.5">
                                            {availableFunctions.map((f) => (
                                              <label key={f.key}
                                                className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs cursor-pointer hover:bg-accent transition-colors">
                                                <Checkbox
                                                  checked={fns.includes(f.key)}
                                                  onCheckedChange={() => toggleMemberFunction(ministryId, member.user_id, f.key)}
                                                />
                                                <span className="truncate">{f.emoji} {f.label}</span>
                                              </label>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSkip}>{skipLabel}</Button>
                  <Button onClick={() => setStep(4)}>Próximo →</Button>
                </div>
              </DialogFooter>
            </>
          )}

          {/* ─── Step 4: Setlist ──────────────────────────────────────────── */}
          {step === 4 && (
            <>
              <DialogHeader>
                <DialogTitle>Setlist</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Seleciona as músicas para este evento
                  {selectedSongIds.length > 0 && (
                    <span className="ml-1 font-medium text-foreground">
                      {selectedSongIds.length} música{selectedSongIds.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </DialogHeader>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar músicas…"
                    className="pl-9"
                    value={songSearch}
                    onChange={(e) => setSongSearch(e.target.value)}
                  />
                </div>

                <ScrollArea className="max-h-56">
                  {filteredSongs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {songSearch ? 'Nenhuma música encontrada.' : 'Nenhuma música criada ainda.'}
                    </p>
                  ) : (
                    <div className="space-y-0.5 pr-2">
                      {filteredSongs.map((song) => {
                        const checked = selectedSongIds.includes(song.id);
                        return (
                          <label key={song.id}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent transition-colors text-sm',
                              checked && 'bg-accent/50',
                            )}>
                            <Checkbox checked={checked} onCheckedChange={() => toggleSong(song.id)} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{song.name}</p>
                              {song.artist && (
                                <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                              )}
                            </div>
                            {song.musical_key && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">{song.musical_key}</Badge>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {selectedSongIds.length > 0 && (
                  <div className="border rounded-md p-2 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">
                      Setlist ({selectedSongIds.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedSongIds.map((id) => {
                        const song = (songs as unknown as Song[]).find((s) => s.id === id);
                        if (!song) return null;
                        return (
                          <Badge key={id} variant="secondary" className="gap-1 text-xs">
                            {song.name}
                            <button onClick={() => toggleSong(id)} className="hover:text-destructive ml-0.5">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSkip} disabled={saving}>{skipLabel}</Button>
                  <Button onClick={handleFinish} disabled={saving}>
                    {saving ? 'A guardar…' : finishLabel}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0 shadow-2xl [&>button]:hidden">
          {imagePreview && (
            <img src={imagePreview} alt="Imagem de capa" className="w-full h-auto max-h-[85vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
