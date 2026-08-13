-- event_setlists.musical_key já existe em produção mas nunca foi criado por
-- uma migração rastreada (foi adicionado diretamente na base remota). Esta
-- migração documenta essa coluna com `if not exists` e acrescenta `note`:
-- uma observação por música, específica de cada evento (ex.: "começa no
-- pré-refrão", "participação especial do Pedrinho"), distinta do registo
-- global da música em `songs`.

alter table public.event_setlists
  add column if not exists musical_key text,
  add column if not exists note text;
