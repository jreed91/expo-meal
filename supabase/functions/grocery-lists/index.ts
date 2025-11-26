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

    const url = new URL(req.url);
    const action = url.searchParams.get('action'); // 'lists' or 'items'
    const listId = url.searchParams.get('listId');

    // GET - Fetch grocery lists or items
    if (req.method === 'GET') {
      if (action === 'items' && listId) {
        // Fetch items for a specific list
        // First verify the list belongs to the user
        const { data: list } = await supabase
          .from('grocery_lists')
          .select('id')
          .eq('id', listId)
          .eq('user_id', userId)
          .single();

        if (!list) {
          throw new Error('List not found or unauthorized');
        }

        const { data, error } = await supabase
          .from('grocery_list_items')
          .select('*')
          .eq('list_id', listId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        return new Response(JSON.stringify({ items: data || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        // Fetch all grocery lists
        const { data, error } = await supabase
          .from('grocery_lists')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ lists: data || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // POST - Create new list or item
    if (req.method === 'POST') {
      const body = await req.json();

      if (action === 'items') {
        // Create new grocery list item
        const { list_id, name, quantity, unit, category, is_checked, recipe_id } = body;

        if (!list_id || !name || !quantity || !unit) {
          throw new Error('Missing required fields: list_id, name, quantity, unit');
        }

        // Verify list belongs to user
        const { data: list } = await supabase
          .from('grocery_lists')
          .select('id')
          .eq('id', list_id)
          .eq('user_id', userId)
          .single();

        if (!list) {
          throw new Error('List not found or unauthorized');
        }

        const { data, error } = await supabase
          .from('grocery_list_items')
          .insert([
            {
              list_id,
              name,
              quantity,
              unit,
              category: category || null,
              is_checked: is_checked || false,
              recipe_id: recipe_id || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ item: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        });
      } else {
        // Create new grocery list
        const { name } = body;

        if (!name) {
          throw new Error('Missing required field: name');
        }

        const { data, error } = await supabase
          .from('grocery_lists')
          .insert([
            {
              user_id: userId,
              name,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ list: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        });
      }
    }

    // PUT - Update list or item
    if (req.method === 'PUT') {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      if (action === 'items') {
        // Update grocery list item
        const { data, error } = await supabase
          .from('grocery_list_items')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ item: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        // Update grocery list
        const { data, error } = await supabase
          .from('grocery_lists')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ list: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // DELETE - Delete list or item
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      if (action === 'items') {
        // Delete grocery list item
        const { error } = await supabase.from('grocery_list_items').delete().eq('id', id);

        if (error) throw error;
      } else {
        // Delete grocery list (and cascade to items)
        const { error } = await supabase
          .from('grocery_lists')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;
      }

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
    console.error('Error in grocery-lists function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status:
        error.message === 'Unauthorized' || error.message.includes('unauthorized') ? 401 : 500,
    });
  }
});
