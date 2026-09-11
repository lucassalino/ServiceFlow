-- O Plus (slug 'broto') passa a incluir 1 líder, além do admin.
update public.plans set max_leaders = 1 where slug = 'broto';
