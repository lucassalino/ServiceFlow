'use client';

import Papa from 'papaparse';
import type { RawRow } from './setlist-schema';

export interface ParsedCsv {
  headers: string[];
  rows: RawRow[];
}

/**
 * Lê um ficheiro CSV no browser e devolve cabeçalhos + linhas (como objetos).
 * Deteta o delimitador automaticamente (vírgula, ponto-e-vírgula, tab).
 */
export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const headers = (result.meta.fields ?? []).filter((h) => h && h.length > 0);
        const rows = (result.data ?? []).filter((r) =>
          Object.values(r).some((v) => (v ?? '').toString().trim().length > 0),
        );
        if (headers.length === 0) {
          reject(new Error('Não foi possível ler os cabeçalhos do CSV.'));
          return;
        }
        resolve({ headers, rows });
      },
      error: (err) => reject(err),
    });
  });
}
