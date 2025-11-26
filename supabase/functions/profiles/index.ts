import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient, getUserId } from '../_shared/database.ts';

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

    const supabase = createSupabaseClient(authHeader);
    const userId = await getUserId(supabase);

    // GET - Fetch user profile
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) throw error;

      return new Response(JSON.stringify({ profile: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // PUT - Update user profile
    if (req.method === 'PUT') {
      const body = await req.json();
      const { full_name, allergies } = body;

      const updates: any = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (allergies !== undefined) updates.allergies = allergies;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ profile: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  } catch (error: any) {
    console.error('Error in profiles function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'Unauthorized' ? 401 : 500,
    });
  }
});
