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

    // GET - Fetch all pantry items
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .order('expiry_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      return new Response(JSON.stringify({ items: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // POST - Create new pantry item
    if (req.method === 'POST') {
      const body = await req.json();
      const { name, quantity, unit, category, expiry_date } = body;

      if (!name || !quantity || !unit) {
        throw new Error('Missing required fields: name, quantity, unit');
      }

      const { data, error } = await supabase
        .from('pantry_items')
        .insert([{
          user_id: userId,
          name,
          quantity,
          unit,
          category: category || null,
          expiry_date: expiry_date || null,
        }])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ item: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    // PUT - Update pantry item
    if (req.method === 'PUT') {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const { data, error } = await supabase
        .from('pantry_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ item: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // DELETE - Delete pantry item
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );
  } catch (error: any) {
    console.error('Error in pantry function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});
