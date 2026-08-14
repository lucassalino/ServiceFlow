-- Controle de presença: registra quando a pessoa foi efetivamente marcada
-- como presente no evento (check-in), separado do "confirmed" (RSVP prévio).
-- null = sem check-in feito; timestamp = quando foi marcada como presente.

alter table public.event_schedules
  add column if not exists checked_in_at timestamptz;
