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
      alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          driver_id: string
          id: string
          message: string | null
          route_id: string
          trip_id: string | null
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          driver_id: string
          id?: string
          message?: string | null
          route_id: string
          trip_id?: string | null
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          driver_id?: string
          id?: string
          message?: string | null
          route_id?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_locations: {
        Row: {
          bus_id: string
          heading: number | null
          id: number
          lat: number
          lng: number
          recorded_at: string
          speed: number | null
          trip_id: string | null
        }
        Insert: {
          bus_id: string
          heading?: number | null
          id?: number
          lat: number
          lng: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string | null
        }
        Update: {
          bus_id?: string
          heading?: number | null
          id?: number
          lat?: number
          lng?: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_locations_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_passes: {
        Row: {
          created_at: string
          fee_paid: boolean
          id: string
          pickup_stop_id: string | null
          route_id: string
          secret: string
          status: Database["public"]["Enums"]["pass_status"]
          student_id: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          fee_paid?: boolean
          id?: string
          pickup_stop_id?: string | null
          route_id: string
          secret?: string
          status?: Database["public"]["Enums"]["pass_status"]
          student_id: string
          valid_from?: string
          valid_until?: string
        }
        Update: {
          created_at?: string
          fee_paid?: boolean
          id?: string
          pickup_stop_id?: string | null
          route_id?: string
          secret?: string
          status?: Database["public"]["Enums"]["pass_status"]
          student_id?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "bus_passes_pickup_stop_id_fkey"
            columns: ["pickup_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_passes_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          active: boolean
          bus_number: string
          capacity: number
          created_at: string
          driver_id: string | null
          id: string
          plate: string | null
          route_id: string | null
        }
        Insert: {
          active?: boolean
          bus_number: string
          capacity?: number
          created_at?: string
          driver_id?: string | null
          id?: string
          plate?: string | null
          route_id?: string | null
        }
        Update: {
          active?: boolean
          bus_number?: string
          capacity?: number
          created_at?: string
          driver_id?: string | null
          id?: string
          plate?: string | null
          route_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buses_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          roll_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          photo_url?: string | null
          roll_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          roll_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          active: boolean
          created_at: string
          departure_time: string | null
          description: string | null
          id: string
          name: string
          polyline: Json
          route_number: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          departure_time?: string | null
          description?: string | null
          id?: string
          name: string
          polyline?: Json
          route_number: string
        }
        Update: {
          active?: boolean
          created_at?: string
          departure_time?: string | null
          description?: string | null
          id?: string
          name?: string
          polyline?: Json
          route_number?: string
        }
        Relationships: []
      }
      stops: {
        Row: {
          id: string
          lat: number
          lng: number
          name: string
          route_id: string
          scheduled_time: string | null
          stop_order: number
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          name: string
          route_id: string
          scheduled_time?: string | null
          stop_order: number
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          name?: string
          route_id?: string
          scheduled_time?: string | null
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          active: boolean
          bus_id: string
          driver_id: string
          ended_at: string | null
          id: string
          route_id: string
          started_at: string
        }
        Insert: {
          active?: boolean
          bus_id: string
          driver_id: string
          ended_at?: string | null
          id?: string
          route_id: string
          started_at?: string
        }
        Update: {
          active?: boolean
          bus_id?: string
          driver_id?: string
          ended_at?: string | null
          id?: string
          route_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      latest_bus_locations: {
        Row: {
          bus_id: string | null
          heading: number | null
          lat: number | null
          lng: number | null
          recorded_at: string | null
          speed: number | null
          trip_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_locations_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_type: "breakdown" | "traffic_delay" | "route_change" | "other"
      app_role: "student" | "driver" | "admin"
      pass_status: "pending" | "active" | "expired" | "rejected"
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
      alert_type: ["breakdown", "traffic_delay", "route_change", "other"],
      app_role: ["student", "driver", "admin"],
      pass_status: ["pending", "active", "expired", "rejected"],
    },
  },
} as const
