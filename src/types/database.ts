export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; full_name: string; avatar_url: string | null; phone: string | null; created_at: string; updated_at: string };
        Insert: { id: string; email: string; full_name: string; avatar_url?: string | null; phone?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; email?: string; full_name?: string; avatar_url?: string | null; phone?: string | null; updated_at?: string };
        Relationships: [];
      };
      organizations: {
        Row: { id: string; name: string; invite_code: string; logo_url: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; invite_code?: string; logo_url?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; invite_code?: string; logo_url?: string | null; updated_at?: string };
        Relationships: [];
      };
      organization_members: {
        Row: { id: string; org_id: string; user_id: string; role: string; is_active: boolean; joined_at: string };
        Insert: { id?: string; org_id: string; user_id: string; role?: string; is_active?: boolean; joined_at?: string };
        Update: { id?: string; org_id?: string; user_id?: string; role?: string; is_active?: boolean };
        Relationships: [];
      };
      ministries: {
        Row: { id: string; org_id: string; name: string; icon: string; color: string; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; name: string; icon?: string; color?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; org_id?: string; name?: string; icon?: string; color?: string; updated_at?: string };
        Relationships: [];
      };
      events: {
        Row: { id: string; org_id: string; name: string; date: string; time: string; location: string | null; color: string | null; description: string | null; observations: string | null; is_published: boolean; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; name: string; date: string; time: string; location?: string | null; color?: string | null; description?: string | null; observations?: string | null; is_published?: boolean; created_by: string; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; date?: string; time?: string; location?: string | null; color?: string | null; description?: string | null; observations?: string | null; is_published?: boolean; updated_at?: string };
        Relationships: [];
      };
      event_ministries: {
        Row: { id: string; event_id: string; ministry_id: string };
        Insert: { id?: string; event_id: string; ministry_id: string };
        Update: { id?: string; event_id?: string; ministry_id?: string };
        Relationships: [];
      };
      event_schedules: {
        Row: { id: string; event_ministry_id: string; user_id: string; functions: string[]; confirmed: boolean | null };
        Insert: { id?: string; event_ministry_id: string; user_id: string; functions?: string[]; confirmed?: boolean | null };
        Update: { id?: string; user_id?: string; functions?: string[]; confirmed?: boolean | null };
        Relationships: [];
      };
      songs: {
        Row: { id: string; org_id: string; name: string; artist: string | null; musical_key: string | null; bpm: number | null; ministry_id: string | null; lyrics: string | null; chords: string | null; youtube_url: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; name: string; artist?: string | null; musical_key?: string | null; bpm?: number | null; ministry_id?: string | null; lyrics?: string | null; chords?: string | null; youtube_url?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; artist?: string | null; musical_key?: string | null; bpm?: number | null; ministry_id?: string | null; lyrics?: string | null; chords?: string | null; youtube_url?: string | null; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
