export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PracticeType = "quiz" | "hybrid" | "build";
export type Division = "B" | "C";

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
          created_at: string;
        };
        Insert: {
          id: string;
          division: Division;
          created_at?: string;
        };
        Update: {
          id?: string;
          division?: Division;
          created_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          url: string;
          description: string | null;
          submitted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          url: string;
          description?: string | null;
          submitted_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
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
