-- Controla o badge "gerado por recorrência, por rever": fica true assim que
-- o admin/líder edita o evento ou a escala, ou quando publica.
alter table events add column recurrence_reviewed boolean not null default false;
