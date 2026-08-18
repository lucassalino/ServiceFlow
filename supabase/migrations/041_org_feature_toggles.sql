-- Permite ao administrador esconder funcionalidades da app para a sua
-- organização (Check-in, Relatórios, Roteiros, Mural), sem afetar o plano.
-- Vazio = tudo visível (o padrão atual, nada muda para quem já usa a app).
alter table public.organizations
  add column if not exists disabled_features text[] not null default '{}';
