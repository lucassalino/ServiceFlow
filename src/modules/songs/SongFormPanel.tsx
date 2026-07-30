'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Youtube, Music, FileText, Guitar, Search, Loader2 } from 'lucide-react';
import { useCreateSong, useUpdateSong } from '@/hooks/useSongs';
import { searchCatalogSongsAction, type CatalogSuggestion } from '@/actions/songs';
import type { Song } from '@/types/models';
import { SONG_KEYS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  duration: z.string().nullable().optional(),
  bible_reference: z.string().nullable().optional(),
});

type SongFormValues = z.infer<typeof songSchema>;

interface Props {
  song?: Song | null;
  onBack: () => void;
  onSaved?: (song?: Song) => void;
}

export function SongFormPanel({ song, onBack, onSaved }: Props) {
  const createSong = useCreateSong();
  const updateSong = useUpdateSong();
  const isEditing = !!song;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<SongFormValues>({
      resolver: zodResolver(songSchema) as never,
      defaultValues: {
        name: song?.name ?? '',
        artist: song?.artist ?? '',
        musical_key: song?.musical_key ?? null,
        bpm: song?.bpm ?? null,
        ministry_id: song?.ministry_id ?? null,
        youtube_url: song?.youtube_url ?? '',
        spotify_url: song?.spotify_url ?? '',
        chords: song?.chords ?? '',
        lyrics: song?.lyrics ?? '',
        duration: song?.duration ?? '',
        bible_reference: song?.bible_reference ?? '',
      },
    });

  useEffect(() => {
    reset({
      name: song?.name ?? '',
      artist: song?.artist ?? '',
      musical_key: song?.musical_key ?? null,
      bpm: song?.bpm ?? null,
      ministry_id: song?.ministry_id ?? null,
      youtube_url: song?.youtube_url ?? '',
      spotify_url: song?.spotify_url ?? '',
      chords: song?.chords ?? '',
      lyrics: song?.lyrics ?? '',
      duration: song?.duration ?? '',
      bible_reference: song?.bible_reference ?? '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id]);

  const selectedKey = watch('musical_key');
  const nameValue = watch('name');
  const nameField = register('name');
  const isPending = createSong.isPending || updateSong.isPending || isSubmitting;

  // ── Pesquisa no catálogo (banco de dados) por nome ou artista ──────────────
  const [catalogResults, setCatalogResults] = useState<CatalogSuggestion[]>([]);
  const [searchingSongs, setSearchingSongs] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (!nameFocused) return;
    if (skipSearchRef.current) { skipSearchRef.current = false; return; }
    const q = (nameValue ?? '').trim();
    if (q.length < 2) { setCatalogResults([]); setSearchingSongs(false); return; }
    setSearchingSongs(true);
    const t = setTimeout(async () => {
      try {
        const catalog = await searchCatalogSongsAction(q);
        setCatalogResults(catalog);
        setShowSuggestions(true);
      } finally {
        setSearchingSongs(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [nameValue, nameFocused]);

  // Resultado do catálogo (banco): preenche TODOS os campos partilhados.
  function selectCatalog(c: CatalogSuggestion) {
    skipSearchRef.current = true;
    setValue('name', c.name);
    setValue('artist', c.artist ?? '');
    setValue('lyrics', c.lyrics ?? '');
    setValue('chords', c.chords ?? '');
    setValue('youtube_url', c.youtube_url ?? '');
    setValue('spotify_url', c.spotify_url ?? '');
    setValue('bpm', c.bpm ?? null);
    setShowSuggestions(false);
    setCatalogResults([]);
    toast.success('Preenchido a partir do catálogo');
  }

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
      duration: values.duration || null,
      bible_reference: values.bible_reference || null,
    };

    if (isEditing && song) {
      updateSong.mutate({ id: song.id, ...payload }, {
        onSuccess: () => { toast.success('Música actualizada.'); onSaved?.(); onBack(); },
        onError: () => toast.error('Erro ao actualizar música.'),
      });
    } else {
      createSong.mutate(payload, {
        onSuccess: () => { toast.success('Música criada.'); onSaved?.(); onBack(); },
        onError: () => toast.error('Erro ao criar música.'),
      });
    }
  }

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
      <div className="panel-pad" style={{ maxWidth: '44rem' }}>

        {/* ── Top bar ─────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '2rem',
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          >
            <ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} />
            {isEditing ? 'Música' : 'Repertório'}
          </button>

          <h1 style={{
            fontSize: '1rem', fontWeight: 700, color: '#fff',
            letterSpacing: '-0.01em', margin: 0,
          }}>
            {isEditing ? 'Editar Música' : 'Nova Música'}
          </h1>
        </div>

        {/* ── Form ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{
            padding: '1.75rem 2rem', borderRadius: '1.25rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            marginBottom: '1rem',
          }}>
            <p style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem',
            }}>
              Informação
            </p>

            <div className="dark-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nome + Artista */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                className="sf-two-col">
                <style>{`@media(max-width:560px){.sf-two-col{grid-template-columns:1fr!important}}`}</style>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', position: 'relative' }}>
                  <Label htmlFor="sf-name" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
                    Nome <span style={{ color: '#f87171' }}>*</span>
                  </Label>
                  <Input
                    id="sf-name"
                    placeholder="Procurar por música ou artista…"
                    autoComplete="off"
                    {...nameField}
                    onFocus={() => setNameFocused(true)}
                    onBlur={(e) => { nameField.onBlur(e); setTimeout(() => setNameFocused(false), 150); }}
                  />
                  {errors.name && <p style={{ fontSize: '0.75rem', color: '#f87171', margin: 0 }}>{errors.name.message}</p>}

                  {/* Dropdown de resultados do catálogo (banco de dados global) */}
                  {nameFocused && showSuggestions && (searchingSongs || (nameValue ?? '').trim().length >= 2) && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 40, marginTop: '0.25rem',
                      background: 'rgba(20,20,26,0.98)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '0.625rem', boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                      overflow: 'hidden', maxHeight: '17rem', overflowY: 'auto',
                    }}>
                      {searchingSongs && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                          <Loader2 className="animate-spin" style={{ width: '0.85rem', height: '0.85rem' }} /> A procurar no catálogo…
                        </div>
                      )}
                      {!searchingSongs && catalogResults.length === 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                          <Search style={{ width: '0.8rem', height: '0.8rem' }} /> Não está no catálogo — escreve os dados manualmente.
                        </div>
                      )}

                      {catalogResults.map((c, i) => (
                        <button
                          key={`cat-${c.id}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCatalog(c)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', textAlign: 'left',
                            padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer',
                            borderBottom: i < catalogResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(165,180,252,0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ width: '2rem', height: '2rem', borderRadius: '0.3rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(165,180,252,0.15)' }}>
                            <Music style={{ width: '1rem', height: '1rem', color: '#a5b4fc' }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: '0.82rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.artist || 'Sem artista'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <Label htmlFor="sf-artist" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
                    Artista
                  </Label>
                  <Input id="sf-artist" placeholder="Nome do artista" {...register('artist')} />
                </div>
              </div>

              {/* Tom + BPM */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <Label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>Tom</Label>
                  <Select value={selectedKey ?? ''} onValueChange={(v) => setValue('musical_key', v || null)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {SONG_KEYS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <Label htmlFor="sf-bpm" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>BPM</Label>
                  <Input id="sf-bpm" type="number" placeholder="120" min={1} max={300} {...register('bpm')} />
                  {errors.bpm && <p style={{ fontSize: '0.75rem', color: '#f87171', margin: 0 }}>{errors.bpm.message}</p>}
                </div>
              </div>

              {/* Duração + Referência bíblica */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <Label htmlFor="sf-duration" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>Duração</Label>
                  <Input id="sf-duration" placeholder="4:32" {...register('duration')} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <Label htmlFor="sf-bible" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>Referência bíblica</Label>
                  <Input id="sf-bible" placeholder="Salmos 34:1" {...register('bible_reference')} />
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div style={{
            padding: '1.75rem 2rem', borderRadius: '1.25rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem',
            }}>
              Links
            </p>
            <div className="dark-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { id: 'sf-yt', key: 'youtube_url' as const, label: 'YouTube', icon: <Youtube style={{ width: '0.9rem', height: '0.9rem', color: '#f87171' }} />, placeholder: 'https://youtube.com/watch?v=…' },
                { id: 'sf-sp', key: 'spotify_url' as const, label: 'Spotify',  icon: <Music   style={{ width: '0.9rem', height: '0.9rem', color: '#1db954' }} />, placeholder: 'https://open.spotify.com/track/…' },
                { id: 'sf-ch', key: 'chords'      as const, label: 'Cifra',   icon: <Guitar  style={{ width: '0.9rem', height: '0.9rem', color: '#fcd34d' }} />, placeholder: 'https://cifraclub.com.br/…' },
                { id: 'sf-ly', key: 'lyrics'      as const, label: 'Letra',   icon: <FileText style={{ width: '0.9rem', height: '0.9rem', color: '#a5b4fc' }} />, placeholder: 'https://letras.mus.br/…' },
              ].map(({ id, key, label, icon, placeholder }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <Label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
                    {icon} {label}
                  </Label>
                  <Input id={id} type="url" placeholder={placeholder} {...register(key)} />
                  {errors[key] && <p style={{ fontSize: '0.75rem', color: '#f87171', margin: 0 }}>{errors[key]?.message}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onBack}
              disabled={isPending}
              style={{
                padding: '0.625rem 1.25rem', borderRadius: '0.625rem',
                fontSize: '0.875rem', fontWeight: 500,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)', cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="dark-primary-btn"
              style={{ cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}
            >
              {isPending ? 'A guardar…' : isEditing ? 'Guardar alterações' : 'Criar música'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
