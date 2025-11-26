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

    // GET - Fetch all recipes
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ recipes: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // POST - Create new recipe
    if (req.method === 'POST') {
      const body = await req.json();
      const {
        title,
        ingredients,
        instructions,
        servings,
        prep_time,
        cook_time,
        image_url,
        tags,
        is_favorite,
        source,
      } = body;

      if (!title || !ingredients || !instructions) {
        throw new Error('Missing required fields: title, ingredients, instructions');
      }

      const { data, error } = await supabase
        .from('recipes')
        .insert([
          {
            user_id: userId,
            title,
            ingredients,
            instructions,
            servings: servings || null,
            prep_time: prep_time || null,
            cook_time: cook_time || null,
            image_url: image_url || null,
            tags: tags || [],
            is_favorite: is_favorite || false,
            source: source || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ recipe: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    // PUT - Update recipe
    if (req.method === 'PUT') {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const { data, error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ recipe: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // DELETE - Delete recipe
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const { error } = await supabase.from('recipes').delete().eq('id', id).eq('user_id', userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  } catch (error: any) {
    console.error('Error in recipes function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'Unauthorized' ? 401 : 500,
    });
  }
});
