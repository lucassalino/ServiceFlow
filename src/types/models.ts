export type OrgRole = 'admin' | 'leader' | 'member';
export type PlanId = 'free' | 'starter' | 'growth' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string; email: string; full_name: string;
  avatar_url: string | null; phone: string | null;
  birthday: string | null;
  created_at: string; updated_at: string;
}
export interface Organization {
  id: string; name: string; invite_code: string;
  logo_url: string | null; created_at: string; updated_at: string;
  checkin_latitude: number | null; checkin_longitude: number | null;
  checkin_radius_meters: number;
  disabled_features: string[];
}
export interface OrganizationMember {
  id: string; org_id: string; user_id: string;
  role: OrgRole; is_active: boolean; joined_at: string;
  profile?: UserProfile;
}
export interface Ministry {
  id: string; org_id: string; name: string;
  icon: string; color: string; functions: string[];
  is_active: boolean; created_at: string; updated_at: string;
}
export interface MinistryMember {
  id: string; ministry_id: string; user_id: string;
  functions: string[]; is_active: boolean; profile?: UserProfile;
}
export interface Event {
  id: string; org_id: string; name: string; date: string; time: string;
  arrival_time: string | null;
  location: string | null; color: string | null; cover_image_url: string | null;
  description: string | null; observations: string | null; is_published: boolean;
  created_by: string; created_at: string; updated_at: string;
}
export interface EventActivityLogEntry {
  id: string; org_id: string; event_id: string;
  actor_id: string | null; actor_name: string; message: string; created_at: string;
}
export interface EventMinistry {
  id: string; event_id: string; ministry_id: string;
  ministry?: Ministry;
}
export interface EventSchedule {
  id: string; event_ministry_id: string; user_id: string;
  functions: string[]; confirmed: boolean | null;
  checked_in_at: string | null; checked_out_at: string | null;
  profile?: UserProfile;
}
export interface Announcement {
  id: string; org_id: string; title: string; body: string; pinned: boolean;
  created_by: string; created_at: string; updated_at: string;
  profile?: UserProfile;
}
/** Um momento do roteiro de culto (estrutura herdada da app HolyFlow). */
export interface LiturgyMoment {
  nome: string;
  tipo: 'pessoa' | 'video' | 'projecao';
  responsavel: string;
  duracao: string;
  obs: string;
  palavraTema: string;
  palavraTexto: string;
  musicas: string[];
  avisos: string[];
}
export interface Liturgy {
  id: string; org_id: string; event_id: string | null;
  name: string; date: string | null;
  theme: string; key_verse: string; moments: LiturgyMoment[];
  created_by: string; created_at: string; updated_at: string;
  profile?: UserProfile;
}
export interface Song {
  id: string; org_id: string; name: string; artist: string | null;
  musical_key: string | null; bpm: number | null; ministry_id: string | null;
  lyrics: string | null; chords: string | null;
  youtube_url: string | null; spotify_url: string | null;
  duration: string | null; bible_reference: string | null; cover_image_url: string | null;
  catalog_song_id: string | null;
  created_at: string; updated_at: string;
}
/** Entrada do catálogo GLOBAL, partilhada por todas as organizações. */
export interface CatalogSong {
  id: string; name: string; artist: string;
  lyrics: string | null; chords: string | null;
  youtube_url: string | null; spotify_url: string | null;
  bpm: number | null;
  source_org_id: string | null; created_by: string | null;
  created_at: string; updated_at: string;
}
export interface AppNotification {
  id: string; user_id: string; event_id: string | null;
  message: string; is_read: boolean; sent_at: string;
  event?: Pick<Event, 'id' | 'name' | 'date'>;
}
