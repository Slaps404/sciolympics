export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PracticeType = "quiz" | "hybrid" | "build";
export type Division = "B" | "C";
export type ResourceType =
  | "video"
  | "article"
  | "textbook"
  | "interactive"
  | "game"
  | "quiz"
  | "practice_test"
  | "lesson_collection"
  | "archive"
  | "other";

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          name: string;
          slug: string;
          practice_type: PracticeType;
          season_year: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          practice_type: PracticeType;
          season_year: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          practice_type?: PracticeType;
          season_year?: number;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          division: Division;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          division: Division;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          division?: Division;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      event_topics: {
        Row: {
          id: string;
          event_id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          slug: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      resource_candidates: {
        Row: {
          id: string;
          url: string;
          event_id: string;
          topic_id: string | null;
          title: string;
          ai_description: string | null;
          relevance_score: number | null;
          trust_score: number | null;
          resource_type: string | null;
          review_relevance_score: number | null;
          review_trust_score: number | null;
          review_notes: string | null;
          reviewed_at: string | null;
          status: "pending" | "approved" | "rejected";
          found_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          event_id: string;
          topic_id?: string | null;
          title: string;
          ai_description?: string | null;
          relevance_score?: number | null;
          trust_score?: number | null;
          resource_type?: string | null;
          review_relevance_score?: number | null;
          review_trust_score?: number | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          status?: "pending" | "approved" | "rejected";
          found_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          event_id?: string;
          topic_id?: string | null;
          title?: string;
          ai_description?: string | null;
          relevance_score?: number | null;
          trust_score?: number | null;
          resource_type?: string | null;
          review_relevance_score?: number | null;
          review_trust_score?: number | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          status?: "pending" | "approved" | "rejected";
          found_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          event_id: string;
          topic_id: string | null;
          resource_type: ResourceType | null;
          title: string;
          url: string;
          description: string | null;
          submitted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          topic_id?: string | null;
          resource_type?: ResourceType | null;
          title: string;
          url: string;
          description?: string | null;
          submitted_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          topic_id?: string | null;
          resource_type?: ResourceType | null;
          title?: string;
          url?: string;
          description?: string | null;
          submitted_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      practice_type: PracticeType;
      division: Division;
    };
    CompositeTypes: Record<string, never>;
  };
}
