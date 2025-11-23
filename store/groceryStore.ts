import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Database, RecipeIngredient } from '@/types/database.types';

type GroceryList = Database['public']['Tables']['grocery_lists']['Row'];
type GroceryListItem = Database['public']['Tables']['grocery_list_items']['Row'];
type GroceryListInsert = Database['public']['Tables']['grocery_lists']['Insert'];
type GroceryListItemInsert =
  Database['public']['Tables']['grocery_list_items']['Insert'];

interface GroceryState {
  groceryLists: GroceryList[];
  groceryListItems: Record<string, GroceryListItem[]>;
  loading: boolean;
  fetchGroceryLists: () => Promise<void>;
  fetchGroceryListItems: (listId: string) => Promise<void>;
  createGroceryList: (
    name: string,
    startDate?: Date,
    endDate?: Date
  ) => Promise<GroceryList>;
  deleteGroceryList: (id: string) => Promise<void>;
  addItemToList: (
    listId: string,
    item: Omit<GroceryListItemInsert, 'grocery_list_id'>
  ) => Promise<void>;
  toggleItemChecked: (listId: string, itemId: string) => Promise<void>;
  deleteItem: (listId: string, itemId: string) => Promise<void>;
  generateFromMealPlan: (
    listName: string,
    startDate: Date,
    endDate: Date
  ) => Promise<GroceryList>;
}

// Helper function to combine similar ingredients
const combineIngredients = (
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    recipe_id?: string;
  }>
): Array<{
  name: string;
  quantity: number;
  unit: string;
  recipe_id?: string;
}> => {
  const combined: Record<
    string,
    { name: string; quantity: number; unit: string; recipe_id?: string }
  > = {};

  ingredients.forEach((ing) => {
    const key = `${ing.name.toLowerCase()}-${ing.unit.toLowerCase()}`;

    if (combined[key]) {
      combined[key].quantity += ing.quantity;
    } else {
      combined[key] = { ...ing };
    }
  });

  return Object.values(combined);
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const useGroceryStore = create<GroceryState>((set, get) => ({
  groceryLists: [],
  groceryListItems: {},
  loading: false,

  fetchGroceryLists: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('grocery_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ groceryLists: data || [] });
    } catch (error) {
      console.error('Error fetching grocery lists:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchGroceryListItems: async (listId) => {
    try {
      const { data, error } = await supabase
        .from('grocery_list_items')
        .select('*')
        .eq('grocery_list_id', listId)
        .order('category', { ascending: true });

      if (error) throw error;

      set((state) => ({
        groceryListItems: {
          ...state.groceryListItems,
          [listId]: data || [],
        },
      }));
    } catch (error) {
      console.error('Error fetching grocery list items:', error);
    }
  },

  createGroceryList: async (name) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('grocery_lists')
        .insert([{ name, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        groceryLists: [data, ...state.groceryLists],
      }));

      return data;
    } catch (error) {
      console.error('Error creating grocery list:', error);
      throw error;
    }
  },

  deleteGroceryList: async (id) => {
    try {
      const { error } = await supabase
        .from('grocery_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        groceryLists: state.groceryLists.filter((l) => l.id !== id),
        groceryListItems: Object.fromEntries(
          Object.entries(state.groceryListItems).filter(
            ([key]) => key !== id
          )
        ),
      }));
    } catch (error) {
      console.error('Error deleting grocery list:', error);
      throw error;
    }
  },

  addItemToList: async (listId, item) => {
    try {
      const { data, error } = await supabase
        .from('grocery_list_items')
        .insert([{ ...item, grocery_list_id: listId }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        groceryListItems: {
          ...state.groceryListItems,
          [listId]: [...(state.groceryListItems[listId] || []), data],
        },
      }));
    } catch (error) {
      console.error('Error adding item to list:', error);
      throw error;
    }
  },

  toggleItemChecked: async (listId, itemId) => {
    try {
      const items = get().groceryListItems[listId] || [];
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const { error } = await supabase
        .from('grocery_list_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', itemId);

      if (error) throw error;

      set((state) => ({
        groceryListItems: {
          ...state.groceryListItems,
          [listId]: items.map((i) =>
            i.id === itemId ? { ...i, is_checked: !i.is_checked } : i
          ),
        },
      }));
    } catch (error) {
      console.error('Error toggling item:', error);
      throw error;
    }
  },

  deleteItem: async (listId, itemId) => {
    try {
      const { error } = await supabase
        .from('grocery_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      set((state) => ({
        groceryListItems: {
          ...state.groceryListItems,
          [listId]: (state.groceryListItems[listId] || []).filter(
            (i) => i.id !== itemId
          ),
        },
      }));
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  generateFromMealPlan: async (listName, startDate, endDate) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch meal plans for the date range
      const { data: mealPlans, error: mealError } = await supabase
        .from('meal_plans')
        .select('*, recipes(*)')
        .gte('date', formatDate(startDate))
        .lte('date', formatDate(endDate));

      if (mealError) throw mealError;

      // Collect all ingredients
      const allIngredients: Array<{
        name: string;
        quantity: number;
        unit: string;
        recipe_id?: string;
      }> = [];

      mealPlans?.forEach((mealPlan: any) => {
        if (mealPlan.recipes && mealPlan.recipes.ingredients) {
          const ingredients = mealPlan.recipes.ingredients as RecipeIngredient[];
          ingredients.forEach((ing) => {
            allIngredients.push({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              recipe_id: mealPlan.recipe_id,
            });
          });
        }
      });

      // Combine duplicate ingredients
      const combined = combineIngredients(allIngredients);

      // Create the grocery list
      const list = await get().createGroceryList(listName);

      // Add items to the list
      for (const item of combined) {
        await get().addItemToList(list.id, {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          recipe_id: item.recipe_id || null,
          category: null,
          is_checked: false,
        });
      }

      return list;
    } catch (error) {
      console.error('Error generating grocery list from meal plan:', error);
      throw error;
    }
  },
}));
