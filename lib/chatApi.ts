import { supabase } from './supabase';
import { ChatMessage } from '@/types/database.types';

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  conversationId: string;
}

export interface GetMessagesRequest {
  conversationId: string;
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
  conversationId: string;
}

/**
 * Send a message to the chat API and get a response
 */
export const sendMessage = async (
  message: string,
  conversationId?: string
): Promise<SendMessageResponse> => {
  const { data, error } = await supabase.functions.invoke('process-chat', {
    body: {
      message,
      conversationId,
    } as SendMessageRequest,
  });

  if (error) {
    console.error('Error sending message:', error);
    throw new Error(error.message || 'Failed to send message');
  }

  if (!data) {
    throw new Error('No response from chat API');
  }

  return data as SendMessageResponse;
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  conversationId: string
): Promise<GetMessagesResponse> => {
  const { data, error } = await supabase.functions.invoke('get-messages', {
    body: {
      conversationId,
    } as GetMessagesRequest,
  });

  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error(error.message || 'Failed to fetch messages');
  }

  if (!data) {
    throw new Error('No response from chat API');
  }

  return data as GetMessagesResponse;
};
