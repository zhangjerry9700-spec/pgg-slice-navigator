/**
 * Supabase 数据库类型定义
 * 基于 schema.sql 生成
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          anonymous_id: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          role: string | null;
        };
        Insert: {
          id: string;
          anonymous_id?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: string | null;
        };
        Update: {
          id?: string;
          anonymous_id?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          role?: string | null;
        };
      };
      user_answers: {
        Row: {
          id: number;
          user_id: string;
          question_id: number;
          selected_option: number | null;
          is_correct: boolean | null;
          time_spent_seconds: number;
          answered_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          question_id: number;
          selected_option?: number | null;
          is_correct?: boolean | null;
          time_spent_seconds?: number;
          answered_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          question_id?: number;
          selected_option?: number | null;
          is_correct?: boolean | null;
          time_spent_seconds?: number;
          answered_at?: string;
        };
      };
      user_mastery: {
        Row: {
          id: number;
          user_id: string;
          grammar_topic: string;
          mastery_level: number;
          total_answered: number;
          correct_count: number;
          last_updated: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          grammar_topic: string;
          mastery_level?: number;
          total_answered?: number;
          correct_count?: number;
          last_updated?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          grammar_topic?: string;
          mastery_level?: number;
          total_answered?: number;
          correct_count?: number;
          last_updated?: string;
        };
      };
      user_mistakes: {
        Row: {
          id: number;
          user_id: string;
          question_id: number;
          mistake_count: number;
          last_mistake_at: string;
          is_mastered: boolean;
          mastered_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          question_id: number;
          mistake_count?: number;
          last_mistake_at?: string;
          is_mastered?: boolean;
          mastered_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          question_id?: number;
          mistake_count?: number;
          last_mistake_at?: string;
          is_mastered?: boolean;
          mastered_at?: string | null;
        };
      };
      learning_history: {
        Row: {
          id: number;
          user_id: string;
          date: string;
          questions_answered: number;
          correct_count: number;
          streak_days: number;
        };
        Insert: {
          id?: number;
          user_id: string;
          date?: string;
          questions_answered?: number;
          correct_count?: number;
          streak_days?: number;
        };
        Update: {
          id?: number;
          user_id?: string;
          date?: string;
          questions_answered?: number;
          correct_count?: number;
          streak_days?: number;
        };
      };
      content_reviews: {
        Row: {
          id: number;
          question_id: number;
          reviewer_id: string | null;
          status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          question_id: number;
          reviewer_id?: string | null;
          status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          question_id?: number;
          reviewer_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'needs_revision';
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pending_questions: {
        Row: {
          id: number;
          submitter_id: string;
          status: 'pending' | 'approved' | 'rejected';
          type: 'choice' | 'fill_blank' | 'matching';
          content: string;
          options: Json | null;
          correctAnswer: string;
          explanation: string | null;
          tags: Json | null;
          source: string | null;
          review_note: string | null;
          reviewer_id: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          submitter_id: string;
          status?: 'pending' | 'approved' | 'rejected';
          type: 'choice' | 'fill_blank' | 'matching';
          content: string;
          options?: Json | null;
          correctAnswer: string;
          explanation?: string | null;
          tags?: Json | null;
          source?: string | null;
          review_note?: string | null;
          reviewer_id?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          submitter_id?: string;
          status?: 'pending' | 'approved' | 'rejected';
          type?: 'choice' | 'fill_blank' | 'matching';
          content?: string;
          options?: Json | null;
          correctAnswer?: string;
          explanation?: string | null;
          tags?: Json | null;
          source?: string | null;
          review_note?: string | null;
          reviewer_id?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: number;
          user_id: string | null;
          action: 'create' | 'update' | 'delete';
          table_name: string;
          record_id: string;
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          action: 'create' | 'update' | 'delete';
          table_name: string;
          record_id: string;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          action?: 'create' | 'update' | 'delete';
          table_name?: string;
          record_id?: string;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: {
      user_learning_stats: {
        Row: {
          user_id: string;
          email: string;
          display_name: string | null;
          anonymous_id: string | null;
          total_answered: number;
          correct_count: number;
          mistakes_count: number;
          current_streak: number;
          last_active: string | null;
        };
      };
    };
    Functions: {
      // 如果有自定义函数，在这里添加
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      [_: string]: unknown;
    };
  };
}
