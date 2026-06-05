import type { PlanId } from '@/constants';

export type OrgRole = 'admin' | 'leader' | 'member';

export type MemberFunction =
  | 'vocalist'
  | 'back_vocal'
  | 'guitarist'
  | 'bass'
  | 'drummer'
  | 'keys'
  | 'acoustic'
  | 'sound_operator'
  | 'camera_operator'
  | 'media'
  | 'reception'
  | 'teacher'
  | 'auxiliary'
  | string;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  is_active: boolean;
  joined_at: string;
  profile?: UserProfile;
  organization?: Organization;
}

export interface Ministry {
  id: string;
  org_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface MinistryMember {
  id: string;
  ministry_id: string;
  user_id: string;
  functions: MemberFunction[];
  is_active: boolean;
  profile?: UserProfile;
}

export interface Event {
  id: string;
  org_id: string;
  name: string;
  date: string;
  time: string;
  location: string | null;
  color: string | null;
  description: string | null;
  observations: string | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventMinistry {
  id: string;
  event_id: string;
  ministry_id: string;
  ministry?: Ministry;
}

export interface EventSchedule {
  id: string;
  event_ministry_id: string;
  user_id: string;
  functions: MemberFunction[];
  confirmed: boolean | null;
  profile?: UserProfile;
}

export interface Song {
  id: string;
  org_id: string;
  ministry_id: string | null;
  name: string;
  artist: string | null;
  musical_key: string | null;
  bpm: number | null;
  lyrics: string | null;
  youtube_url: string | null;
  chords: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventSetlist {
  id: string;
  event_id: string;
  song_id: string;
  order_index: number;
  song?: Song;
}

export interface Subscription {
  id: string;
  org_id: string;
  plan: PlanId;
  member_limit: number;
  is_active: boolean;
  revenuecat_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  event_id: string | null;
  message: string;
  is_read: boolean;
  sent_at: string;
}

// Re-export PlanId so consumers can import from types
export type { PlanId };
