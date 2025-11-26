import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ToolCall } from './types.ts';

export const createSupabaseClient = (authHeader: string): SupabaseClient => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
};

export const getUserId = async (supabase: SupabaseClient): Promise<string> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user.id;
};

export const getUserContext = async (supabase: SupabaseClient, userId: string) => {
  // Fetch user profile with allergies
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

  // Fetch recipes
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Fetch pantry items
  const { data: pantryItems } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Fetch upcoming meal plans (7 days past to 14 days future)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14);

  const { data: mealPlans } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Fetch grocery list items from active lists
  const { data: groceryLists } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  let groceryItems: any[] = [];
  if (groceryLists && groceryLists.length > 0) {
    const listIds = groceryLists.map((list) => list.id);
    const { data: items } = await supabase
      .from('grocery_list_items')
      .select('*')
      .in('list_id', listIds);
    groceryItems = items || [];
  }

  return {
    profile: profile || null,
    recipes: recipes || [],
    pantryItems: pantryItems || [],
    mealPlans: mealPlans || [],
    groceryItems: groceryItems || [],
  };
};

export const executeTool = async (
  supabase: SupabaseClient,
  userId: string,
  toolCall: ToolCall
): Promise<string> => {
  switch (toolCall.name) {
    case 'add_meal_plan': {
      const { date, meal_type, meal_name, recipe_id } = toolCall.input;

      const { error } = await supabase.from('meal_plans').insert({
        user_id: userId,
        date,
        meal_type,
        meal_name,
        recipe_id: recipe_id || null,
      });

      if (error) throw error;
      return `Successfully added ${meal_name} to ${meal_type} on ${date}`;
    }

    case 'add_pantry_item': {
      const { name, quantity, unit, category, expiry_date } = toolCall.input;

      const { error } = await supabase.from('pantry_items').insert({
        user_id: userId,
        name,
        quantity,
        unit,
        category: category || null,
        expiry_date: expiry_date || null,
      });

      if (error) throw error;
      return `Successfully added ${quantity} ${unit} of ${name} to pantry`;
    }

    case 'add_grocery_item': {
      const { name, quantity, unit, category } = toolCall.input;
      const finalQuantity = quantity || 1;
      const finalUnit = unit || 'item';

      // Get or create an active grocery list
      const { data: existingLists } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      let listId: string;

      if (existingLists && existingLists.length > 0) {
        listId = existingLists[0].id;
      } else {
        // Create a new list
        const today = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const { data: newList, error: listError } = await supabase
          .from('grocery_lists')
          .insert({
            user_id: userId,
            name: `Grocery List - ${today}`,
          })
          .select()
          .single();

        if (listError || !newList) throw listError || new Error('Failed to create grocery list');
        listId = newList.id;
      }

      // Add item to the list
      const { error } = await supabase.from('grocery_list_items').insert({
        list_id: listId,
        name,
        quantity: finalQuantity,
        unit: finalUnit,
        category: category || null,
        is_checked: false,
      });

      if (error) throw error;
      return `Successfully added ${finalQuantity} ${finalUnit}${finalQuantity !== 1 ? 's' : ''} of ${name} to grocery list`;
    }

    case 'update_allergies': {
      const { allergies, action } = toolCall.input;

      // Get current allergies
      const { data: profile } = await supabase
        .from('profiles')
        .select('allergies')
        .eq('id', userId)
        .single();

      let updatedAllergies = profile?.allergies || [];

      if (action === 'replace') {
        updatedAllergies = allergies;
      } else if (action === 'add') {
        updatedAllergies = [...updatedAllergies, ...allergies].filter(
          (v: string, i: number, a: string[]) => a.indexOf(v) === i
        ); // Remove duplicates
      } else if (action === 'remove') {
        updatedAllergies = updatedAllergies.filter((a: string) => !allergies.includes(a));
      }

      const { error } = await supabase
        .from('profiles')
        .update({ allergies: updatedAllergies })
        .eq('id', userId);

      if (error) throw error;
      return `Successfully updated allergies. Current allergies: ${updatedAllergies.join(', ') || 'None'}`;
    }

    default:
      return `Unknown tool: ${toolCall.name}`;
  }
};
