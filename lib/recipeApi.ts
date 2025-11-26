import { supabase } from './supabase';
import { Database } from '@/types/database.types';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Omit<Database['public']['Tables']['recipes']['Insert'], 'user_id'>;
type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

export const fetchRecipes = async (): Promise<Recipe[]> => {
  const { data, error } = await supabase.functions.invoke('recipes', {
    method: 'GET',
  });

  if (error) {
    console.error('Error fetching recipes:', error);
    throw new Error(error.message || 'Failed to fetch recipes');
  }

  return data.recipes || [];
};

export const addRecipe = async (recipe: RecipeInsert): Promise<Recipe> => {
  const { data, error } = await supabase.functions.invoke('recipes', {
    method: 'POST',
    body: recipe,
  });

  if (error) {
    console.error('Error adding recipe:', error);
    throw new Error(error.message || 'Failed to add recipe');
  }

  return data.recipe;
};

export const updateRecipe = async (id: string, updates: RecipeUpdate): Promise<Recipe> => {
  const { data, error } = await supabase.functions.invoke('recipes', {
    method: 'PUT',
    body: { id, ...updates },
  });

  if (error) {
    console.error('Error updating recipe:', error);
    throw new Error(error.message || 'Failed to update recipe');
  }

  return data.recipe;
};

export const deleteRecipe = async (id: string): Promise<void> => {
  const { error } = await supabase.functions.invoke('recipes', {
    method: 'DELETE',
    body: { id },
  });

  if (error) {
    console.error('Error deleting recipe:', error);
    throw new Error(error.message || 'Failed to delete recipe');
  }
};
