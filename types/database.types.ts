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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          allergies: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          allergies?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          allergies?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          ingredients: Json;
          instructions: string;
          servings: number | null;
          prep_time: number | null;
          cook_time: number | null;
          image_url: string | null;
          tags: string[];
          is_favorite: boolean;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          ingredients: Json;
          instructions: string;
          servings?: number | null;
          prep_time?: number | null;
          cook_time?: number | null;
          image_url?: string | null;
          tags?: string[];
          is_favorite?: boolean;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          ingredients?: Json;
          instructions?: string;
          servings?: number | null;
          prep_time?: number | null;
          cook_time?: number | null;
          image_url?: string | null;
          tags?: string[];
          is_favorite?: boolean;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string | null;
          meal_name: string | null;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id?: string | null;
          meal_name?: string | null;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string | null;
          meal_name?: string | null;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pantry_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          quantity: number;
          unit: string;
          category: string | null;
          expiry_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          quantity: number;
          unit: string;
          category?: string | null;
          expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          category?: string | null;
          expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      grocery_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      grocery_list_items: {
        Row: {
          id: string;
          grocery_list_id: string;
          name: string;
          quantity: number;
          unit: string;
          category: string | null;
          is_checked: boolean;
          recipe_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grocery_list_id: string;
          name: string;
          quantity: number;
          unit: string;
          category?: string | null;
          is_checked?: boolean;
          recipe_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          grocery_list_id?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          category?: string | null;
          is_checked?: boolean;
          recipe_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          messages: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for recipe ingredients
export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

// Helper types for chat messages
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    input: any;
    result?: string;
  }>;
}
