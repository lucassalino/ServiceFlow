'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UploadCloud, FileSpreadsheet, Download, ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { parseCsvFile } from '@/lib/import/parse-setlist';
import {
  TARGET_FIELDS, autoMap, rowToDraft, isMappingValid, emptyMapping,
  type ColumnMapping, type RawRow, type SongDraft,
} from '@/lib/import/setlist-schema';
import { importSetlistSongsAction, type ImportedSong } from '@/actions/setlist-import';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Chamado com as músicas resolvidas (ex.: para juntar a uma setlist). Opcional. */
  onImported?: (songs: ImportedSong[]) => void;
  title?: string;
}

type Step = 'upload' | 'map';

export function SongCsvImportDialog({ orgId, open, onOpenChange, onImported, title = 'Importar músicas de CSV' }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(emptyMapping());
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  function reset() {
    setStep('upload'); setFileName(''); setHeaders([]); setRows([]);
    setMapping(emptyMapping()); setParsing(false); setImporting(false);
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function handleFile(file: File) {
    setParsing(true);
    try {
      const parsed = await parseCsvFile(file);
      setFileName(file.name);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoMap(parsed.headers));
      setStep('map');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível ler o CSV');
    } finally {
      setParsing(false);
    }
  }

  const drafts: SongDraft[] = isMappingValid(mapping)
    ? rows.map((r) => rowToDraft(r, mapping)).filter((d): d is SongDraft => d !== null)
    : [];

  async function handleImport() {
    if (drafts.length === 0) { toast.error('Nada para importar'); return; }
    setImporting(true);
    try {
      const result = await importSetlistSongsAction(orgId, drafts);
      await qc.invalidateQueries({ queryKey: ['songs'] });
      onImported?.(result.songs);
      const parts = [];
      if (result.createdCount) parts.push(`${result.createdCount} criada(s)`);
      if (result.matchedCount) parts.push(`${result.matchedCount} já existente(s)`);
      toast.success(`${result.songs.length} música(s) importada(s)${parts.length ? ` — ${parts.join(', ')}` : ''}`);
      handleClose(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto dark-inputs">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={parsing}
              style={{
                width: '100%', padding: '2.5rem 1.5rem', borderRadius: '0.875rem',
                border: '1.5px dashed var(--wis-border-strong)', background: 'var(--wis-surface-2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                cursor: parsing ? 'wait' : 'pointer', color: 'var(--wis-text)',
              }}
            >
              {parsing ? <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem' }} />
                : <UploadCloud style={{ width: '2rem', height: '2rem', color: 'var(--wis-blue)' }} />}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {parsing ? 'A ler…' : 'Clica para escolher um ficheiro CSV'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--wis-text-3)' }}>
                Nome, Artista, Tom, BPM, Duração, Referência bíblica, YouTube, Spotify, Cifra, Letra
              </span>
            </button>
            <input
              ref={fileRef} type="file" accept=".csv,text/csv" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
            <a
              href="/api/setlist-template" download
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--wis-blue)', textDecoration: 'none' }}
            >
              <Download style={{ width: '0.85rem', height: '0.85rem' }} /> Descarregar CSV modelo
            </a>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-5">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--wis-text-2)' }}>
              <FileSpreadsheet style={{ width: '0.95rem', height: '0.95rem', color: 'var(--wis-blue)' }} />
              <span style={{ fontWeight: 600, color: 'var(--wis-text)' }}>{fileName}</span>
              <span>· {rows.length} linha(s)</span>
            </div>

            {/* Mapeamento de colunas */}
            <div className="space-y-2.5">
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--wis-text-3)' }}>
                Associar colunas
              </p>
              {TARGET_FIELDS.map((f) => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.83rem', color: 'var(--wis-text)' }}>
                    {f.label} {f.required && <span style={{ color: 'var(--wis-danger)' }}>*</span>}
                  </label>
                  <select
                    value={mapping[f.key] ?? ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || null }))}
                    style={{
                      width: '100%', padding: '0.5rem 0.7rem', borderRadius: '0.5rem',
                      background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border-strong)',
                      color: 'var(--wis-text)', fontSize: '0.83rem',
                    }}
                  >
                    <option value="" style={{ background: 'var(--wis-surface-2)' }}>— ignorar —</option>
                    {headers.map((h) => (
                      <option key={h} value={h} style={{ background: 'var(--wis-surface-2)' }}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {!isMappingValid(mapping) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--wis-warning)' }}>
                <AlertCircle style={{ width: '0.9rem', height: '0.9rem' }} /> Associa a coluna do nome da música para continuar.
              </div>
            )}

            {/* Pré-visualização */}
            {drafts.length > 0 && (
              <div className="space-y-2">
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--wis-text-3)' }}>
                  Pré-visualização ({drafts.length})
                </p>
                <div style={{ maxHeight: '14rem', overflowY: 'auto', borderRadius: '0.625rem', border: '1px solid var(--wis-border)' }}>
                  {drafts.slice(0, 50).map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderBottom: i < Math.min(drafts.length, 50) - 1 ? '1px solid var(--wis-border)' : 'none' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--wis-text-4)', width: '1.5rem', textAlign: 'right' }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.82rem', color: 'var(--wis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</p>
                        {d.artist && <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)' }}>{d.artist}</p>}
                      </div>
                      {d.musical_key && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'var(--wis-blue-soft)', color: 'var(--wis-blue)' }}>{d.musical_key}</span>}
                      {d.bpm && <span style={{ fontSize: '0.7rem', color: 'var(--wis-text-3)' }}>{d.bpm} BPM</span>}
                      {d.duration && <span style={{ fontSize: '0.7rem', color: 'var(--wis-text-3)' }}>{d.duration}</span>}
                    </div>
                  ))}
                  {drafts.length > 50 && (
                    <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: 'var(--wis-text-3)' }}>+ {drafts.length - 50} mais…</p>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <Button variant="outline" onClick={reset} disabled={importing}>
                <ArrowLeft style={{ width: '0.85rem', height: '0.85rem' }} /> Voltar
              </Button>
              <Button onClick={handleImport} disabled={importing || drafts.length === 0}>
                {importing ? <><Loader2 className="animate-spin" style={{ width: '0.9rem', height: '0.9rem' }} /> A importar…</>
                  : <><Check style={{ width: '0.9rem', height: '0.9rem' }} /> Importar {drafts.length} música(s)</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
