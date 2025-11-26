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
import { useChatStore } from '@/store/chatStore';
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
  const {
    messages: storedMessages,
    loadMessages,
    addMessage,
    clearMessages,
    saveConversation,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Use stored messages or default welcome message
  const messages =
    storedMessages.length > 0
      ? storedMessages
      : [
          {
            id: '1',
            role: 'assistant' as const,
            content:
              "Hi! I'm Claude, your cooking and meal planning assistant. I can help you with recipe suggestions, cooking tips, meal planning, and more. I can also help you add meals to your plan, manage your pantry and grocery list, and update your allergy information. What would you like to do?",
            timestamp: new Date(),
          },
        ];

  // Load chat messages and grocery lists on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadMessages(), fetchGroceryLists()]);
    };
    loadData();
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

          // Default values if not provided
          const finalQuantity = quantity || 1;
          const finalUnit = unit || 'item';

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
            quantity: finalQuantity,
            unit: finalUnit,
            category: category || null,
            is_checked: false,
            recipe_id: null,
          });

          // Refresh grocery list items
          await fetchGroceryListItems(activeList.id);

          return `Successfully added ${finalQuantity} ${finalUnit}${finalQuantity !== 1 ? 's' : ''} of ${name} to grocery list`;
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

    await addMessage(userMessage);
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

      await addMessage(assistantMessage);

      // Save conversation to Supabase (non-blocking)
      saveConversation().catch((err) =>
        console.error('Failed to save conversation:', err)
      );
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

  const handleNewChat = () => {
    Alert.alert(
      'Start New Chat',
      'This will clear your current conversation. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Chat',
          style: 'destructive',
          onPress: async () => {
            await clearMessages();
          },
        },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-cream-100 dark:bg-neutral-900"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="p-4 border-b border-cream-300 dark:border-neutral-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                Chat with Claude
              </Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {storedMessages.length > 0
                  ? `${storedMessages.length} messages • Auto-saved`
                  : 'Tap anywhere to dismiss keyboard'}
              </Text>
            </View>
            {storedMessages.length > 0 && (
              <TouchableOpacity
                onPress={handleNewChat}
                className="ml-3 p-2 bg-cream-50 dark:bg-neutral-800 rounded-xl active:bg-cream-200 dark:active:bg-neutral-700"
              >
                <FontAwesome name="plus" size={18} color="#A8A29E" />
              </TouchableOpacity>
            )}
          </View>
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
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary-500'
                  : message.toolCalls && message.toolCalls.length > 0
                    ? 'bg-success-50 dark:bg-success-900/20 border-2 border-success-500'
                    : 'bg-white dark:bg-neutral-800'
              }`}
            >
              {message.toolCalls && message.toolCalls.length > 0 && (
                <View className="flex-row items-center mb-2">
                  <FontAwesome
                    name="check-circle"
                    size={16}
                    color="#22c55e"
                  />
                  <Text className="text-success-600 dark:text-success-400 font-semibold ml-2">
                    Action Performed
                  </Text>
                </View>
              )}
              <Text
                className={`${
                  message.role === 'user'
                    ? 'text-white'
                    : 'text-neutral-900 dark:text-neutral-50'
                }`}
              >
                {message.content}
              </Text>
            </View>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {message.timestamp.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}

        {loading && (
          <View className="items-start mb-4">
            <View className="bg-white dark:bg-neutral-800 p-4 rounded-2xl">
              <ActivityIndicator size="small" color="#FF7A55" />
            </View>
          </View>
        )}

        {messages.length === 1 && (
          <View className="mt-4">
            <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
              Try asking:
            </Text>
            {suggestedPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white dark:bg-neutral-800 p-4 rounded-2xl mb-3 border border-cream-300 dark:border-neutral-700 active:bg-cream-200 dark:active:bg-neutral-700"
                onPress={() => handleSuggestedPrompt(prompt)}
              >
                <Text className="text-neutral-700 dark:text-neutral-300">
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="p-4 border-t border-cream-300 dark:border-neutral-800 bg-cream-50 dark:bg-neutral-900">
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-2xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="Ask me anything about cooking..."
            placeholderTextColor="#A8A29E"
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
            className={`p-4 rounded-2xl ${
              inputText.trim() && !loading ? 'bg-primary-500 active:bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-700'
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
