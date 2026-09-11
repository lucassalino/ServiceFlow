-- Simplifica a escada de planos pagos: o Broto passa a chamar-se "Plus" e o
-- Colheita passa a "Pro", absorvendo os limites e as funcionalidades do
-- Celeiro. Nenhum slug muda (org_subscriptions, coupons e o histórico
-- continuam a apontar para 'broto'/'colheita' sem qualquer migração de
-- dados) — só nome, preço, limites e features do Colheita.
--
-- O Celeiro deixa de estar disponível para novas assinaturas. Não há
-- assinaturas pagas nele (verificado: só uma organização, em cortesia
-- manual), por isso passa diretamente para o Pro, que já inclui tudo o
-- que o Celeiro tinha.

update public.plans set name = 'Plus' where slug = 'broto';

update public.plans set
  name           = 'Pro',
  price_monthly  = 25.99,
  price_annual   = 259.90,
  max_people     = null,
  max_ministries = null,
  max_leaders    = null,
  -- Stripe: os preços antigos (19,99€/199,90€) já não correspondem ao
  -- valor anunciado — ficam nulos até existirem Prices novos no Stripe
  -- para 25,99€/259,90€. Até lá, o checkout deste plano devolve
  -- "ainda não tem preço configurado" em vez de cobrar o valor errado.
  stripe_price_id_monthly = null,
  stripe_price_id_annual  = null,
  features = array[
    'member_history',
    'notifications',
    'recurring_unavailability',
    'calendar_sync',
    'event_timeline',
    'song_ranking',
    'pdf_export',
    'email_notifications',
    'engagement_reports',
    'priority_support'
  ]
where slug = 'colheita';

update public.org_subscriptions set plan = 'colheita' where plan = 'celeiro';

update public.plans set is_active = false where slug = 'celeiro';
