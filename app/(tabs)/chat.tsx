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
      className="flex-1 bg-cream-100 dark:bg-neutral-900"
    >
      <View className="p-4 border-b border-cream-300 dark:border-neutral-800">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
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
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary-500'
                  : 'bg-white dark:bg-neutral-800'
              }`}
            >
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
        <View className="flex-row items-center space-x-2">
          <TextInput
            className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-2xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="Ask me anything about cooking..."
            placeholderTextColor="#A8A29E"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
            onSubmitEditing={handleSend}
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
  );
}
