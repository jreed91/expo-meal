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
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { usePantryStore } from '@/store/pantryStore';
import { Message, buildContextPrompt, sendMessage } from '@/lib/claude';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ChatScreen() {
  const { profile } = useAuthStore();
  const { recipes } = useRecipeStore();
  const { mealPlans } = useMealPlanStore();
  const { pantryItems } = usePantryStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm Claude, your cooking and meal planning assistant. I can help you with recipe suggestions, cooking tips, meal planning, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const contextPrompt = buildContextPrompt(
    profile,
    recipes,
    pantryItems,
    mealPlans
  );

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

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
    setLoading(true);

    try {
      const conversationHistory = [...messages, userMessage];
      const response = await sendMessage(conversationHistory, contextPrompt);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
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
    'Suggest a healthy dinner for tonight',
    'Help me plan meals for this week',
    'Give me a quick breakfast idea',
  ];

  const handleSuggestedPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <View className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Chat with Claude
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
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
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
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

      <View className="p-4 border-t border-gray-200 dark:border-gray-800">
        <View className="flex-row items-center space-x-2">
          <TextInput
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Ask me anything about cooking..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
            onSubmitEditing={handleSend}
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
  );
}
