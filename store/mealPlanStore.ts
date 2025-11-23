import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type MealPlan = Database['public']['Tables']['meal_plans']['Row'];
type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];
type MealPlanUpdate = Database['public']['Tables']['meal_plans']['Update'];

interface MealPlanState {
  mealPlans: MealPlan[];
  loading: boolean;
  selectedWeekStart: Date;
  fetchMealPlans: (startDate: Date, endDate: Date) => Promise<void>;
  addMealPlan: (
    mealPlan: Omit<MealPlanInsert, 'user_id'>
  ) => Promise<MealPlan>;
  updateMealPlan: (id: string, mealPlan: MealPlanUpdate) => Promise<void>;
  deleteMealPlan: (id: string) => Promise<void>;
  setSelectedWeekStart: (date: Date) => void;
  getWeekDates: () => Date[];
  getMealsForDate: (date: Date) => MealPlan[];
}

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  mealPlans: [],
  loading: false,
  selectedWeekStart: getStartOfWeek(new Date()),

  fetchMealPlans: async (startDate, endDate) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .gte('date', formatDate(startDate))
        .lte('date', formatDate(endDate))
        .order('date', { ascending: true });

      if (error) throw error;
      set({ mealPlans: data || [] });
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      set({ loading: false });
    }
  },

  addMealPlan: async (mealPlan) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meal_plans')
        .insert([{ ...mealPlan, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        mealPlans: [...state.mealPlans, data],
      }));

      return data;
    } catch (error) {
      console.error('Error adding meal plan:', error);
      throw error;
    }
  },

  updateMealPlan: async (id, mealPlan) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .update(mealPlan)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        mealPlans: state.mealPlans.map((m) =>
          m.id === id ? { ...m, ...mealPlan } : m
        ),
      }));
    } catch (error) {
      console.error('Error updating meal plan:', error);
      throw error;
    }
  },

  deleteMealPlan: async (id) => {
    try {
      const { error } = await supabase.from('meal_plans').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        mealPlans: state.mealPlans.filter((m) => m.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      throw error;
    }
  },

  setSelectedWeekStart: (date) => {
    const weekStart = getStartOfWeek(date);
    set({ selectedWeekStart: weekStart });
  },

  getWeekDates: () => {
    const { selectedWeekStart } = get();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedWeekStart);
      date.setDate(selectedWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  },

  getMealsForDate: (date) => {
    const { mealPlans } = get();
    const dateStr = formatDate(date);
    return mealPlans.filter((m) => m.date === dateStr);
  },
}));
