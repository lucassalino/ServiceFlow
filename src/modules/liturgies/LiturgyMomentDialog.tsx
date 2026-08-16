'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { LiturgyMoment } from '@/types/models';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

/** Momentos habituais de um culto — o utilizador pode sempre escrever outro à mão. */
const PRESET_MOMENTS = [
  'Oração', 'Louvor', 'Dízimos / Ofertas', 'Oração p/ Crianças', 'Visitantes',
  'Avisos', 'Ministração', 'Palavra', 'Ceia do Senhor', 'Testemunho', 'Encerramento',
];

const RESPONSIBLE_TYPES: { value: LiturgyMoment['tipo']; label: string }[] = [
  { value: 'pessoa', label: 'Pessoa' },
  { value: 'video', label: 'Vídeo' },
  { value: 'projecao', label: 'Projeção' },
];

export function emptyMoment(): LiturgyMoment {
  return {
    nome: '', tipo: 'pessoa', responsavel: '', duracao: '', obs: '',
    palavraTema: '', palavraTexto: '', musicas: [], avisos: [],
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Momento a editar, ou null para criar um novo. */
  moment: LiturgyMoment | null;
  onSave: (moment: LiturgyMoment) => void;
}

export function LiturgyMomentDialog({ open, onOpenChange, moment, onSave }: Props) {
  const [preset, setPreset] = useState('');
  const [customName, setCustomName] = useState('');
  const [tipo, setTipo] = useState<LiturgyMoment['tipo']>('pessoa');
  const [responsavel, setResponsavel] = useState('');
  const [duracao, setDuracao] = useState('');
  const [obs, setObs] = useState('');
  const [palavraTema, setPalavraTema] = useState('');
  const [palavraTexto, setPalavraTexto] = useState('');
  const [musicas, setMusicas] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);

  // Recarrega o formulário sempre que o modal abre para um momento diferente.
  useEffect(() => {
    if (!open) return;
    const m = moment ?? emptyMoment();
    const isPreset = PRESET_MOMENTS.includes(m.nome);
    setPreset(m.nome ? (isPreset ? m.nome : 'outro') : '');
    setCustomName(m.nome && !isPreset ? m.nome : '');
    setTipo(m.tipo);
    setResponsavel(m.responsavel);
    setDuracao(m.duracao);
    setObs(m.obs);
    setPalavraTema(m.palavraTema);
    setPalavraTexto(m.palavraTexto);
    setMusicas(m.musicas.length ? [...m.musicas] : []);
    setAvisos(m.avisos.length ? [...m.avisos] : []);
  }, [open, moment]);

  function handlePresetChange(value: string) {
    setPreset(value);
    if (value === 'Louvor' && musicas.length === 0) setMusicas(['']);
    if (value === 'Avisos' && avisos.length === 0) setAvisos(['']);
  }

  const name = preset === 'outro' ? customName.trim() : preset;
  const showMusicas = preset === 'Louvor';
  const showAvisos = preset === 'Avisos';
  const showPalavra = preset === 'Palavra' || preset === 'Ministração';

  function handleSave() {
    if (!name) return;
    onSave({
      nome: name,
      tipo,
      responsavel: tipo === 'pessoa' ? responsavel.trim() : '',
      duracao: duracao.trim(),
      obs: obs.trim(),
      palavraTema: showPalavra ? palavraTema.trim() : '',
      palavraTexto: showPalavra ? palavraTexto.trim() : '',
      musicas: showMusicas ? musicas.map((s) => s.trim()).filter(Boolean) : [],
      avisos: showAvisos ? avisos.map((s) => s.trim()).filter(Boolean) : [],
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{moment ? 'Editar momento' : 'Adicionar momento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="moment-preset">Momento</Label>
            <select
              id="moment-preset"
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="dark-select"
            >
              <option value="">— Escolhe um momento —</option>
              {PRESET_MOMENTS.map((o) => <option key={o} value={o}>{o}</option>)}
              <option value="outro">Outro (escrever à mão)</option>
            </select>
          </div>

          {preset === 'outro' && (
            <div className="space-y-1.5">
              <Label htmlFor="moment-custom">Nome do momento</Label>
              <Input id="moment-custom" value={customName} onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Apresentação de crianças" autoFocus />
            </div>
          )}

          {showMusicas && (
            <StringListField label="Músicas do louvor" placeholder="Nome da música…"
              values={musicas} onChange={setMusicas} addLabel="Adicionar música" />
          )}

          {showAvisos && (
            <StringListField label="Lista de avisos" placeholder="Texto do aviso…"
              values={avisos} onChange={setAvisos} addLabel="Adicionar aviso" />
          )}

          {showPalavra && (
            <div className="space-y-3" style={{
              padding: '0.875rem', borderRadius: '0.625rem',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div className="space-y-1.5">
                <Label htmlFor="moment-tema">Tema da mensagem</Label>
                <Input id="moment-tema" value={palavraTema} onChange={(e) => setPalavraTema(e.target.value)}
                  placeholder="Ex: A graça que transforma" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="moment-texto">Texto bíblico</Label>
                <Input id="moment-texto" value={palavraTexto} onChange={(e) => setPalavraTexto(e.target.value)}
                  placeholder="Ex: João 3:16" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {RESPONSIBLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '0.5rem',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    background: tipo === t.value ? '#fff' : 'rgba(255,255,255,0.06)',
                    color: tipo === t.value ? '#0a0a0e' : 'rgba(255,255,255,0.6)',
                    border: tipo === t.value ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tipo === 'pessoa' && (
            <div className="space-y-1.5">
              <Label htmlFor="moment-resp">Nome do responsável</Label>
              <Input id="moment-resp" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Quem conduz este momento" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="moment-duracao">Duração (opcional)</Label>
            <Input id="moment-duracao" value={duracao} onChange={(e) => setDuracao(e.target.value)}
              placeholder="Ex: 5 min" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="moment-obs">Observações (opcional)</Label>
            <Input id="moment-obs" value={obs} onChange={(e) => setObs(e.target.value)}
              placeholder="Notas para a equipa" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name}>
            {moment ? 'Guardar alterações' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StringListField({ label, placeholder, values, onChange, addLabel }: {
  label: string; placeholder: string; addLabel: string;
  values: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-1.5" style={{
      padding: '0.875rem', borderRadius: '0.625rem',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <Label>{label}</Label>
      {values.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <Input
            value={v}
            placeholder={placeholder}
            onChange={(e) => { const next = [...values]; next[i] = e.target.value; onChange(next); }}
          />
          <button
            type="button"
            className="dark-icon-btn danger"
            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            aria-label="Remover"
          >
            <X style={{ width: '0.75rem', height: '0.75rem' }} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ''])}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0',
        }}
      >
        <Plus style={{ width: '0.8rem', height: '0.8rem' }} />
        {addLabel}
      </button>
    </div>
  );
}
