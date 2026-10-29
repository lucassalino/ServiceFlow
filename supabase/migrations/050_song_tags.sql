-- Tags livres por música (ex.: "louvor", "adoração", "infantil") — usadas
-- para a seleção automática de repertório por quantidade.
alter table songs add column tags text[] not null default '{}';
create index songs_tags_gin_idx on songs using gin(tags);
