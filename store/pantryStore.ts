import { create } from 'zustand';
import { Database } from '@/types/database.types';
import * as pantryApi from '@/lib/pantryApi';

type PantryItem = Database['public']['Tables']['pantry_items']['Row'];
type PantryItemInsert = Omit<Database['public']['Tables']['pantry_items']['Insert'], 'user_id'>;
type PantryItemUpdate = Database['public']['Tables']['pantry_items']['Update'];

interface PantryState {
  pantryItems: PantryItem[];
  loading: boolean;
  fetchPantryItems: () => Promise<void>;
  addPantryItem: (item: PantryItemInsert) => Promise<PantryItem>;
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
      const items = await pantryApi.fetchPantryItems();
      set({ pantryItems: items });
    } catch (error) {
      console.error('Error fetching pantry items:', error);
    } finally {
      set({ loading: false });
    }
  },

  addPantryItem: async (item) => {
    try {
      const newItem = await pantryApi.addPantryItem(item);
      set((state) => ({
        pantryItems: [...state.pantryItems, newItem],
      }));
      return newItem;
    } catch (error) {
      console.error('Error adding pantry item:', error);
      throw error;
    }
  },

  updatePantryItem: async (id, updates) => {
    try {
      const updatedItem = await pantryApi.updatePantryItem(id, updates);
      set((state) => ({
        pantryItems: state.pantryItems.map((i) => (i.id === id ? updatedItem : i)),
      }));
    } catch (error) {
      console.error('Error updating pantry item:', error);
      throw error;
    }
  },

  deletePantryItem: async (id) => {
    try {
      await pantryApi.deletePantryItem(id);
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
