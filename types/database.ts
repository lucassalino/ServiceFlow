export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      event_ministries: {
        Row: { event_id: string; id: string; ministry_id: string }
        Insert: { event_id: string; id?: string; ministry_id: string }
        Update: { event_id?: string; id?: string; ministry_id?: string }
        Relationships: [
          { foreignKeyName: "event_ministries_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
          { foreignKeyName: "event_ministries_ministry_id_fkey"; columns: ["ministry_id"]; isOneToOne: false; referencedRelation: "ministries"; referencedColumns: ["id"] },
        ]
      }
      event_schedules: {
        Row: { confirmed: boolean | null; event_ministry_id: string; functions: string[]; id: string; user_id: string }
        Insert: { confirmed?: boolean | null; event_ministry_id: string; functions?: string[]; id?: string; user_id: string }
        Update: { confirmed?: boolean | null; event_ministry_id?: string; functions?: string[]; id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "event_schedules_event_ministry_id_fkey"; columns: ["event_ministry_id"]; isOneToOne: false; referencedRelation: "event_ministries"; referencedColumns: ["id"] },
          { foreignKeyName: "event_schedules_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      event_setlists: {
        Row: { event_id: string; id: string; order_index: number; song_id: string }
        Insert: { event_id: string; id?: string; order_index?: number; song_id: string }
        Update: { event_id?: string; id?: string; order_index?: number; song_id?: string }
        Relationships: [
          { foreignKeyName: "event_setlists_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
          { foreignKeyName: "event_setlists_song_id_fkey"; columns: ["song_id"]; isOneToOne: false; referencedRelation: "songs"; referencedColumns: ["id"] },
        ]
      }
      events: {
        Row: { color: string | null; created_at: string; created_by: string; date: string; description: string | null; id: string; is_published: boolean; location: string | null; name: string; observations: string | null; org_id: string; time: string; updated_at: string }
        Insert: { color?: string | null; created_at?: string; created_by: string; date: string; description?: string | null; id?: string; is_published?: boolean; location?: string | null; name: string; observations?: string | null; org_id: string; time: string; updated_at?: string }
        Update: { color?: string | null; created_at?: string; created_by?: string; date?: string; description?: string | null; id?: string; is_published?: boolean; location?: string | null; name?: string; observations?: string | null; org_id?: string; time?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: "events_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "events_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      ministries: {
        Row: { color: string; created_at: string; icon: string; id: string; name: string; org_id: string; updated_at: string }
        Insert: { color?: string; created_at?: string; icon?: string; id?: string; name: string; org_id: string; updated_at?: string }
        Update: { color?: string; created_at?: string; icon?: string; id?: string; name?: string; org_id?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: "ministries_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      ministry_members: {
        Row: { functions: string[]; id: string; is_active: boolean; ministry_id: string; user_id: string }
        Insert: { functions?: string[]; id?: string; is_active?: boolean; ministry_id: string; user_id: string }
        Update: { functions?: string[]; id?: string; is_active?: boolean; ministry_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "ministry_members_ministry_id_fkey"; columns: ["ministry_id"]; isOneToOne: false; referencedRelation: "ministries"; referencedColumns: ["id"] },
          { foreignKeyName: "ministry_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      notifications: {
        Row: { event_id: string | null; id: string; is_read: boolean; message: string; sent_at: string; user_id: string }
        Insert: { event_id?: string | null; id?: string; is_read?: boolean; message: string; sent_at?: string; user_id: string }
        Update: { event_id?: string | null; id?: string; is_read?: boolean; message?: string; sent_at?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "notifications_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      organization_members: {
        Row: { id: string; is_active: boolean; joined_at: string; org_id: string; role: Database["public"]["Enums"]["org_role"]; user_id: string }
        Insert: { id?: string; is_active?: boolean; joined_at?: string; org_id: string; role?: Database["public"]["Enums"]["org_role"]; user_id: string }
        Update: { id?: string; is_active?: boolean; joined_at?: string; org_id?: string; role?: Database["public"]["Enums"]["org_role"]; user_id?: string }
        Relationships: [
          { foreignKeyName: "organization_members_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "organization_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      organizations: {
        Row: { created_at: string; id: string; invite_code: string; logo_url: string | null; name: string; updated_at: string }
        Insert: { created_at?: string; id?: string; invite_code: string; logo_url?: string | null; name: string; updated_at?: string }
        Update: { created_at?: string; id?: string; invite_code?: string; logo_url?: string | null; name?: string; updated_at?: string }
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; email: string; full_name: string; id: string; phone: string | null; updated_at: string }
        Insert: { avatar_url?: string | null; created_at?: string; email: string; full_name?: string; id: string; phone?: string | null; updated_at?: string }
        Update: { avatar_url?: string | null; created_at?: string; email?: string; full_name?: string; id?: string; phone?: string | null; updated_at?: string }
        Relationships: []
      }
      songs: {
        Row: { artist: string | null; bpm: number | null; chords: string | null; created_at: string; id: string; lyrics: string | null; ministry_id: string | null; musical_key: string | null; name: string; org_id: string; updated_at: string; youtube_url: string | null }
        Insert: { artist?: string | null; bpm?: number | null; chords?: string | null; created_at?: string; id?: string; lyrics?: string | null; ministry_id?: string | null; musical_key?: string | null; name: string; org_id: string; updated_at?: string; youtube_url?: string | null }
        Update: { artist?: string | null; bpm?: number | null; chords?: string | null; created_at?: string; id?: string; lyrics?: string | null; ministry_id?: string | null; musical_key?: string | null; name?: string; org_id?: string; updated_at?: string; youtube_url?: string | null }
        Relationships: [
          { foreignKeyName: "songs_ministry_id_fkey"; columns: ["ministry_id"]; isOneToOne: false; referencedRelation: "ministries"; referencedColumns: ["id"] },
          { foreignKeyName: "songs_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      subscriptions: {
        Row: { created_at: string; expires_at: string | null; id: string; is_active: boolean; member_limit: number; org_id: string; plan: Database["public"]["Enums"]["plan_id"]; revenuecat_id: string | null; updated_at: string }
        Insert: { created_at?: string; expires_at?: string | null; id?: string; is_active?: boolean; member_limit?: number; org_id: string; plan?: Database["public"]["Enums"]["plan_id"]; revenuecat_id?: string | null; updated_at?: string }
        Update: { created_at?: string; expires_at?: string | null; id?: string; is_active?: boolean; member_limit?: number; org_id?: string; plan?: Database["public"]["Enums"]["plan_id"]; revenuecat_id?: string | null; updated_at?: string }
        Relationships: [
          { foreignKeyName: "subscriptions_org_id_fkey"; columns: ["org_id"]; isOneToOne: true; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_org_admin: { Args: { p_org_id: string }; Returns: boolean }
      is_org_admin_or_leader: { Args: { p_org_id: string }; Returns: boolean }
      is_org_member: { Args: { p_org_id: string }; Returns: boolean }
    }
    Enums: {
      org_role: "admin" | "leader" | "member"
      plan_id: "free" | "starter" | "growth" | "pro" | "enterprise"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]
