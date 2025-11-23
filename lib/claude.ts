import Anthropic from '@anthropic-ai/sdk';
import { useAuthStore } from '@/store/authStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { usePantryStore } from '@/store/pantryStore';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';

export const anthropic = new Anthropic({
  apiKey,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
});

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const buildContextPrompt = (
  profile: any,
  recipes: any[],
  pantryItems: any[],
  upcomingMeals: any[]
): string => {
  const allergies = profile?.allergies || [];
  const favoriteRecipes = recipes.filter((r) => r.is_favorite);

  let context = `You are a helpful cooking and meal planning assistant. Here's the context about the user:\n\n`;

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

  context += `Be friendly, concise, and helpful. Always remember the user's allergies.`;

  return context;
};

export const sendMessage = async (
  messages: Message[],
  contextPrompt: string
): Promise<string> => {
  try {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: contextPrompt,
      messages: formattedMessages,
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Error sending message to Claude:', error);
    throw error;
  }
};
