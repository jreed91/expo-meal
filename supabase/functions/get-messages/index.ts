import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient, getUserId } from '../_shared/database.ts';
import { GetMessagesRequest, GetMessagesResponse } from '../_shared/types.ts';

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
    const { conversationId }: GetMessagesRequest = await req.json();

    if (!conversationId) {
      throw new Error('conversationId is required');
    }

    // Fetch conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }
      throw error;
    }

    // Return response
    const response: GetMessagesResponse = {
      messages: conversation?.messages || [],
      conversationId,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});
