-- ============================================================
-- ServiceFlow — Avatars storage bucket
-- ============================================================

-- Bucket público (leitura sem autenticação), com limite de 2MB
-- e tipos de ficheiro restritos a imagens comuns.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Qualquer pessoa pode ver os avatares (necessário para mostrar
-- o avatar de outros membros da organização).
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Um utilizador autenticado só pode fazer upload para a sua
-- própria pasta: avatars/{user_id}/ficheiro.ext
create policy "avatars: users upload own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Um utilizador pode substituir (upsert) o seu próprio avatar.
create policy "avatars: users update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Um utilizador pode apagar o seu próprio avatar.
create policy "avatars: users delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
