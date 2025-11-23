import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Database, RecipeIngredient } from '@/types/database.types';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  searchQuery: string;
  favoriteFilter: boolean;
  fetchRecipes: () => Promise<void>;
  addRecipe: (recipe: Omit<RecipeInsert, 'user_id'>) => Promise<Recipe>;
  updateRecipe: (id: string, recipe: RecipeUpdate) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFavoriteFilter: (enabled: boolean) => void;
  getFilteredRecipes: () => Recipe[];
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  loading: false,
  searchQuery: '',
  favoriteFilter: false,

  fetchRecipes: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ recipes: data || [] });
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      set({ loading: false });
    }
  },

  addRecipe: async (recipe) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('recipes')
        .insert([{ ...recipe, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        recipes: [data, ...state.recipes],
      }));

      return data;
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  },

  updateRecipe: async (id, recipe) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update(recipe)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === id ? { ...r, ...recipe } : r
        ),
      }));
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  },

  deleteRecipe: async (id) => {
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  },

  toggleFavorite: async (id) => {
    try {
      const recipe = get().recipes.find((r) => r.id === id);
      if (!recipe) return;

      await get().updateRecipe(id, { is_favorite: !recipe.is_favorite });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFavoriteFilter: (enabled) => set({ favoriteFilter: enabled }),

  getFilteredRecipes: () => {
    const { recipes, searchQuery, favoriteFilter } = get();
    let filtered = recipes;

    if (favoriteFilter) {
      filtered = filtered.filter((r) => r.is_favorite);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  },
}));
