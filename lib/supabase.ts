import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {});

export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          email?: string | null;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          amount: number;
          paid_by: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          amount: number;
          paid_by: string;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string;
          amount?: number;
          paid_by?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          participant_id: string;
          amount: number;
        };
        Insert: {
          id?: string;
          expense_id: string;
          participant_id: string;
          amount: number;
        };
        Update: {
          id?: string;
          expense_id?: string;
          participant_id?: string;
          amount?: number;
        };
      };
      settlements: {
        Row: {
          id: string;
          group_id: string;
          from_participant: string;
          to_participant: string;
          amount: number;
          note: string | null;
          settled_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          from_participant: string;
          to_participant: string;
          amount: number;
          note?: string | null;
          settled_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          from_participant?: string;
          to_participant?: string;
          amount?: number;
          note?: string | null;
          settled_at?: string;
        };
      };
    };
  };
};
