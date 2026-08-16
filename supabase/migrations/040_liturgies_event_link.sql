-- Liga (opcionalmente) um roteiro de culto a um evento, para que o evento
-- possa exportar diretamente o PDF do seu roteiro.
alter table public.liturgies
  add column if not exists event_id uuid references public.events(id) on delete set null;

create index if not exists liturgies_event_id_idx on public.liturgies(event_id);
