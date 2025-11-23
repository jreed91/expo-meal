const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: any;
  result?: string;
}

// Tool definitions for Claude
export const tools = [
  {
    name: 'add_meal_plan',
    description:
      'Add a meal to the meal plan for a specific date and meal type. Use this when the user wants to plan a meal for a specific day.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (e.g., 2025-11-23)',
        },
        meal_type: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Type of meal',
        },
        meal_name: {
          type: 'string',
          description: 'Name of the meal or dish',
        },
        recipe_id: {
          type: 'string',
          description: 'Optional recipe ID if linking to an existing recipe',
        },
      },
      required: ['date', 'meal_type', 'meal_name'],
    },
  },
  {
    name: 'add_pantry_item',
    description:
      'Add an item to the pantry inventory. Use this when the user mentions they have or bought ingredients.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the pantry item',
        },
        quantity: {
          type: 'number',
          description: 'Quantity of the item',
        },
        unit: {
          type: 'string',
          description: 'Unit of measurement (e.g., cups, grams, pieces, lbs)',
        },
        category: {
          type: 'string',
          description:
            'Optional category (e.g., dairy, meat, vegetables, grains)',
        },
        expiry_date: {
          type: 'string',
          description: 'Optional expiry date in YYYY-MM-DD format',
        },
      },
      required: ['name', 'quantity', 'unit'],
    },
  },
  {
    name: 'add_grocery_item',
    description:
      'Add an item to the grocery list. Use this when the user mentions they need to buy something. If no active grocery list exists, one will be created.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the grocery item',
        },
        quantity: {
          type: 'number',
          description: 'Quantity of the item',
        },
        unit: {
          type: 'string',
          description: 'Unit of measurement (e.g., cups, grams, pieces, lbs)',
        },
        category: {
          type: 'string',
          description:
            'Optional category (e.g., dairy, meat, vegetables, grains)',
        },
      },
      required: ['name', 'quantity', 'unit'],
    },
  },
  {
    name: 'update_allergies',
    description:
      'Update the user\'s allergy information. Use this when the user mentions new allergies or wants to modify their allergy list.',
    input_schema: {
      type: 'object',
      properties: {
        allergies: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of allergy names',
        },
        action: {
          type: 'string',
          enum: ['replace', 'add', 'remove'],
          description:
            'Whether to replace all allergies, add new ones, or remove specific ones',
        },
      },
      required: ['allergies', 'action'],
    },
  },
];

export const buildContextPrompt = (
  profile: any,
  recipes: any[],
  pantryItems: any[],
  upcomingMeals: any[],
  groceryItems: any[]
): string => {
  const allergies = profile?.allergies || [];
  const favoriteRecipes = recipes.filter((r) => r.is_favorite);

  let context = `You are a helpful cooking and meal planning assistant with the ability to take actions. Here's the context about the user:\n\n`;

  if (allergies.length > 0) {
    context += `IMPORTANT: The user has the following allergies: ${allergies.join(', ')}. Always consider these when suggesting recipes or ingredients.\n\n`;
  }

  if (favoriteRecipes.length > 0) {
    context += `User's favorite recipes:\n`;
    favoriteRecipes.slice(0, 5).forEach((recipe) => {
      context += `- ${recipe.title}\n`;
    });
    context += `\n`;
  }

  if (pantryItems.length > 0) {
    context += `Items currently in pantry:\n`;
    pantryItems.slice(0, 15).forEach((item) => {
      context += `- ${item.name} (${item.quantity} ${item.unit})\n`;
    });
    context += `\n`;
  }

  if (upcomingMeals.length > 0) {
    context += `Upcoming meals planned:\n`;
    upcomingMeals.slice(0, 10).forEach((meal) => {
      const dateObj = new Date(meal.date);
      const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      context += `- ${dateStr} ${meal.meal_type}: ${meal.meal_name || 'Unnamed meal'}\n`;
    });
    context += `\n`;
  }

  if (groceryItems.length > 0) {
    const unchecked = groceryItems.filter((item) => !item.is_checked);
    if (unchecked.length > 0) {
      context += `Items on grocery list (need to buy):\n`;
      unchecked.slice(0, 15).forEach((item) => {
        context += `- ${item.name} (${item.quantity} ${item.unit})\n`;
      });
      context += `\n`;
    }
  }

  context += `You can help with:\n`;
  context += `- Meal suggestions based on what's in the pantry\n`;
  context += `- Recipe recommendations\n`;
  context += `- Cooking tips and substitutions\n`;
  context += `- Nutritional information\n`;
  context += `- Meal planning and grocery shopping advice\n\n`;

  context += `IMPORTANT: You have access to tools that allow you to:\n`;
  context += `- Add meals to the user's meal plan\n`;
  context += `- Add items to the user's pantry (when they buy/have ingredients)\n`;
  context += `- Add items to the user's grocery list (when they need to buy something)\n`;
  context += `- Update the user's allergy information\n\n`;

  context += `Be smart about context:\n`;
  context += `- When suggesting recipes, check if ingredients are in the pantry or grocery list\n`;
  context += `- If ingredients are missing, offer to add them to the grocery list\n`;
  context += `- Consider upcoming meals when making suggestions\n`;
  context += `- When user says "I bought X", add to pantry. When they say "I need X", add to grocery list\n\n`;

  context += `Be friendly, concise, and helpful. Always remember the user's allergies.`;

  return context;
};

export interface SendMessageResponse {
  text: string;
  toolCalls?: ToolCall[];
}

export const sendMessage = async (
  messages: Message[],
  contextPrompt: string
): Promise<SendMessageResponse> => {
  try {
    // Validate API key
    console.log('API Key check:', {
      exists: !!apiKey,
      length: apiKey?.length,
      prefix: apiKey?.substring(0, 7),
      isPlaceholder: apiKey === 'your-anthropic-api-key-here',
    });

    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      throw new Error(
        'Anthropic API key not configured. Please set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file.'
      );
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log('Sending message to Claude API');
    console.log('Messages count:', formattedMessages.length);

    // Direct API call using fetch (bypassing SDK for React Native compatibility)
    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: contextPrompt,
      messages: formattedMessages,
      tools: tools,
    };

    console.log('📡 Calling:', ANTHROPIC_API_URL);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error response:', errorData);

      if (response.status === 401) {
        throw new Error(
          'Invalid API key. Please check your EXPO_PUBLIC_ANTHROPIC_API_KEY in .env file.'
        );
      } else if (response.status === 400) {
        throw new Error(
          `Bad request: ${errorData.error?.message || 'Invalid request format'}`
        );
      } else {
        throw new Error(
          `API error (${response.status}): ${errorData.error?.message || response.statusText}`
        );
      }
    }

    const data = await response.json();
    console.log('✅ Response received, processing content');

    let textContent = '';
    const toolCalls: ToolCall[] = [];

    // Process response content
    for (const content of data.content) {
      if (content.type === 'text') {
        textContent += content.text;
      } else if (content.type === 'tool_use') {
        toolCalls.push({
          id: content.id,
          name: content.name,
          input: content.input,
        });
      }
    }

    return {
      text: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  } catch (error: any) {
    console.error('Error sending message to Claude:', error);

    // Network error
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error(
        'Network error. Please check your internet connection and ensure the Anthropic API is accessible.'
      );
    }

    throw error;
  }
};
