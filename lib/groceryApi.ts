import { supabase } from './supabase';
import { Database } from '@/types/database.types';

type GroceryList = Database['public']['Tables']['grocery_lists']['Row'];
type GroceryListInsert = Omit<Database['public']['Tables']['grocery_lists']['Insert'], 'user_id'>;
type GroceryListUpdate = Database['public']['Tables']['grocery_lists']['Update'];

type GroceryListItem = Database['public']['Tables']['grocery_list_items']['Row'];
type GroceryListItemInsert = Database['public']['Tables']['grocery_list_items']['Insert'];
type GroceryListItemUpdate = Database['public']['Tables']['grocery_list_items']['Update'];

// Grocery Lists
export const fetchGroceryLists = async (): Promise<GroceryList[]> => {
  const { data, error } = await supabase.functions.invoke('grocery-lists', {
    method: 'GET',
  });

  if (error) {
    console.error('Error fetching grocery lists:', error);
    throw new Error(error.message || 'Failed to fetch grocery lists');
  }

  return data.lists || [];
};

export const createGroceryList = async (list: GroceryListInsert): Promise<GroceryList> => {
  const { data, error } = await supabase.functions.invoke('grocery-lists', {
    method: 'POST',
    body: list,
  });

  if (error) {
    console.error('Error creating grocery list:', error);
    throw new Error(error.message || 'Failed to create grocery list');
  }

  return data.list;
};

export const updateGroceryList = async (id: string, updates: GroceryListUpdate): Promise<GroceryList> => {
  const { data, error } = await supabase.functions.invoke('grocery-lists', {
    method: 'PUT',
    body: { id, ...updates },
  });

  if (error) {
    console.error('Error updating grocery list:', error);
    throw new Error(error.message || 'Failed to update grocery list');
  }

  return data.list;
};

export const deleteGroceryList = async (id: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('grocery-lists', {
    method: 'DELETE',
    body: { id },
  });

  if (error) {
    console.error('Error deleting grocery list:', error);
    throw new Error(error.message || 'Failed to delete grocery list');
  }
};

// Grocery List Items
export const fetchGroceryListItems = async (listId: string): Promise<GroceryListItem[]> => {
  const { data, error } = await supabase.functions.invoke('grocery-lists', {
    method: 'GET',
    body: null,
  });

  if (error) {
    console.error('Error fetching grocery list items:', error);
    throw new Error(error.message || 'Failed to fetch grocery list items');
  }

  // The function will filter by listId via query params
  // For now, we'll use a different approach
  const url = new URL(`${supabase.supabaseUrl}/functions/v1/grocery-lists`);
  url.searchParams.set('action', 'items');
  url.searchParams.set('listId', listId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch grocery list items');
  }

  const result = await response.json();
  return result.items || [];
};

export const addGroceryListItem = async (item: GroceryListItemInsert): Promise<GroceryListItem> => {
  const url = new URL(`${supabase.supabaseUrl}/functions/v1/grocery-lists`);
  url.searchParams.set('action', 'items');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    throw new Error('Failed to add grocery list item');
  }

  const result = await response.json();
  return result.item;
};

export const updateGroceryListItem = async (id: string, updates: GroceryListItemUpdate): Promise<GroceryListItem> => {
  const url = new URL(`${supabase.supabaseUrl}/functions/v1/grocery-lists`);
  url.searchParams.set('action', 'items');

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...updates }),
  });

  if (!response.ok) {
    throw new Error('Failed to update grocery list item');
  }

  const result = await response.json();
  return result.item;
};

export const deleteGroceryListItem = async (id: string): Promise<void> => {
  const url = new URL(`${supabase.supabaseUrl}/functions/v1/grocery-lists`);
  url.searchParams.set('action', 'items');

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete grocery list item');
  }
};
