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
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ministries: {
        Row: { id: string; org_id: string; name: string; icon: string; color: string; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; name: string; icon?: string; color?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; org_id?: string; name?: string; icon?: string; color?: string; updated_at?: string };
        Relationships: [
          {
            foreignKeyName: "ministries_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: { id: string; org_id: string; name: string; date: string; time: string; location: string | null; color: string | null; description: string | null; observations: string | null; is_published: boolean; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; name: string; date: string; time: string; location?: string | null; color?: string | null; description?: string | null; observations?: string | null; is_published?: boolean; created_by: string; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; date?: string; time?: string; location?: string | null; color?: string | null; description?: string | null; observations?: string | null; is_published?: boolean; updated_at?: string };
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_ministries: {
        Row: { id: string; event_id: string; ministry_id: string };
        Insert: { id?: string; event_id: string; ministry_id: string };
        Update: { id?: string; event_id?: string; ministry_id?: string };
        Relationships: [
          {
            foreignKeyName: "event_ministries_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_ministries_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
        ];
      };
      event_schedules: {
        Row: { id: string; event_ministry_id: string; user_id: string; functions: string[]; confirmed: boolean | null };
        Insert: { id?: string; event_ministry_id: string; user_id: string; functions?: string[]; confirmed?: boolean | null };
        Update: { id?: string; user_id?: string; functions?: string[]; confirmed?: boolean | null };
        Relationships: [
          {
            foreignKeyName: "event_schedules_event_ministry_id_fkey";
            columns: ["event_ministry_id"];
            isOneToOne: false;
            referencedRelation: "event_ministries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_schedules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      songs: {
        Row: { id: string; org_id: string; name: string; artist: string | null; musical_key: string | null; bpm: number | null; ministry_id: string | null; lyrics: string | null; chords: string | null; youtube_url: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; name: string; artist?: string | null; musical_key?: string | null; bpm?: number | null; ministry_id?: string | null; lyrics?: string | null; chords?: string | null; youtube_url?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; artist?: string | null; musical_key?: string | null; bpm?: number | null; ministry_id?: string | null; lyrics?: string | null; chords?: string | null; youtube_url?: string | null; updated_at?: string };
        Relationships: [
          {
            foreignKeyName: "songs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "songs_ministry_id_fkey";
            columns: ["ministry_id"];
            isOneToOne: false;
            referencedRelation: "ministries";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: { id: string; user_id: string; event_id: string | null; message: string; is_read: boolean; sent_at: string };
        Insert: { id?: string; user_id: string; event_id?: string | null; message: string; is_read?: boolean; sent_at?: string };
        Update: { id?: string; is_read?: boolean };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_org_with_member: {
        Args: { org_name: string; invite_code: string; user_id: string };
        Returns: { id: string; name: string; invite_code: string; logo_url: string | null; created_at: string; updated_at: string }[];
      };
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
