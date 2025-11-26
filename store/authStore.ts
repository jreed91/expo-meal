import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import * as profileApi from '@/lib/profileApi';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({ session, user: session?.user ?? null, initialized: true });

      if (session?.user) {
        await get().fetchProfile();
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({ profile: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ initialized: true });
    }
  },

  fetchProfile: async () => {
    try {
      const { user } = get();
      if (!user) return;

      const profile = await profileApi.fetchProfile();
      set({ profile });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({ session: data.session, user: data.user });
      await get().fetchProfile();
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      set({ session: data.session, user: data.user });
      await get().fetchProfile();
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, user: null, profile: null });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
