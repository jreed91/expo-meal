import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type PantryItem = Database['public']['Tables']['pantry_items']['Row'];
type PantryItemInsert = Database['public']['Tables']['pantry_items']['Insert'];
type PantryItemUpdate = Database['public']['Tables']['pantry_items']['Update'];

interface PantryState {
  pantryItems: PantryItem[];
  loading: boolean;
  fetchPantryItems: () => Promise<void>;
  addPantryItem: (
    item: Omit<PantryItemInsert, 'user_id'>
  ) => Promise<PantryItem>;
  updatePantryItem: (id: string, item: PantryItemUpdate) => Promise<void>;
  deletePantryItem: (id: string) => Promise<void>;
  getExpiringItems: (days: number) => PantryItem[];
}

export const usePantryStore = create<PantryState>((set, get) => ({
  pantryItems: [],
  loading: false,

  fetchPantryItems: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .order('expiry_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      set({ pantryItems: data || [] });
    } catch (error) {
      console.error('Error fetching pantry items:', error);
    } finally {
      set({ loading: false });
    }
  },

  addPantryItem: async (item) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pantry_items')
        .insert([{ ...item, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        pantryItems: [...state.pantryItems, data],
      }));

      return data;
    } catch (error) {
      console.error('Error adding pantry item:', error);
      throw error;
    }
  },

  updatePantryItem: async (id, item) => {
    try {
      const { error } = await supabase
        .from('pantry_items')
        .update(item)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        pantryItems: state.pantryItems.map((i) =>
          i.id === id ? { ...i, ...item } : i
        ),
      }));
    } catch (error) {
      console.error('Error updating pantry item:', error);
      throw error;
    }
  },

  deletePantryItem: async (id) => {
    try {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        pantryItems: state.pantryItems.filter((i) => i.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting pantry item:', error);
      throw error;
    }
  },

  getExpiringItems: (days) => {
    const { pantryItems } = get();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return pantryItems.filter((item) => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      return expiryDate >= today && expiryDate <= futureDate;
    });
  },
}));
