-- SEGURANÇA — enforçar limites de plano na BD e proteger o catálogo global.

-- (A) Limite de pessoas/admins/líderes enforçado na BD para inserções DIRETAS
-- de utilizador (PostgREST com JWT). Os fluxos de service-role (Server Actions:
-- join, convites) já validam antes de inserir e correm com auth.uid() nulo,
-- por isso passam. create_organization insere o 1.º admin numa org a 0 membros
-- → passa. Cobre apenas INSERT (promoções por UPDATE já são validadas nas
-- actions, e um trigger de UPDATE partiria transfer_org_admin).
create or replace function public.enforce_member_plan_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare v record;
begin
  if auth.uid() is null then return new; end if;

  select * into v from public.check_plan_limit(new.org_id, 'people');
  if not v.allowed then
    raise exception 'Limite de pessoas do plano atingido para esta organização';
  end if;

  if new.role = 'admin' then
    select * into v from public.check_plan_limit(new.org_id, 'admin');
    if not v.allowed then
      raise exception 'Limite de administradores do plano atingido';
    end if;
  elsif new.role = 'leader' then
    select * into v from public.check_plan_limit(new.org_id, 'leader');
    if not v.allowed then
      raise exception 'Limite de líderes do plano atingido';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_enforce_member_plan_limit on public.organization_members;
create trigger trg_enforce_member_plan_limit
  before insert on public.organization_members
  for each row execute function public.enforce_member_plan_limit();

-- (B) Catálogo global de músicas: preservar "só preenche campos vazios".
-- Um campo partilhado já preenchido não pode ser alterado por escrita direta
-- (impede vandalismo entre igrejas); preencher um campo NULL continua a
-- funcionar (fluxo resolveCatalog). Nome/artista (chave de dedup) são fixos.
create or replace function public.catalog_songs_no_overwrite()
returns trigger
language plpgsql
as $$
begin
  if old.lyrics is not null      and new.lyrics      is distinct from old.lyrics      then new.lyrics      := old.lyrics;      end if;
  if old.chords is not null      and new.chords      is distinct from old.chords      then new.chords      := old.chords;      end if;
  if old.youtube_url is not null and new.youtube_url is distinct from old.youtube_url then new.youtube_url := old.youtube_url; end if;
  if old.spotify_url is not null and new.spotify_url is distinct from old.spotify_url then new.spotify_url := old.spotify_url; end if;
  if old.bpm is not null         and new.bpm         is distinct from old.bpm         then new.bpm         := old.bpm;         end if;
  new.name := old.name;
  new.artist := old.artist;
  return new;
end $$;

drop trigger if exists trg_catalog_songs_no_overwrite on public.catalog_songs;
create trigger trg_catalog_songs_no_overwrite
  before update on public.catalog_songs
  for each row execute function public.catalog_songs_no_overwrite();
