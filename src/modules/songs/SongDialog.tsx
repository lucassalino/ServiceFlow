'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Youtube, Music, FileText, Guitar } from 'lucide-react';

import { useCreateSong, useUpdateSong } from '@/hooks/useSongs';
import { useMinistries } from '@/hooks/useMinistries';
import { Song } from '@/types/models';
import { SONG_KEYS } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const urlOrEmpty = z.string().url('URL inválida').nullable().or(z.literal('')).optional();

const songSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  artist: z.string().nullable().optional(),
  musical_key: z.string().nullable().optional(),
  bpm: z.coerce.number().int().positive().nullable().optional(),
  ministry_id: z.string().nullable().optional(),
  youtube_url: urlOrEmpty,
  spotify_url: urlOrEmpty,
  chords: urlOrEmpty,
  lyrics: urlOrEmpty,
});

type SongFormValues = z.infer<typeof songSchema>;

interface SongDialogProps {
  song?: Song | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SongDialog({ song, open, onOpenChange }: SongDialogProps) {
  const createSong = useCreateSong();
  const updateSong = useUpdateSong();
  const { data: ministries } = useMinistries();

  const isEditing = !!song;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SongFormValues>({
    resolver: zodResolver(songSchema) as never,
    defaultValues: {
      name: '',
      artist: '',
      musical_key: null,
      bpm: null,
      ministry_id: null,
      youtube_url: '',
      spotify_url: '',
      chords: '',
      lyrics: '',
    },
  });

  const selectedKey = watch('musical_key');
  const selectedMinistryId = watch('ministry_id');

  useEffect(() => {
    if (open) {
      if (song) {
        reset({
          name: song.name,
          artist: song.artist ?? '',
          musical_key: song.musical_key ?? null,
          bpm: song.bpm ?? null,
          ministry_id: song.ministry_id ?? null,
          youtube_url: song.youtube_url ?? '',
          spotify_url: song.spotify_url ?? '',
          chords: song.chords ?? '',
          lyrics: song.lyrics ?? '',
        });
      } else {
        reset({
          name: '',
          artist: '',
          musical_key: null,
          bpm: null,
          ministry_id: null,
          youtube_url: '',
          spotify_url: '',
          chords: '',
          lyrics: '',
        });
      }
    }
  }, [open, song, reset]);

  async function onSubmit(values: SongFormValues) {
    const payload = {
      name: values.name,
      artist: values.artist || null,
      musical_key: values.musical_key || null,
      bpm: values.bpm ?? null,
      ministry_id: values.ministry_id || null,
      youtube_url: values.youtube_url || null,
      spotify_url: values.spotify_url || null,
      chords: values.chords || null,
      lyrics: values.lyrics || null,
    };

    if (isEditing && song) {
      updateSong.mutate(
        { id: song.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Música actualizada.');
            onOpenChange(false);
          },
          onError: () => toast.error('Erro ao actualizar música.'),
        },
      );
    } else {
      createSong.mutate(payload, {
        onSuccess: () => {
          toast.success('Música criada.');
          onOpenChange(false);
        },
        onError: () => toast.error('Erro ao criar música.'),
      });
    }
  }

  const isPending = createSong.isPending || updateSong.isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl dark-inputs">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Música' : 'Nova Música'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Nome + Artista */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
              <Input id="name" placeholder="Nome da música" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="artist">Artista</Label>
              <Input id="artist" placeholder="Nome do artista" {...register('artist')} />
            </div>
          </div>

          {/* Tom + BPM + Ministério */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Tom</Label>
              <Select value={selectedKey ?? ''} onValueChange={(v) => setValue('musical_key', v || null)}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {SONG_KEYS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bpm">BPM</Label>
              <Input id="bpm" type="number" placeholder="120" min={1} max={300} {...register('bpm')} />
              {errors.bpm && <p className="text-sm text-destructive">{errors.bpm.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Ministério</Label>
              <Select value={selectedMinistryId ?? ''} onValueChange={(v) => setValue('ministry_id', v || null)}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {ministries?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.icon} {m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Links
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="youtube_url" className="flex items-center gap-2">
                <Youtube className="h-3.5 w-3.5" style={{ color: '#f87171' }} />
                YouTube
              </Label>
              <Input
                id="youtube_url"
                type="url"
                placeholder="https://youtube.com/watch?v=…"
                {...register('youtube_url')}
              />
              {errors.youtube_url && <p className="text-sm text-destructive">{errors.youtube_url.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="spotify_url" className="flex items-center gap-2">
                <Music className="h-3.5 w-3.5" style={{ color: '#1db954' }} />
                Spotify
              </Label>
              <Input
                id="spotify_url"
                type="url"
                placeholder="https://open.spotify.com/track/…"
                {...register('spotify_url')}
              />
              {errors.spotify_url && <p className="text-sm text-destructive">{errors.spotify_url.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="chords" className="flex items-center gap-2">
                <Guitar className="h-3.5 w-3.5" style={{ color: '#fcd34d' }} />
                Cifra
              </Label>
              <Input
                id="chords"
                type="url"
                placeholder="https://cifraclub.com.br/…"
                {...register('chords')}
              />
              {errors.chords && <p className="text-sm text-destructive">{errors.chords.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lyrics" className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" style={{ color: '#a5b4fc' }} />
                Letra
              </Label>
              <Input
                id="lyrics"
                type="url"
                placeholder="https://letras.mus.br/…"
                {...register('lyrics')}
              />
              {errors.lyrics && <p className="text-sm text-destructive">{errors.lyrics.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'A guardar…' : isEditing ? 'Guardar alterações' : 'Criar música'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
