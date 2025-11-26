import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  createSupabaseClient,
  getUserId,
  getUserContext,
  executeTool,
} from '../_shared/database.ts';
import { sendMessageToClaude, buildContextPrompt } from '../_shared/claude.ts';
import {
  ChatMessage,
  SendMessageRequest,
  SendMessageResponse,
  ToolCall,
} from '../_shared/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's auth
    const supabase = createSupabaseClient(authHeader);
    const userId = await getUserId(supabase);

    // Parse request body
    const { message, conversationId }: SendMessageRequest = await req.json();

    if (!message || !message.trim()) {
      throw new Error('Message is required');
    }

    // Load existing conversation messages if conversationId is provided
    let existingMessages: ChatMessage[] = [];
    let currentConversationId = conversationId;

    if (conversationId) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (conversation) {
        existingMessages = conversation.messages || [];
      }
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    // Get user context for Claude
    const context = await getUserContext(supabase, userId);
    const contextPrompt = buildContextPrompt(
      context.profile,
      context.recipes,
      context.pantryItems,
      context.mealPlans,
      context.groceryItems
    );

    // Build conversation history for Claude
    const conversationHistory = [...existingMessages, userMessage].map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Get Claude API key from environment
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Send message to Claude
    const claudeResponse = await sendMessageToClaude(conversationHistory, contextPrompt, apiKey);

    // Execute any tool calls
    let finalContent = claudeResponse.text;
    const executedTools: ToolCall[] = [];

    if (claudeResponse.toolCalls && claudeResponse.toolCalls.length > 0) {
      const toolResults: string[] = [];

      for (const toolCall of claudeResponse.toolCalls) {
        try {
          const result = await executeTool(supabase, userId, toolCall);
          toolResults.push(result);
          executedTools.push({
            ...toolCall,
            result,
          });
        } catch (error: any) {
          const errorMsg = `Error executing ${toolCall.name}: ${error.message}`;
          toolResults.push(errorMsg);
          executedTools.push({
            ...toolCall,
            result: errorMsg,
          });
        }
      }

      // Append tool execution results to the message
      if (toolResults.length > 0) {
        finalContent =
          (finalContent ? finalContent + '\n\n' : '') +
          '✅ Actions completed:\n' +
          toolResults.map((r) => `• ${r}`).join('\n');
      }
    }

    // Create assistant message
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: finalContent || 'Done!',
      timestamp: new Date().toISOString(),
      toolCalls: executedTools.length > 0 ? executedTools : undefined,
    };

    // Update conversation in database
    const updatedMessages = [...existingMessages, userMessage, assistantMessage];

    const conversationData = {
      user_id: userId,
      title: existingMessages.length === 0 ? message.substring(0, 100) : undefined, // Only set title for new conversations
      messages: updatedMessages,
      updated_at: new Date().toISOString(),
    };

    if (currentConversationId) {
      // Update existing conversation
      const { error } = await supabase
        .from('conversations')
        .update(conversationData)
        .eq('id', currentConversationId)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert([conversationData])
        .select()
        .single();

      if (error) throw error;
      currentConversationId = data.id;
    }

    // Return response
    const response: SendMessageResponse = {
      message: assistantMessage,
      conversationId: currentConversationId!,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error processing chat:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'Unauthorized' ? 401 : 500,
    });
  }
});
