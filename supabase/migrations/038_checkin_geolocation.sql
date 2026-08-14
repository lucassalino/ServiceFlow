-- Check-in por QR code com validação de localização: a organização define
-- a coordenada da igreja (capturada uma vez, em definições) e um raio em
-- metros; o check-in só é aceite se o telemóvel reportar estar dentro
-- desse raio no momento em que confirma presença. checked_out_at fecha o
-- ciclo (mesma leitura de QR serve para entrada e saída).

alter table public.organizations
  add column if not exists checkin_latitude double precision,
  add column if not exists checkin_longitude double precision,
  add column if not exists checkin_radius_meters integer not null default 150;

alter table public.event_schedules
  add column if not exists checked_out_at timestamptz;
