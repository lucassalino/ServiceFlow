// Devolve um CSV modelo para o utilizador preencher e importar como setlist.
export const dynamic = 'force-static';

export function GET() {
  const headers = ['Nome', 'Artista', 'Tom', 'BPM', 'Duração', 'Referência bíblica', 'YouTube', 'Spotify', 'Cifra', 'Letra', 'Capa'];
  const examples = [
    ['Ruja o Leão', 'Bethel Music', 'G', '140', '4:32', 'Apocalipse 5:5', 'https://youtube.com/watch?v=xxxxxxxxxxx', '', '', '', ''],
    ['Grande é o Senhor', 'Adhemar de Campos', 'D', '72', '5:10', 'Salmos 145:3', '', '', '', '', ''],
    ['Oceanos', 'Hillsong United', 'D', '68', '8:56', 'Mateus 14:29', '', '', '', '', ''],
  ];
  const escape = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [headers, ...examples].map((row) => row.map(escape).join(',')).join('\r\n');

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="modelo-setlist.csv"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
