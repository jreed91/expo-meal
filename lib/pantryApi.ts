import { supabase } from './supabase';
import { Database } from '@/types/database.types';

type PantryItem = Database['public']['Tables']['pantry_items']['Row'];
type PantryItemInsert = Omit<Database['public']['Tables']['pantry_items']['Insert'], 'user_id'>;
type PantryItemUpdate = Database['public']['Tables']['pantry_items']['Update'];

export const fetchPantryItems = async (): Promise<PantryItem[]> => {
  const { data, error } = await supabase.functions.invoke('pantry', {
    method: 'GET',
  });

  if (error) {
    console.error('Error fetching pantry items:', error);
    throw new Error(error.message || 'Failed to fetch pantry items');
  }

  return data.items || [];
};

export const addPantryItem = async (item: PantryItemInsert): Promise<PantryItem> => {
  const { data, error } = await supabase.functions.invoke('pantry', {
    method: 'POST',
    body: item,
  });

  if (error) {
    console.error('Error adding pantry item:', error);
    throw new Error(error.message || 'Failed to add pantry item');
  }

  return data.item;
};

export const updatePantryItem = async (
  id: string,
  updates: PantryItemUpdate
): Promise<PantryItem> => {
  const { data, error } = await supabase.functions.invoke('pantry', {
    method: 'PUT',
    body: { id, ...updates },
  });

  if (error) {
    console.error('Error updating pantry item:', error);
    throw new Error(error.message || 'Failed to update pantry item');
  }

  return data.item;
};

export const deletePantryItem = async (id: string): Promise<void> => {
  const { error } = await supabase.functions.invoke('pantry', {
    method: 'DELETE',
    body: { id },
  });

  if (error) {
    console.error('Error deleting pantry item:', error);
    throw new Error(error.message || 'Failed to delete pantry item');
  }
};
