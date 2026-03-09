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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      connections: {
        Row: {
          addressee: string
          created_at: string
          id: string
          message: string | null
          requester: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          addressee: string
          created_at?: string
          id?: string
          message?: string | null
          requester: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          addressee?: string
          created_at?: string
          id?: string
          message?: string | null
          requester?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Relationships: []
      }
      endorsements: {
        Row: {
          created_at: string
          giver_id: string
          id: string
          note: string | null
          receiver_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          giver_id: string
          id?: string
          note?: string | null
          receiver_id: string
          tag: string
        }
        Update: {
          created_at?: string
          giver_id?: string
          id?: string
          note?: string | null
          receiver_id?: string
          tag?: string
        }
        Relationships: []
      }
      help_profile: {
        Row: {
          can_help_with: string[] | null
          created_at: string
          experience_tags: string[] | null
          id: string
          is_active: boolean
          needs_help_with: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_help_with?: string[] | null
          created_at?: string
          experience_tags?: string[] | null
          id?: string
          is_active?: boolean
          needs_help_with?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_help_with?: string[] | null
          created_at?: string
          experience_tags?: string[] | null
          id?: string
          is_active?: boolean
          needs_help_with?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      karma_log: {
        Row: {
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          connection_id: string
          content: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          connection_id: string
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          connection_id?: string
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          contact_pref: string
          created_at: string
          discoverable: boolean
          id: string
          show_email: boolean
          show_full_name: boolean
          show_phone: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_pref?: string
          created_at?: string
          discoverable?: boolean
          id?: string
          show_email?: boolean
          show_full_name?: boolean
          show_phone?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_pref?: string
          created_at?: string
          discoverable?: boolean
          id?: string
          show_email?: boolean
          show_full_name?: boolean
          show_phone?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_year: number | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          home_city: string | null
          home_country: string | null
          id: string
          karma_score: number
          languages: string[] | null
          onboarded: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          home_city?: string | null
          home_country?: string | null
          id?: string
          karma_score?: number
          languages?: string[] | null
          onboarded?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          home_city?: string | null
          home_country?: string | null
          id?: string
          karma_score?: number
          languages?: string[] | null
          onboarded?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          dest_city: string
          dest_country: string
          id: string
          is_active: boolean
          notes: string | null
          origin_city: string
          origin_country: string
          return_date: string | null
          role: Database["public"]["Enums"]["trip_role"]
          travel_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dest_city: string
          dest_country?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          origin_city: string
          origin_country?: string
          return_date?: string | null
          role?: Database["public"]["Enums"]["trip_role"]
          travel_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dest_city?: string
          dest_country?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          origin_city?: string
          origin_country?: string
          return_date?: string | null
          role?: Database["public"]["Enums"]["trip_role"]
          travel_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      connection_status: "pending" | "accepted" | "blocked"
      gender_type: "male" | "female" | "non_binary" | "prefer_not_to_say"
      trip_role: "traveller" | "helper"
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
      connection_status: ["pending", "accepted", "blocked"],
      gender_type: ["male", "female", "non_binary", "prefer_not_to_say"],
      trip_role: ["traveller", "helper"],
    },
  },
} as const
