// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      area_seasons: {
        Row: {
          area_id: string
          created_at: string
          crop: string | null
          expected_yield: number | null
          id: string
          organization_id: string
          season_year: string
          updated_at: string
        }
        Insert: {
          area_id: string
          created_at?: string
          crop?: string | null
          expected_yield?: number | null
          id?: string
          organization_id: string
          season_year: string
          updated_at?: string
        }
        Update: {
          area_id?: string
          created_at?: string
          crop?: string | null
          expected_yield?: number | null
          id?: string
          organization_id?: string
          season_year?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'area_seasons_area_id_fkey'
            columns: ['area_id']
            isOneToOne: false
            referencedRelation: 'areas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'area_seasons_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      areas: {
        Row: {
          boundary: unknown
          created_at: string
          farm_id: string
          id: string
          name: string
          organization_id: string
          status: Database['public']['Enums']['record_status']
          total_area_ha: number | null
          updated_at: string
        }
        Insert: {
          boundary?: unknown
          created_at?: string
          farm_id: string
          id?: string
          name: string
          organization_id: string
          status?: Database['public']['Enums']['record_status']
          total_area_ha?: number | null
          updated_at?: string
        }
        Update: {
          boundary?: unknown
          created_at?: string
          farm_id?: string
          id?: string
          name?: string
          organization_id?: string
          status?: Database['public']['Enums']['record_status']
          total_area_ha?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'areas_farm_id_fkey'
            columns: ['farm_id']
            isOneToOne: false
            referencedRelation: 'farms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'areas_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string
          id: string
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      farms: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          producer_id: string
          state: string | null
          status: Database['public']['Enums']['record_status']
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          producer_id: string
          state?: string | null
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          producer_id?: string
          state?: string | null
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'farms_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'farms_producer_id_fkey'
            columns: ['producer_id']
            isOneToOne: false
            referencedRelation: 'producers'
            referencedColumns: ['id']
          },
        ]
      }
      import_files: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          import_id: string
          original_name: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          import_id: string
          original_name: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          import_id?: string
          original_name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'import_files_import_id_fkey'
            columns: ['import_id']
            isOneToOne: false
            referencedRelation: 'imports'
            referencedColumns: ['id']
          },
        ]
      }
      imports: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kind: Database['public']['Enums']['import_kind']
          log_messages: Json | null
          organization_id: string
          status: Database['public']['Enums']['import_status']
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          kind: Database['public']['Enums']['import_kind']
          log_messages?: Json | null
          organization_id: string
          status?: Database['public']['Enums']['import_status']
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database['public']['Enums']['import_kind']
          log_messages?: Json | null
          organization_id?: string
          status?: Database['public']['Enums']['import_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'imports_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'imports_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      lab_attributes: {
        Row: {
          category: string | null
          code: string
          created_at: string
          name: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          name: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          name?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lab_measurements: {
        Row: {
          attribute_code: string
          created_at: string
          id: string
          numeric_value: number | null
          organization_id: string
          sample_id: string
          text_value: string | null
          updated_at: string
        }
        Insert: {
          attribute_code: string
          created_at?: string
          id?: string
          numeric_value?: number | null
          organization_id: string
          sample_id: string
          text_value?: string | null
          updated_at?: string
        }
        Update: {
          attribute_code?: string
          created_at?: string
          id?: string
          numeric_value?: number | null
          organization_id?: string
          sample_id?: string
          text_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lab_measurements_attribute_code_fkey'
            columns: ['attribute_code']
            isOneToOne: false
            referencedRelation: 'lab_attributes'
            referencedColumns: ['code']
          },
          {
            foreignKeyName: 'lab_measurements_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lab_measurements_sample_id_fkey'
            columns: ['sample_id']
            isOneToOne: false
            referencedRelation: 'samples'
            referencedColumns: ['id']
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database['public']['Enums']['member_role']
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: Database['public']['Enums']['member_role']
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database['public']['Enums']['member_role']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      producers: {
        Row: {
          created_at: string
          document: string | null
          id: string
          name: string
          organization_id: string
          status: Database['public']['Enums']['record_status']
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          id?: string
          name: string
          organization_id: string
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'producers_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendation_items: {
        Row: {
          created_at: string
          dose: number
          id: string
          kind: Database['public']['Enums']['recommendation_kind']
          organization_id: string
          point_id: string
          product: string
          set_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dose: number
          id?: string
          kind: Database['public']['Enums']['recommendation_kind']
          organization_id: string
          point_id: string
          product: string
          set_id: string
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dose?: number
          id?: string
          kind?: Database['public']['Enums']['recommendation_kind']
          organization_id?: string
          point_id?: string
          product?: string
          set_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recommendation_items_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recommendation_items_point_id_fkey'
            columns: ['point_id']
            isOneToOne: false
            referencedRelation: 'sampling_points'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recommendation_items_set_id_fkey'
            columns: ['set_id']
            isOneToOne: false
            referencedRelation: 'recommendation_sets'
            referencedColumns: ['id']
          },
        ]
      }
      recommendation_sets: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recommendation_sets_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'sampling_campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recommendation_sets_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      samples: {
        Row: {
          code: string
          collection_date: string | null
          created_at: string
          depth_bottom_cm: number | null
          depth_top_cm: number | null
          id: string
          organization_id: string
          point_id: string
          updated_at: string
        }
        Insert: {
          code: string
          collection_date?: string | null
          created_at?: string
          depth_bottom_cm?: number | null
          depth_top_cm?: number | null
          id?: string
          organization_id: string
          point_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          collection_date?: string | null
          created_at?: string
          depth_bottom_cm?: number | null
          depth_top_cm?: number | null
          id?: string
          organization_id?: string
          point_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'samples_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'samples_point_id_fkey'
            columns: ['point_id']
            isOneToOne: false
            referencedRelation: 'sampling_points'
            referencedColumns: ['id']
          },
        ]
      }
      sampling_campaigns: {
        Row: {
          area_season_id: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          organization_id: string
          source: Database['public']['Enums']['campaign_source']
          start_date: string | null
          status: Database['public']['Enums']['record_status']
          updated_at: string
        }
        Insert: {
          area_season_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          organization_id: string
          source?: Database['public']['Enums']['campaign_source']
          start_date?: string | null
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
        }
        Update: {
          area_season_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          source?: Database['public']['Enums']['campaign_source']
          start_date?: string | null
          status?: Database['public']['Enums']['record_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sampling_campaigns_area_season_id_fkey'
            columns: ['area_season_id']
            isOneToOne: false
            referencedRelation: 'area_seasons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sampling_campaigns_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      sampling_points: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          location: unknown
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          location: unknown
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          location?: unknown
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sampling_points_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'sampling_campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sampling_points_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organizations: { Args: never; Returns: string[] }
      has_role_in_org: {
        Args: {
          allowed_roles: Database['public']['Enums']['member_role'][]
          org_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      campaign_source: 'sim' | 'historical_standardized'
      import_kind: 'geography' | 'soil_analysis' | 'recommendations'
      import_status: 'uploaded' | 'validating' | 'validated' | 'committed' | 'failed'
      member_role: 'admin' | 'technician' | 'viewer'
      recommendation_kind: 'corrective' | 'organic' | 'nutritional'
      record_status: 'active' | 'archived'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_source: ['sim', 'historical_standardized'],
      import_kind: ['geography', 'soil_analysis', 'recommendations'],
      import_status: ['uploaded', 'validating', 'validated', 'committed', 'failed'],
      member_role: ['admin', 'technician', 'viewer'],
      recommendation_kind: ['corrective', 'organic', 'nutritional'],
      record_status: ['active', 'archived'],
    },
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: area_seasons
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   area_id: uuid (not null)
//   season_year: text (not null)
//   crop: text (nullable)
//   expected_yield: numeric (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: areas
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   farm_id: uuid (not null)
//   name: text (not null)
//   total_area_ha: numeric (nullable)
//   boundary: geometry (nullable)
//   status: record_status (not null, default: 'active'::record_status)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: audit_logs
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (nullable)
//   user_id: uuid (nullable)
//   action: text (not null)
//   entity: text (not null)
//   entity_id: uuid (not null)
//   old_data: jsonb (nullable)
//   new_data: jsonb (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: farms
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   producer_id: uuid (not null)
//   name: text (not null)
//   city: text (nullable)
//   state: text (nullable)
//   status: record_status (not null, default: 'active'::record_status)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: import_files
//   id: uuid (not null, default: gen_random_uuid())
//   import_id: uuid (not null)
//   file_path: text (not null)
//   original_name: text (not null)
//   file_size: bigint (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: imports
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   kind: import_kind (not null)
//   status: import_status (not null, default: 'uploaded'::import_status)
//   created_by: uuid (not null)
//   log_messages: jsonb (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: lab_attributes
//   code: text (not null)
//   name: text (not null)
//   unit: text (nullable)
//   category: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: lab_measurements
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   sample_id: uuid (not null)
//   attribute_code: text (not null)
//   numeric_value: numeric (nullable)
//   text_value: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: organization_members
//   organization_id: uuid (not null)
//   user_id: uuid (not null)
//   role: member_role (not null, default: 'viewer'::member_role)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: organizations
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: producers
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   name: text (not null)
//   document: text (nullable)
//   status: record_status (not null, default: 'active'::record_status)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   full_name: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: recommendation_items
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   set_id: uuid (not null)
//   point_id: uuid (not null)
//   kind: recommendation_kind (not null)
//   product: text (not null)
//   dose: numeric (not null)
//   unit: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: recommendation_sets
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   campaign_id: uuid (not null)
//   name: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: samples
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   point_id: uuid (not null)
//   code: text (not null)
//   depth_top_cm: numeric (nullable)
//   depth_bottom_cm: numeric (nullable)
//   collection_date: date (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: sampling_campaigns
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   area_season_id: uuid (not null)
//   name: text (not null)
//   source: campaign_source (not null, default: 'sim'::campaign_source)
//   start_date: date (nullable)
//   end_date: date (nullable)
//   status: record_status (not null, default: 'active'::record_status)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: sampling_points
//   id: uuid (not null, default: gen_random_uuid())
//   organization_id: uuid (not null)
//   campaign_id: uuid (not null)
//   name: text (not null)
//   location: geometry (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())

// --- CONSTRAINTS ---
// Table: area_seasons
//   FOREIGN KEY area_seasons_area_id_fkey: FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
//   UNIQUE area_seasons_area_id_season_year_key: UNIQUE (area_id, season_year)
//   FOREIGN KEY area_seasons_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY area_seasons_pkey: PRIMARY KEY (id)
// Table: areas
//   FOREIGN KEY areas_farm_id_fkey: FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
//   FOREIGN KEY areas_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY areas_pkey: PRIMARY KEY (id)
// Table: audit_logs
//   PRIMARY KEY audit_logs_pkey: PRIMARY KEY (id)
// Table: farms
//   FOREIGN KEY farms_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY farms_pkey: PRIMARY KEY (id)
//   FOREIGN KEY farms_producer_id_fkey: FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE
// Table: import_files
//   FOREIGN KEY import_files_import_id_fkey: FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
//   PRIMARY KEY import_files_pkey: PRIMARY KEY (id)
// Table: imports
//   FOREIGN KEY imports_created_by_fkey: FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT
//   FOREIGN KEY imports_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY imports_pkey: PRIMARY KEY (id)
// Table: lab_attributes
//   PRIMARY KEY lab_attributes_pkey: PRIMARY KEY (code)
// Table: lab_measurements
//   CHECK has_value: CHECK (((numeric_value IS NOT NULL) OR (text_value IS NOT NULL)))
//   FOREIGN KEY lab_measurements_attribute_code_fkey: FOREIGN KEY (attribute_code) REFERENCES lab_attributes(code) ON DELETE RESTRICT
//   FOREIGN KEY lab_measurements_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY lab_measurements_pkey: PRIMARY KEY (id)
//   UNIQUE lab_measurements_sample_id_attribute_code_key: UNIQUE (sample_id, attribute_code)
//   FOREIGN KEY lab_measurements_sample_id_fkey: FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE
// Table: organization_members
//   FOREIGN KEY organization_members_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY organization_members_pkey: PRIMARY KEY (organization_id, user_id)
//   FOREIGN KEY organization_members_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: organizations
//   PRIMARY KEY organizations_pkey: PRIMARY KEY (id)
// Table: producers
//   FOREIGN KEY producers_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY producers_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: recommendation_items
//   FOREIGN KEY recommendation_items_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY recommendation_items_pkey: PRIMARY KEY (id)
//   FOREIGN KEY recommendation_items_point_id_fkey: FOREIGN KEY (point_id) REFERENCES sampling_points(id) ON DELETE CASCADE
//   FOREIGN KEY recommendation_items_set_id_fkey: FOREIGN KEY (set_id) REFERENCES recommendation_sets(id) ON DELETE CASCADE
// Table: recommendation_sets
//   FOREIGN KEY recommendation_sets_campaign_id_fkey: FOREIGN KEY (campaign_id) REFERENCES sampling_campaigns(id) ON DELETE CASCADE
//   FOREIGN KEY recommendation_sets_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY recommendation_sets_pkey: PRIMARY KEY (id)
// Table: samples
//   FOREIGN KEY samples_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY samples_pkey: PRIMARY KEY (id)
//   FOREIGN KEY samples_point_id_fkey: FOREIGN KEY (point_id) REFERENCES sampling_points(id) ON DELETE CASCADE
// Table: sampling_campaigns
//   FOREIGN KEY sampling_campaigns_area_season_id_fkey: FOREIGN KEY (area_season_id) REFERENCES area_seasons(id) ON DELETE CASCADE
//   FOREIGN KEY sampling_campaigns_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY sampling_campaigns_pkey: PRIMARY KEY (id)
// Table: sampling_points
//   FOREIGN KEY sampling_points_campaign_id_fkey: FOREIGN KEY (campaign_id) REFERENCES sampling_campaigns(id) ON DELETE CASCADE
//   FOREIGN KEY sampling_points_organization_id_fkey: FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY sampling_points_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: area_seasons
//   Policy "area_seasons_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "area_seasons_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "area_seasons_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "area_seasons_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: areas
//   Policy "areas_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "areas_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "areas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "areas_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: audit_logs
//   Policy "audit_logs_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
// Table: farms
//   Policy "farms_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "farms_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "farms_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "farms_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: import_files
//   Policy "import_files_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (import_id IN ( SELECT imports.id    FROM imports   WHERE has_role_in_org(imports.organization_id, ARRAY['admin'::member_role, 'technician'::member_role])))
//   Policy "import_files_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (import_id IN ( SELECT imports.id    FROM imports   WHERE has_role_in_org(imports.organization_id, ARRAY['admin'::member_role, 'technician'::member_role])))
//   Policy "import_files_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (import_id IN ( SELECT imports.id    FROM imports   WHERE (imports.organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))))
//   Policy "import_files_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (import_id IN ( SELECT imports.id    FROM imports   WHERE has_role_in_org(imports.organization_id, ARRAY['admin'::member_role, 'technician'::member_role])))
// Table: imports
//   Policy "imports_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "imports_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "imports_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "imports_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: lab_attributes
//   Policy "lab_attributes_modify" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM organization_members   WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.role = 'admin'::member_role))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM organization_members   WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.role = 'admin'::member_role))))
//   Policy "lab_attributes_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: lab_measurements
//   Policy "lab_measurements_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "lab_measurements_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "lab_measurements_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "lab_measurements_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: organization_members
//   Policy "org_members_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role])
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role])
//   Policy "org_members_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
// Table: organizations
//   Policy "org_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "org_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(id, ARRAY['admin'::member_role])
// Table: producers
//   Policy "producers_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "producers_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "producers_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "producers_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: profiles
//   Policy "profiles_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "profiles_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (id = auth.uid())
// Table: recommendation_items
//   Policy "recommendation_items_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "recommendation_items_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "recommendation_items_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "recommendation_items_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: recommendation_sets
//   Policy "recommendation_sets_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "recommendation_sets_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "recommendation_sets_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "recommendation_sets_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: samples
//   Policy "samples_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "samples_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "samples_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "samples_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: sampling_campaigns
//   Policy "sampling_campaigns_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "sampling_campaigns_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "sampling_campaigns_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "sampling_campaigns_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
// Table: sampling_points
//   Policy "sampling_points_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "sampling_points_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])
//   Policy "sampling_points_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (organization_id IN ( SELECT get_user_organizations() AS get_user_organizations))
//   Policy "sampling_points_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: has_role_in_org(organization_id, ARRAY['admin'::member_role, 'technician'::member_role])

// --- DATABASE FUNCTIONS ---
// FUNCTION audit_log_trigger()
//   CREATE OR REPLACE FUNCTION public.audit_log_trigger()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       old_data JSONB := NULL;
//       new_data JSONB := NULL;
//       org_id UUID := NULL;
//       ent_id UUID := NULL;
//   BEGIN
//       IF (TG_OP = 'UPDATE') THEN
//           old_data := to_jsonb(OLD);
//           new_data := to_jsonb(NEW);
//           org_id := (new_data->>'organization_id')::UUID;
//           ent_id := (new_data->>'id')::UUID;
//       ELSIF (TG_OP = 'INSERT') THEN
//           new_data := to_jsonb(NEW);
//           org_id := (new_data->>'organization_id')::UUID;
//           ent_id := (new_data->>'id')::UUID;
//       ELSIF (TG_OP = 'DELETE') THEN
//           old_data := to_jsonb(OLD);
//           org_id := (old_data->>'organization_id')::UUID;
//           ent_id := (old_data->>'id')::UUID;
//       END IF;
//
//       IF ent_id IS NOT NULL THEN
//           INSERT INTO public.audit_logs (
//               organization_id,
//               user_id,
//               action,
//               entity,
//               entity_id,
//               old_data,
//               new_data
//           ) VALUES (
//               org_id,
//               auth.uid(),
//               TG_OP,
//               TG_TABLE_NAME,
//               ent_id,
//               old_data,
//               new_data
//           );
//       END IF;
//
//       IF (TG_OP = 'DELETE') THEN
//           RETURN OLD;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION get_user_organizations()
//   CREATE OR REPLACE FUNCTION public.get_user_organizations()
//    RETURNS SETOF uuid
//    LANGUAGE sql
//    STABLE SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//       SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
//   $function$
//
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, email)
//     VALUES (NEW.id, NEW.email)
//     ON CONFLICT (id) DO NOTHING;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION has_role_in_org(uuid, member_role[])
//   CREATE OR REPLACE FUNCTION public.has_role_in_org(org_id uuid, allowed_roles member_role[])
//    RETURNS boolean
//    LANGUAGE sql
//    STABLE SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//       SELECT EXISTS (
//           SELECT 1
//           FROM public.organization_members
//           WHERE organization_id = org_id
//             AND user_id = auth.uid()
//             AND role = ANY(allowed_roles)
//       );
//   $function$
//
// FUNCTION set_updated_at()
//   CREATE OR REPLACE FUNCTION public.set_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       NEW.updated_at = NOW();
//       RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: area_seasons
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.area_seasons FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.area_seasons FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: areas
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: farms
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: imports
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.imports FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.imports FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: lab_attributes
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lab_attributes FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: lab_measurements
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.lab_measurements FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lab_measurements FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: organization_members
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: organizations
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: producers
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.producers FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.producers FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: profiles
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: recommendation_items
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.recommendation_items FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recommendation_items FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: recommendation_sets
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.recommendation_sets FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recommendation_sets FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: samples
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.samples FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.samples FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: sampling_campaigns
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.sampling_campaigns FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sampling_campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: sampling_points
//   audit_logs_trigger: CREATE TRIGGER audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.sampling_points FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sampling_points FOR EACH ROW EXECUTE FUNCTION set_updated_at()

// --- INDEXES ---
// Table: area_seasons
//   CREATE UNIQUE INDEX area_seasons_area_id_season_year_key ON public.area_seasons USING btree (area_id, season_year)
// Table: lab_measurements
//   CREATE UNIQUE INDEX lab_measurements_sample_id_attribute_code_key ON public.lab_measurements USING btree (sample_id, attribute_code)
