-- ============================================================
-- ServiceFlow — Eliminar a própria conta
-- ============================================================

-- Permite que um utilizador autenticado elimine a sua própria
-- conta. SECURITY DEFINER é necessário porque apagar de auth.users
-- exige privilégios elevados — mas a função só apaga auth.uid(),
-- nunca um ID passado como argumento, por isso não pode ser usada
-- para apagar outra pessoa.
--
-- Cascata esperada (via FKs ON DELETE CASCADE já existentes):
-- profiles, organization_members, event_schedules, notifications.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke execute on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
