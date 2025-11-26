import { supabase } from './supabase';
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const fetchProfile = async (): Promise<Profile> => {
  const { data, error } = await supabase.functions.invoke('profiles', {
    method: 'GET',
  });

  if (error) {
    console.error('Error fetching profile:', error);
    throw new Error(error.message || 'Failed to fetch profile');
  }

  return data.profile;
};

export const updateProfile = async (updates: { full_name?: string; allergies?: string[] }): Promise<Profile> => {
  const { data, error } = await supabase.functions.invoke('profiles', {
    method: 'PUT',
    body: updates,
  });

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }

  return data.profile;
};
