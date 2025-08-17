export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bingo_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: number
          photo_url: string | null
          session_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          photo_url?: string | null
          session_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          photo_url?: string | null
          session_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: number
          photo_url: string | null
          session_id: string | null
          time_limit: number | null
          title: string
          type: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          photo_url?: string | null
          session_id?: string | null
          time_limit?: number | null
          title: string
          type: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          photo_url?: string | null
          session_id?: string | null
          time_limit?: number | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      live_challenges: {
        Row: {
          created_at: string
          description: string | null
          id: number
          session_id: string
          time_limit: number | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          session_id: string
          time_limit?: number | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          session_id?: string
          time_limit?: number | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      live_messages: {
        Row: {
          created_at: string
          id: number
          message: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
          session_id?: string
        }
        Relationships: []
      }
      party_photos: {
        Row: {
          created_at: string
          id: number
          is_photo_of_night: boolean
          photo_url: string
          uploaded_at: string
          uploader_name: string
          votes: number
        }
        Insert: {
          created_at?: string
          id?: number
          is_photo_of_night?: boolean
          photo_url: string
          uploaded_at?: string
          uploader_name?: string
          votes?: number
        }
        Update: {
          created_at?: string
          id?: number
          is_photo_of_night?: boolean
          photo_url?: string
          uploaded_at?: string
          uploader_name?: string
          votes?: number
        }
        Relationships: []
      }
      points_history: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          session_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          session_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          session_id?: string
          transaction_type?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          id: string
          last_activity: string | null
          pending_task: number | null
          points_balance: number | null
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          last_activity?: string | null
          pending_task?: number | null
          points_balance?: number | null
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          pending_task?: number | null
          points_balance?: number | null
          user_name?: string | null
        }
        Relationships: []
      }
      shop_purchases: {
        Row: {
          created_at: string
          id: number
          item_id: string
          item_name: string
          price: number
          purchased_at: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          item_id: string
          item_name: string
          price: number
          purchased_at?: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: number
          item_id?: string
          item_name?: string
          price?: number
          purchased_at?: string
          session_id?: string
        }
        Relationships: []
      }
      treasure_hunt: {
        Row: {
          created_at: string | null
          found: boolean | null
          found_at: string | null
          id: number
          location_name: string
          photo_url: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          found?: boolean | null
          found_at?: string | null
          id?: number
          location_name: string
          photo_url?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          found?: boolean | null
          found_at?: string | null
          id?: number
          location_name?: string
          photo_url?: string | null
          session_id?: string | null
        }
        Relationships: []
      }

    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_session_context: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      set_session_context: {
        Args: { session_id: string }
        Returns: undefined
      }
      verify_session_access: {
        Args: { session_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
