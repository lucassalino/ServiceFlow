-- Quais funções desse ministério são necessárias neste evento recorrente
-- (ex.: só "baterista" e "guitarrista", não o ministério todo) — usado para
-- a escala automática atribuir no máximo uma pessoa por função.
alter table event_recurrence_ministries add column functions text[] not null default '{}';
