import { create } from 'zustand';
import { Database } from '@/types/database.types';
import * as mealPlanApi from '@/lib/mealPlanApi';

type MealPlan = Database['public']['Tables']['meal_plans']['Row'];
type MealPlanInsert = Omit<Database['public']['Tables']['meal_plans']['Insert'], 'user_id'>;
type MealPlanUpdate = Database['public']['Tables']['meal_plans']['Update'];

interface MealPlanState {
  mealPlans: MealPlan[];
  loading: boolean;
  selectedWeekStart: Date;
  fetchMealPlans: (startDate: Date, endDate: Date) => Promise<void>;
  addMealPlan: (mealPlan: MealPlanInsert) => Promise<MealPlan>;
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
      const mealPlans = await mealPlanApi.fetchMealPlans(startDate, endDate);
      set({ mealPlans });
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      set({ loading: false });
    }
  },

  addMealPlan: async (mealPlan) => {
    try {
      const newMealPlan = await mealPlanApi.addMealPlan(mealPlan);
      set((state) => ({
        mealPlans: [...state.mealPlans, newMealPlan],
      }));
      return newMealPlan;
    } catch (error) {
      console.error('Error adding meal plan:', error);
      throw error;
    }
  },

  updateMealPlan: async (id, updates) => {
    try {
      const updatedMealPlan = await mealPlanApi.updateMealPlan(id, updates);
      set((state) => ({
        mealPlans: state.mealPlans.map((m) =>
          m.id === id ? updatedMealPlan : m
        ),
      }));
    } catch (error) {
      console.error('Error updating meal plan:', error);
      throw error;
    }
  },

  deleteMealPlan: async (id) => {
    try {
      await mealPlanApi.deleteMealPlan(id);
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
