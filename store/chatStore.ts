import { create } from 'zustand';
import { ChatMessage } from '@/types/database.types';
import { sendMessage as sendMessageApi, getMessages } from '@/lib/chatApi';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  currentConversationId: string | null;
  loadMessages: (conversationId?: string) => Promise<void>;
  sendMessage: (message: string) => Promise<ChatMessage>;
  clearMessages: () => void;
  setConversationId: (id: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  currentConversationId: null,

  loadMessages: async (conversationId?: string) => {
    const idToLoad = conversationId || get().currentConversationId;

    if (!idToLoad) {
      // No conversation to load
      set({ messages: [] });
      return;
    }

    try {
      set({ loading: true });
      const response = await getMessages(idToLoad);

      // Convert timestamp strings to Date objects if needed
      const messages = response.messages.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp,
      }));

      set({
        messages,
        currentConversationId: response.conversationId,
      });
    } catch (error) {
      console.error('Error loading messages:', error);
      // Don't throw - just set empty messages
      set({ messages: [] });
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (message: string): Promise<ChatMessage> => {
    const { currentConversationId } = get();

    try {
      set({ loading: true });

      // Call the Edge Function
      const response = await sendMessageApi(message, currentConversationId || undefined);

      // Add both user message and assistant response to state
      // The response includes the assistant message, and the conversation includes both
      // We need to reload the conversation to get the full message history
      const updatedMessages = await getMessages(response.conversationId);

      set({
        messages: updatedMessages.messages,
        currentConversationId: response.conversationId,
      });

      return response.message;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearMessages: () => {
    set({ messages: [], currentConversationId: null });
  },

  setConversationId: (id: string | null) => {
    set({ currentConversationId: id });
  },
}));
