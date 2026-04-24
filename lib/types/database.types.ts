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
      chapters: {
        Row: {
          display_order: number
          id: string
          name: string
          slug: string
          subject_id: string
          weightage_percent: number | null
        }
        Insert: {
          display_order?: number
          id?: string
          name: string
          slug: string
          subject_id: string
          weightage_percent?: number | null
        }
        Update: {
          display_order?: number
          id?: string
          name?: string
          slug?: string
          subject_id?: string
          weightage_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          question_id: string | null
          solution_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          question_id?: string | null
          solution_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          question_id?: string | null
          solution_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_conversations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_conversations_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contributor_submissions: {
        Row: {
          ai_check_notes: string | null
          ai_check_status: string | null
          created_at: string
          id: string
          moderator_notes: string | null
          moderator_status: string
          payload: Json
          question_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submission_type: string
          user_id: string
          xp_awarded: number | null
        }
        Insert: {
          ai_check_notes?: string | null
          ai_check_status?: string | null
          created_at?: string
          id?: string
          moderator_notes?: string | null
          moderator_status?: string
          payload: Json
          question_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submission_type: string
          user_id: string
          xp_awarded?: number | null
        }
        Update: {
          ai_check_notes?: string | null
          ai_check_status?: string | null
          created_at?: string
          id?: string
          moderator_notes?: string | null
          moderator_status?: string
          payload?: Json
          question_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submission_type?: string
          user_id?: string
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contributor_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributor_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributor_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          id: string
          question_ids: string[]
        }
        Insert: {
          challenge_date: string
          created_at?: string
          id?: string
          question_ids: string[]
        }
        Update: {
          challenge_date?: string
          created_at?: string
          id?: string
          question_ids?: string[]
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_inr: number
          created_at: string
          id: string
          metadata: Json | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_inr: number
          created_at?: string
          id?: string
          metadata?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_inr?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_attempts: {
        Row: {
          approach_chosen_at: string | null
          attempted_at: string
          chosen_approach: string | null
          coach_used: boolean
          hint_used: boolean
          id: string
          is_correct: boolean | null
          question_id: string
          session_id: string
          submitted_answer: Json | null
          time_taken_seconds: number
          user_id: string
        }
        Insert: {
          approach_chosen_at?: string | null
          attempted_at?: string
          chosen_approach?: string | null
          coach_used?: boolean
          hint_used?: boolean
          id?: string
          is_correct?: boolean | null
          question_id: string
          session_id: string
          submitted_answer?: Json | null
          time_taken_seconds: number
          user_id: string
        }
        Update: {
          approach_chosen_at?: string | null
          attempted_at?: string
          chosen_approach?: string | null
          coach_used?: boolean
          hint_used?: boolean
          id?: string
          is_correct?: boolean | null
          question_id?: string
          session_id?: string
          submitted_answer?: Json | null
          time_taken_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          chapter_id: string | null
          correct_count: number
          ended_at: string | null
          id: string
          session_type: string
          started_at: string
          subject_id: string | null
          topic_id: string | null
          total_questions: number
          total_time_seconds: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          chapter_id?: string | null
          correct_count?: number
          ended_at?: string | null
          id?: string
          session_type: string
          started_at?: string
          subject_id?: string | null
          topic_id?: string | null
          total_questions?: number
          total_time_seconds?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          chapter_id?: string | null
          correct_count?: number
          ended_at?: string | null
          id?: string
          session_type?: string
          started_at?: string
          subject_id?: string | null
          topic_id?: string | null
          total_questions?: number
          total_time_seconds?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: Json
          created_at: string
          created_by: string | null
          difficulty: number
          embedding: string | null
          estimated_time_seconds: number
          id: string
          options: Json | null
          question_image_url: string | null
          question_text: string
          question_type: string
          source: string | null
          status: string
          topic_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          correct_answer: Json
          created_at?: string
          created_by?: string | null
          difficulty: number
          embedding?: string | null
          estimated_time_seconds?: number
          id?: string
          options?: Json | null
          question_image_url?: string | null
          question_text: string
          question_type: string
          source?: string | null
          status?: string
          topic_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          correct_answer?: Json
          created_at?: string
          created_by?: string | null
          difficulty?: number
          embedding?: string | null
          estimated_time_seconds?: number
          id?: string
          options?: Json | null
          question_image_url?: string | null
          question_text?: string
          question_type?: string
          source?: string | null
          status?: string
          topic_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          consecutive_correct: number
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          consecutive_correct?: number
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          consecutive_correct?: number
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          ai_model: string | null
          ai_prompt_version: string | null
          content: string
          created_at: string
          created_by: string | null
          difficulty_to_execute: number | null
          downvotes: number
          id: string
          prerequisites: string | null
          question_id: string
          solution_image_url: string | null
          solution_type: string
          source: string | null
          status: string
          steps: Json | null
          time_estimate_seconds: number | null
          title: string | null
          upvotes: number
          verified_by: string | null
          when_not_to_use: string | null
          when_to_use: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_prompt_version?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          difficulty_to_execute?: number | null
          downvotes?: number
          id?: string
          prerequisites?: string | null
          question_id: string
          solution_image_url?: string | null
          solution_type: string
          source?: string | null
          status?: string
          steps?: Json | null
          time_estimate_seconds?: number | null
          title?: string | null
          upvotes?: number
          verified_by?: string | null
          when_not_to_use?: string | null
          when_to_use?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_prompt_version?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          difficulty_to_execute?: number | null
          downvotes?: number
          id?: string
          prerequisites?: string | null
          question_id?: string
          solution_image_url?: string | null
          solution_type?: string
          source?: string | null
          status?: string
          steps?: Json | null
          time_estimate_seconds?: number | null
          title?: string | null
          upvotes?: number
          verified_by?: string | null
          when_not_to_use?: string | null
          when_to_use?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solutions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          display_order: number
          exam: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          display_order?: number
          exam: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          display_order?: number
          exam?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          chapter_id: string
          display_order: number
          id: string
          name: string
          slug: string
        }
        Insert: {
          chapter_id: string
          display_order?: number
          id?: string
          name: string
          slug: string
        }
        Update: {
          chapter_id?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_daily_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          class_level: string | null
          created_at: string
          current_streak: number
          email: string
          full_name: string | null
          id: string
          last_active_date: string | null
          longest_streak: number
          onboarded_at: string | null
          phone: string | null
          role: string
          school: string | null
          state: string | null
          target_exam: string
          target_year: number | null
          xp_total: number
        }
        Insert: {
          class_level?: string | null
          created_at?: string
          current_streak?: number
          email: string
          full_name?: string | null
          id: string
          last_active_date?: string | null
          longest_streak?: number
          onboarded_at?: string | null
          phone?: string | null
          role?: string
          school?: string | null
          state?: string | null
          target_exam?: string
          target_year?: number | null
          xp_total?: number
        }
        Update: {
          class_level?: string | null
          created_at?: string
          current_streak?: number
          email?: string
          full_name?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          onboarded_at?: string | null
          phone?: string | null
          role?: string
          school?: string | null
          state?: string | null
          target_exam?: string
          target_year?: number | null
          xp_total?: number
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
