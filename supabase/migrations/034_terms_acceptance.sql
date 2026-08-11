-- Registo de aceitação dos Termos/Privacidade no momento da criação de conta.
-- terms_version guarda a versão aceite (para prova de consentimento se os
-- termos mudarem); terms_accepted_at o momento exato.
alter table public.profiles
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz;

-- O trigger de criação de perfil passa a ler a versão aceite dos metadados
-- do signUp (definidos pelo formulário de registo) e regista o timestamp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (id, email, full_name, terms_version, terms_accepted_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'terms_version',
    case when new.raw_user_meta_data->>'terms_version' is not null then now() else null end
  );
  return new;
end;
$$;
