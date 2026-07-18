-- A sincronização via link de subscrição (.ics por token) foi substituída por download por evento
-- (ficheiro .ics gerado no cliente, um por evento, a partir do botão "Adicionar ao calendário").
drop table if exists public.calendar_feed_tokens;
