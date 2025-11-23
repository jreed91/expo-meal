import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';

// Custom fetch for React Native compatibility
const customFetch: typeof fetch = async (url, init) => {
  console.log('📡 Fetching:', url);
  console.log('📋 Request headers:', init?.headers);

  const response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      'anthropic-version': '2023-06-01',
    },
  });

  console.log('📥 Response status:', response.status, response.statusText);

  if (!response.ok) {
    // Clone the response so we can read it without consuming it
    const clonedResponse = response.clone();
    try {
      const errorText = await clonedResponse.text();
      console.log('❌ Error response:', errorText);
    } catch (e) {
      console.log('❌ Could not read error response');
    }
  }

  return response;
};

export const anthropic = new Anthropic({
  apiKey,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
  fetch: customFetch,
});

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
  upcomingMeals: any[]
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
    pantryItems.slice(0, 10).forEach((item) => {
      context += `- ${item.name} (${item.quantity} ${item.unit})\n`;
    });
    context += `\n`;
  }

  if (upcomingMeals.length > 0) {
    context += `Upcoming meals planned:\n`;
    upcomingMeals.slice(0, 7).forEach((meal) => {
      context += `- ${meal.meal_type}: ${meal.meal_name || 'Unnamed meal'}\n`;
    });
    context += `\n`;
  }

  context += `You can help with:\n`;
  context += `- Meal suggestions based on what's in the pantry\n`;
  context += `- Recipe recommendations\n`;
  context += `- Cooking tips and substitutions\n`;
  context += `- Nutritional information\n`;
  context += `- Meal planning advice\n\n`;

  context += `IMPORTANT: You have access to tools that allow you to:\n`;
  context += `- Add meals to the user's meal plan\n`;
  context += `- Add items to the user's pantry\n`;
  context += `- Update the user's allergy information\n\n`;

  context += `When the user asks you to add a meal, add pantry items, or update their allergies, use the appropriate tool. Be proactive - if the user says "I bought eggs" or "let's have pasta for dinner tomorrow", use the tools to help them.\n\n`;

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

    console.log('Sending message to Claude with model: claude-3-5-sonnet-20241022');
    console.log('Messages count:', formattedMessages.length);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: contextPrompt,
      messages: formattedMessages,
      tools: tools,
    });

    let textContent = '';
    const toolCalls: ToolCall[] = [];

    // Process response content
    for (const content of response.content) {
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
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      error: error.error,
    });

    // Provide more helpful error messages
    if (error.status === 404) {
      throw new Error(
        'API endpoint not found (404). This may be due to React Native compatibility issues with the Anthropic SDK. Consider using a backend proxy instead of dangerouslyAllowBrowser.'
      );
    } else if (error.status === 401) {
      throw new Error(
        'Invalid API key. Please check your EXPO_PUBLIC_ANTHROPIC_API_KEY in .env file.'
      );
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error(
        'Network error. Please check your internet connection and ensure the Anthropic API is accessible.'
      );
    }

    throw error;
  }
};
