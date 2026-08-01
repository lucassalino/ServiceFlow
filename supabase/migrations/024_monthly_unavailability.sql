-- ─────────────────────────────────────────────────────────────────────────────
-- Disponibilidade recorrente: padrão mensal por ocorrência do dia da semana.
--
-- O que já existia em member_unavailability:
--   kind = 'date_range' → intervalo pontual (férias, viagem)
--   kind = 'weekly'     → todos os X (ex.: "sempre indisponível aos domingos")
--
-- O que falta e esta migração acrescenta:
--   kind = 'monthly_nth' → a N-ésima ocorrência de um dia da semana no mês
--                          (ex.: "toda a 2ª terça-feira do mês")
--
-- Reutiliza a coluna `weekday` já existente e acrescenta `nth`:
--   nth = 1..5 → primeira … quinta ocorrência
--   nth = -1   → última ocorrência do mês
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.member_unavailability
  add column if not exists nth integer;

comment on column public.member_unavailability.nth is
  'Só para kind=monthly_nth: 1..5 = N-ésima ocorrência do weekday no mês; -1 = última.';

-- Permitir o novo kind
do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'public.member_unavailability'::regclass
    and pg_get_constraintdef(oid) ilike '%date_range%'
    and contype = 'c'
  limit 1;

  if v_conname is not null then
    execute format('alter table public.member_unavailability drop constraint %I', v_conname);
  end if;

  alter table public.member_unavailability
    add constraint member_unavailability_kind_check
    check (kind in ('date_range', 'weekly', 'monthly_nth'));
end $$;

-- Coerência: cada kind só preenche os campos que lhe pertencem.
--
-- ATENÇÃO: a migração 009 já criava um `member_unavailability_shape_check`
-- que só conhecia date_range e weekly. Tem de ser SUBSTITUÍDO (não basta
-- "criar se não existir", senão o antigo continua a rejeitar monthly_nth).
alter table public.member_unavailability
  drop constraint if exists member_unavailability_shape_check;

alter table public.member_unavailability
  add constraint member_unavailability_shape_check
  check (
    (kind = 'date_range'
      and start_date is not null and end_date is not null
      and weekday is null and period is null and nth is null)
    or
    (kind = 'weekly'
      and weekday is not null
      and start_date is null and end_date is null and nth is null)
    or
    (kind = 'monthly_nth'
      and weekday is not null
      and nth is not null and nth between -1 and 5 and nth <> 0
      and start_date is null and end_date is null)
  );
