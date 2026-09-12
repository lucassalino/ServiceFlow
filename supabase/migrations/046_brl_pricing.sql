-- Preço e Price IDs em BRL para os planos pagos, para o checkout e a
-- página de planos poderem cobrar/mostrar em reais em vez de só euros.
-- Preço em BRL não é a conversão direta do EUR — foi definido à parte,
-- pensando no mercado brasileiro (ver conversa na sessão).

alter table public.plans
  add column if not exists price_monthly_brl numeric(10,2),
  add column if not exists price_annual_brl  numeric(10,2),
  add column if not exists stripe_price_id_monthly_brl text,
  add column if not exists stripe_price_id_annual_brl  text;

update public.plans set
  price_monthly_brl = 49.90,
  price_annual_brl  = 499.90,
  stripe_price_id_monthly_brl = 'price_1UEsJRFr4A5MTnVPm6KbLxIh',
  stripe_price_id_annual_brl  = 'price_1UEsKiFr4A5MTnVPD0rrS0uM'
where slug = 'broto';

update public.plans set
  price_monthly_brl = 99.90,
  price_annual_brl  = 999.90,
  stripe_price_id_monthly_brl = 'price_1UEsLyFr4A5MTnVPc0VY3WtE',
  stripe_price_id_annual_brl  = 'price_1UEsMSFr4A5MTnVPCXQyra6t'
where slug = 'colheita';
