-- Liga o Pro (ex-Colheita) aos Prices novos no Stripe, criados a 25,99€/mês
-- e 259,90€/ano (a migração 043 tinha deixado isto a null de propósito,
-- para o checkout não cobrar o valor antigo de 19,99€/199,90€ enquanto os
-- Prices novos não existiam).

update public.plans set
  stripe_price_id_monthly = 'price_1UEVVdFr4A5MTnVPPaqvrE1t',
  stripe_price_id_annual  = 'price_1UEVWOFr4A5MTnVPNMxNKhna'
where slug = 'colheita';
