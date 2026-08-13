export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      catalog_songs: {
        Row: {
          artist: string
          bpm: number | null
          chords: string | null
          created_at: string
          created_by: string | null
          id: string
          lyrics: string | null
          name: string
          source_org_id: string | null
          spotify_url: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          artist?: string
          bpm?: number | null
          chords?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lyrics?: string | null
          name: string
          source_org_id?: string | null
          spotify_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          artist?: string
          bpm?: number | null
          chords?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lyrics?: string | null
          name?: string
          source_org_id?: string | null
          spotify_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_songs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_songs_source_org_id_fkey"
            columns: ["source_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ministries: {
        Row: {
          event_id: string
          id: string
          ministry_id: string
        }
        Insert: {
          event_id: string
          id?: string
          ministry_id: string
        }
        Update: {
          event_id?: string
          id?: string
          ministry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_ministries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_ministries_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedules: {
        Row: {
          confirmed: boolean | null
          event_ministry_id: string
          functions: string[]
          id: string
          user_id: string
        }
        Insert: {
          confirmed?: boolean | null
          event_ministry_id: string
          functions?: string[]
          id?: string
          user_id: string
        }
        Update: {
          confirmed?: boolean | null
          event_ministry_id?: string
          functions?: string[]
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedules_event_ministry_id_fkey"
            columns: ["event_ministry_id"]
            isOneToOne: false
            referencedRelation: "event_ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_setlists: {
        Row: {
          event_id: string
          id: string
          musical_key: string | null
          note: string | null
          order_index: number
          song_id: string
        }
        Insert: {
          event_id: string
          id?: string
          musical_key?: string | null
          note?: string | null
          order_index?: number
          song_id: string
        }
        Update: {
          event_id?: string
          id?: string
          musical_key?: string | null
          note?: string | null
          order_index?: number
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_setlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_setlists_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_timeline_items: {
        Row: {
          created_at: string
          event_id: string
          id: string
          order_index: number
          time: string
          title: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          order_index?: number
          time: string
          title: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          order_index?: number
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_timeline_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          arrival_time: string | null
          color: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          date: string
          description: string | null
          id: string
          is_published: boolean
          location: string | null
          name: string
          observations: string | null
          org_id: string
          time: string
          updated_at: string
        }
        Insert: {
          arrival_time?: string | null
          color?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          name: string
          observations?: string | null
          org_id: string
          time: string
          updated_at?: string
        }
        Update: {
          arrival_time?: string | null
          color?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          name?: string
          observations?: string | null
          org_id?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_unavailability: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          kind: string
          org_id: string
          period: string | null
          reason: string | null
          start_date: string | null
          user_id: string
          weekday: number | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          kind: string
          org_id: string
          period?: string | null
          reason?: string | null
          start_date?: string | null
          user_id: string
          weekday?: number | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          kind?: string
          org_id?: string
          period?: string | null
          reason?: string | null
          start_date?: string | null
          user_id?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_unavailability_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_unavailability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries: {
        Row: {
          color: string
          created_at: string
          functions: string[]
          icon: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          functions?: string[]
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          functions?: string[]
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_members: {
        Row: {
          functions: string[]
          id: string
          is_active: boolean
          ministry_id: string
          user_id: string
        }
        Insert: {
          functions?: string[]
          id?: string
          is_active?: boolean
          ministry_id: string
          user_id: string
        }
        Update: {
          functions?: string[]
          id?: string
          is_active?: boolean
          ministry_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_members_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministry_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          event_id: string | null
          id: string
          is_read: boolean
          message: string
          sent_at: string
          user_id: string
        }
        Insert: {
          event_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          sent_at?: string
          user_id: string
        }
        Update: {
          event_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          org_id: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          name: string
          org_id: string
          role?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          org_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      songs: {
        Row: {
          artist: string | null
          bpm: number | null
          catalog_song_id: string | null
          chords: string | null
          created_at: string
          id: string
          lyrics: string | null
          ministry_id: string | null
          musical_key: string | null
          name: string
          org_id: string
          spotify_url: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          artist?: string | null
          bpm?: number | null
          catalog_song_id?: string | null
          chords?: string | null
          created_at?: string
          id?: string
          lyrics?: string | null
          ministry_id?: string | null
          musical_key?: string | null
          name: string
          org_id: string
          spotify_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          artist?: string | null
          bpm?: number | null
          catalog_song_id?: string | null
          chords?: string | null
          created_at?: string
          id?: string
          lyrics?: string | null
          ministry_id?: string | null
          musical_key?: string | null
          name?: string
          org_id?: string
          spotify_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_catalog_song_id_fkey"
            columns: ["catalog_song_id"]
            isOneToOne: false
            referencedRelation: "catalog_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          member_limit: number
          org_id: string
          plan: Database["public"]["Enums"]["plan_id"]
          revenuecat_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          member_limit?: number
          org_id: string
          plan?: Database["public"]["Enums"]["plan_id"]
          revenuecat_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          member_limit?: number
          org_id?: string
          plan?: Database["public"]["Enums"]["plan_id"]
          revenuecat_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_org_with_member: {
        Args: { invite_code: string; org_name: string; user_id: string }
        Returns: {
          created_at: string
          id: string
          invite_code: string
          logo_url: string | null
          name: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      delete_own_account: { Args: never; Returns: undefined }
      is_org_admin: { Args: { p_org_id: string }; Returns: boolean }
      is_org_admin_or_leader: { Args: { p_org_id: string }; Returns: boolean }
      is_org_member: { Args: { p_org_id: string }; Returns: boolean }
    }
    Enums: {
      org_role: "admin" | "leader" | "member"
      plan_id: "free" | "starter" | "growth" | "pro" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      org_role: ["admin", "leader", "member"],
      plan_id: ["free", "starter", "growth", "pro", "enterprise"],
    },
  },
} as const
