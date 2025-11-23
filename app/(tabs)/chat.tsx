import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { usePantryStore } from '@/store/pantryStore';
import { useGroceryStore } from '@/store/groceryStore';
import { Message, buildContextPrompt, sendMessage, ToolCall } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ChatScreen() {
  const { profile, user, fetchProfile } = useAuthStore();
  const { recipes } = useRecipeStore();
  const { mealPlans, addMealPlan, fetchMealPlans } = useMealPlanStore();
  const { pantryItems, addPantryItem, fetchPantryItems } = usePantryStore();
  const {
    groceryLists,
    groceryListItems,
    createGroceryList,
    addItemToList,
    fetchGroceryLists,
    fetchGroceryListItems,
  } = useGroceryStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm Claude, your cooking and meal planning assistant. I can help you with recipe suggestions, cooking tips, meal planning, and more. I can also help you add meals to your plan, manage your pantry and grocery list, and update your allergy information. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load grocery lists on mount and their items
  useEffect(() => {
    const loadGroceryData = async () => {
      await fetchGroceryLists();
    };
    loadGroceryData();
  }, []);

  // Load items when grocery lists change
  useEffect(() => {
    groceryLists.forEach((list) => {
      if (!groceryListItems[list.id]) {
        fetchGroceryListItems(list.id);
      }
    });
  }, [groceryLists]);

  // Get all grocery items from active lists
  const allGroceryItems = Object.values(groceryListItems).flat();

  const contextPrompt = buildContextPrompt(
    profile,
    recipes,
    pantryItems,
    mealPlans,
    allGroceryItems
  );

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Execute tool calls
  const executeTool = async (toolCall: ToolCall): Promise<string> => {
    try {
      switch (toolCall.name) {
        case 'add_meal_plan': {
          const { date, meal_type, meal_name, recipe_id } = toolCall.input;
          await addMealPlan({
            date,
            meal_type,
            meal_name,
            recipe_id: recipe_id || null,
          });
          // Refresh meal plans
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 14);
          await fetchMealPlans(startDate, endDate);
          return `Successfully added ${meal_name} to ${meal_type} on ${date}`;
        }

        case 'add_pantry_item': {
          const { name, quantity, unit, category, expiry_date } = toolCall.input;
          await addPantryItem({
            name,
            quantity,
            unit,
            category: category || null,
            expiry_date: expiry_date || null,
          });
          // Refresh pantry items
          await fetchPantryItems();
          return `Successfully added ${quantity} ${unit} of ${name} to pantry`;
        }

        case 'add_grocery_item': {
          const { name, quantity, unit, category } = toolCall.input;

          // Get or create an active grocery list
          let activeList = groceryLists[0]; // Use the most recent list
          if (!activeList) {
            // Create a new list if none exists
            const today = new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            activeList = await createGroceryList(`Grocery List - ${today}`);
          }

          // Add item to the list
          await addItemToList(activeList.id, {
            name,
            quantity,
            unit,
            category: category || null,
            is_checked: false,
            recipe_id: null,
          });

          // Refresh grocery list items
          await fetchGroceryListItems(activeList.id);

          return `Successfully added ${quantity} ${unit} of ${name} to grocery list`;
        }

        case 'update_allergies': {
          if (!user) throw new Error('Not authenticated');
          const { allergies, action } = toolCall.input;

          let updatedAllergies = [...(profile?.allergies || [])];

          if (action === 'replace') {
            updatedAllergies = allergies;
          } else if (action === 'add') {
            updatedAllergies = [...updatedAllergies, ...allergies].filter(
              (v, i, a) => a.indexOf(v) === i
            ); // Remove duplicates
          } else if (action === 'remove') {
            updatedAllergies = updatedAllergies.filter(
              (a) => !allergies.includes(a)
            );
          }

          const { error } = await supabase
            .from('profiles')
            .update({ allergies: updatedAllergies })
            .eq('id', user.id);

          if (error) throw error;

          await fetchProfile();
          return `Successfully updated allergies. Current allergies: ${updatedAllergies.join(', ') || 'None'}`;
        }

        default:
          return `Unknown tool: ${toolCall.name}`;
      }
    } catch (error: any) {
      console.error('Error executing tool:', error);
      return `Error executing ${toolCall.name}: ${error.message}`;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    Keyboard.dismiss();
    setLoading(true);

    try {
      const conversationHistory = [...messages, userMessage];
      const response = await sendMessage(conversationHistory, contextPrompt);

      // Execute any tool calls
      let finalContent = response.text;
      const executedTools: ToolCall[] = [];

      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolResults: string[] = [];

        for (const toolCall of response.toolCalls) {
          const result = await executeTool(toolCall);
          toolResults.push(result);
          executedTools.push({
            ...toolCall,
            result,
          });
        }

        // Append tool execution results to the message
        if (toolResults.length > 0) {
          finalContent =
            (finalContent ? finalContent + '\n\n' : '') +
            '✅ Actions completed:\n' +
            toolResults.map((r) => `• ${r}`).join('\n');
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent || 'Done!',
        timestamp: new Date(),
        toolCalls: executedTools.length > 0 ? executedTools : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to get response from Claude'
      );
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    "What can I make with what's in my pantry?",
    'Add spaghetti to dinner tomorrow',
    'I need to buy milk and eggs',
    'Suggest meals for this week',
  ];

  const handleSuggestedPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white dark:bg-gray-900"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat with Claude
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tap anywhere to dismiss keyboard
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1 p-4"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
        {messages.map((message) => (
          <View
            key={message.id}
            className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <View
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600'
                  : message.toolCalls && message.toolCalls.length > 0
                    ? 'bg-green-50 dark:bg-green-900 border-2 border-green-500'
                    : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {message.toolCalls && message.toolCalls.length > 0 && (
                <View className="flex-row items-center mb-2">
                  <FontAwesome
                    name="check-circle"
                    size={16}
                    color="#22c55e"
                  />
                  <Text className="text-green-600 dark:text-green-400 font-semibold ml-2">
                    Action Performed
                  </Text>
                </View>
              )}
              <Text
                className={`${
                  message.role === 'user'
                    ? 'text-white'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {message.content}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {message.timestamp.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}

        {loading && (
          <View className="items-start mb-4">
            <View className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          </View>
        )}

        {messages.length === 1 && (
          <View className="mt-4">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Try asking:
            </Text>
            {suggestedPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-2 border border-gray-200 dark:border-gray-700"
                onPress={() => handleSuggestedPrompt(prompt)}
              >
                <Text className="text-gray-700 dark:text-gray-300">
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Ask me anything about cooking..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            maxLength={500}
            editable={!loading}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            enablesReturnKeyAutomatically
          />
          <TouchableOpacity
            className={`p-3 rounded-lg ${
              inputText.trim() && !loading ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FontAwesome name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
