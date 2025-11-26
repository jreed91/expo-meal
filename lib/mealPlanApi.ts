import { supabase } from './supabase';
import { Database } from '@/types/database.types';

type MealPlan = Database['public']['Tables']['meal_plans']['Row'];
type MealPlanInsert = Omit<Database['public']['Tables']['meal_plans']['Insert'], 'user_id'>;
type MealPlanUpdate = Database['public']['Tables']['meal_plans']['Update'];

export const fetchMealPlans = async (startDate: Date, endDate: Date): Promise<MealPlan[]> => {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase.functions.invoke('meal-plans', {
    method: 'GET',
    body: null,
  });

  if (error) {
    console.error('Error fetching meal plans:', error);
    throw new Error(error.message || 'Failed to fetch meal plans');
  }

  // Filter client-side for now (or we could pass query params)
  const allPlans = data.mealPlans || [];
  return allPlans.filter((plan: MealPlan) => {
    return plan.date >= startDateStr && plan.date <= endDateStr;
  });
};

export const addMealPlan = async (mealPlan: MealPlanInsert): Promise<MealPlan> => {
  const { data, error } = await supabase.functions.invoke('meal-plans', {
    method: 'POST',
    body: mealPlan,
  });

  if (error) {
    console.error('Error adding meal plan:', error);
    throw new Error(error.message || 'Failed to add meal plan');
  }

  return data.mealPlan;
};

export const updateMealPlan = async (id: string, updates: MealPlanUpdate): Promise<MealPlan> => {
  const { data, error } = await supabase.functions.invoke('meal-plans', {
    method: 'PUT',
    body: { id, ...updates },
  });

  if (error) {
    console.error('Error updating meal plan:', error);
    throw new Error(error.message || 'Failed to update meal plan');
  }

  return data.mealPlan;
};

export const deleteMealPlan = async (id: string): Promise<void> => {
  const { error } = await supabase.functions.invoke('meal-plans', {
    method: 'DELETE',
    body: { id },
  });

  if (error) {
    console.error('Error deleting meal plan:', error);
    throw new Error(error.message || 'Failed to delete meal plan');
  }
};
