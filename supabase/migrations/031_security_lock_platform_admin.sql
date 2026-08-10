-- SEGURANÇA (crítico) — impedir auto-escalada a platform admin.
--
-- A role `authenticated` tinha UPDATE ao nível da TABELA em `profiles`, e a
-- policy "profiles: update own" restringe LINHAS (id=auth.uid()) mas não
-- COLUNAS. Logo, qualquer utilizador podia
--   PATCH /rest/v1/profiles?id=eq.<self>  {is_platform_admin:true}
-- e tornar-se admin da plataforma (acesso a admin_grant_plan,
-- admin_list_org_subscriptions e a todos os analytics).
--
-- Correção: revogar o UPDATE de tabela e reconceder apenas as colunas que o
-- cliente do utilizador (RLS) legitimamente edita. is_platform_admin, id,
-- email, full_name, avatar_url, created_at ficam FORA (full_name/avatar_url
-- são escritos só via service-role em updateProfileAction).

revoke update on public.profiles from anon, authenticated;

grant update (phone, birthday, default_functions, email_opt_out, updated_at)
  on public.profiles to authenticated;

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());
