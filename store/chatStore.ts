import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    id: string;
    name: string;
    input: any;
    result?: string;
  }>;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  currentConversationId: string | null;
  loadMessages: () => Promise<void>;
  addMessage: (message: ChatMessage) => Promise<void>;
  clearMessages: () => Promise<void>;
  saveConversation: () => Promise<void>;
}

const STORAGE_KEY = 'chat_messages';
const CONVERSATION_ID_KEY = 'current_conversation_id';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  currentConversationId: null,

  loadMessages: async () => {
    try {
      set({ loading: true });

      // Try to load from AsyncStorage first (faster)
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const conversationId = await AsyncStorage.getItem(CONVERSATION_ID_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const messages = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        set({ messages, currentConversationId: conversationId });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      set({ loading: false });
    }
  },

  addMessage: async (message: ChatMessage) => {
    const { messages } = get();
    const newMessages = [...messages, message];

    set({ messages: newMessages });

    // Save to AsyncStorage immediately
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving message:', error);
    }
  },

  clearMessages: async () => {
    set({ messages: [], currentConversationId: null });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(CONVERSATION_ID_KEY);
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  },

  saveConversation: async () => {
    const { messages, currentConversationId } = get();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || messages.length === 0) return;

    try {
      // Create or update conversation in Supabase
      const conversationData = {
        user_id: user.id,
        title: messages[0]?.content.substring(0, 100) || 'New conversation',
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          toolCalls: msg.toolCalls,
        })),
        updated_at: new Date().toISOString(),
      };

      if (currentConversationId) {
        // Update existing conversation
        const { error } = await supabase
          .from('conversations')
          .update(conversationData)
          .eq('id', currentConversationId);

        if (error) throw error;
      } else {
        // Create new conversation
        const { data, error } = await supabase
          .from('conversations')
          .insert([conversationData])
          .select()
          .single();

        if (error) throw error;

        if (data) {
          set({ currentConversationId: data.id });
          await AsyncStorage.setItem(CONVERSATION_ID_KEY, data.id);
        }
      }
    } catch (error) {
      console.error('Error saving conversation to Supabase:', error);
      // Don't throw - local storage is already saved
    }
  },
}));
