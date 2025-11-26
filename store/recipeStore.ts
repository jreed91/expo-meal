import { create } from 'zustand';
import { Database } from '@/types/database.types';
import * as recipeApi from '@/lib/recipeApi';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Omit<Database['public']['Tables']['recipes']['Insert'], 'user_id'>;
type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  searchQuery: string;
  favoriteFilter: boolean;
  fetchRecipes: () => Promise<void>;
  addRecipe: (recipe: RecipeInsert) => Promise<Recipe>;
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
      const recipes = await recipeApi.fetchRecipes();
      set({ recipes });
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      set({ loading: false });
    }
  },

  addRecipe: async (recipe) => {
    try {
      const newRecipe = await recipeApi.addRecipe(recipe);
      set((state) => ({
        recipes: [newRecipe, ...state.recipes],
      }));
      return newRecipe;
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  },

  updateRecipe: async (id, updates) => {
    try {
      const updatedRecipe = await recipeApi.updateRecipe(id, updates);
      set((state) => ({
        recipes: state.recipes.map((r) => (r.id === id ? updatedRecipe : r)),
      }));
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  },

  deleteRecipe: async (id) => {
    try {
      await recipeApi.deleteRecipe(id);
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
