'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const songSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  artist: z.string().nullable().optional(),
  musical_key: z.string().nullable().optional(),
  bpm: z.coerce.number().int().positive().nullable().optional(),
  ministry_id: z.string().nullable().optional(),
  youtube_url: z.string().url('URL inválida').nullable().or(z.literal('')).optional(),
  lyrics: z.string().nullable().optional(),
  chords: z.string().nullable().optional(),
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
    resolver: zodResolver(songSchema),
    defaultValues: {
      name: '',
      artist: '',
      musical_key: null,
      bpm: null,
      ministry_id: null,
      youtube_url: '',
      lyrics: '',
      chords: '',
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
          lyrics: song.lyrics ?? '',
          chords: song.chords ?? '',
        });
      } else {
        reset({
          name: '',
          artist: '',
          musical_key: null,
          bpm: null,
          ministry_id: null,
          youtube_url: '',
          lyrics: '',
          chords: '',
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
      lyrics: values.lyrics || null,
      chords: values.chords || null,
    };

    if (isEditing && song) {
      updateSong.mutate(
        { id: song.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Música atualizada com sucesso.');
            onOpenChange(false);
          },
          onError: () => toast.error('Erro ao atualizar música.'),
        },
      );
    } else {
      createSong.mutate(payload, {
        onSuccess: () => {
          toast.success('Música criada com sucesso.');
          onOpenChange(false);
        },
        onError: () => toast.error('Erro ao criar música.'),
      });
    }
  }

  const isPending = createSong.isPending || updateSong.isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Música' : 'Nova Música'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input id="name" placeholder="Nome da música" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="artist">Artista</Label>
              <Input id="artist" placeholder="Nome do artista" {...register('artist')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="musical_key">Tom</Label>
              <Select
                value={selectedKey ?? ''}
                onValueChange={(val) => setValue('musical_key', val || null)}
              >
                <SelectTrigger id="musical_key">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {SONG_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                placeholder="120"
                min={1}
                max={300}
                {...register('bpm')}
              />
              {errors.bpm && (
                <p className="text-sm text-destructive">{errors.bpm.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ministry_id">Ministério</Label>
              <Select
                value={selectedMinistryId ?? ''}
                onValueChange={(val) => setValue('ministry_id', val || null)}
              >
                <SelectTrigger id="ministry_id">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {ministries?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.icon} {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="youtube_url">URL do YouTube</Label>
            <Input
              id="youtube_url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              {...register('youtube_url')}
            />
            {errors.youtube_url && (
              <p className="text-sm text-destructive">{errors.youtube_url.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lyrics">Letra</Label>
              <Textarea
                id="lyrics"
                placeholder="Letra da música..."
                rows={8}
                className="resize-none font-mono text-sm"
                {...register('lyrics')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="chords">Cifra</Label>
              <Textarea
                id="chords"
                placeholder="Cifra da música..."
                rows={8}
                className="resize-none font-mono text-sm"
                {...register('chords')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar música'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
