export type OrgRole = 'admin' | 'leader' | 'member';
export type PlanId = 'free' | 'starter' | 'growth' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string; email: string; full_name: string;
  avatar_url: string | null; phone: string | null;
  created_at: string; updated_at: string;
}
export interface Organization {
  id: string; name: string; invite_code: string;
  logo_url: string | null; created_at: string; updated_at: string;
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
  location: string | null; color: string | null; cover_image_url: string | null;
  description: string | null; observations: string | null; is_published: boolean;
  created_by: string; created_at: string; updated_at: string;
}
export interface EventMinistry {
  id: string; event_id: string; ministry_id: string;
  ministry?: Ministry;
}
export interface EventSchedule {
  id: string; event_ministry_id: string; user_id: string;
  functions: string[]; confirmed: boolean | null; profile?: UserProfile;
}
export interface Song {
  id: string; org_id: string; name: string; artist: string | null;
  musical_key: string | null; bpm: number | null; ministry_id: string | null;
  lyrics: string | null; chords: string | null; youtube_url: string | null;
  created_at: string; updated_at: string;
}
export interface AppNotification {
  id: string; user_id: string; event_id: string | null;
  message: string; is_read: boolean; sent_at: string;
  event?: Pick<Event, 'id' | 'name' | 'date'>;
}
