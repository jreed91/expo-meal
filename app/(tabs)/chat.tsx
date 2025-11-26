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
import { useChatStore } from '@/store/chatStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ChatScreen() {
  const {
    messages: storedMessages,
    loading,
    loadMessages,
    sendMessage,
    clearMessages,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Default welcome message
  const welcomeMessage = {
    id: '1',
    role: 'assistant' as const,
    content:
      "Hi! I'm Claude, your cooking and meal planning assistant. I can help you with recipe suggestions, cooking tips, meal planning, and more. I can also help you add meals to your plan, manage your pantry and grocery list, and update your allergy information. What would you like to do?",
    timestamp: new Date().toISOString(),
  };

  // Use stored messages or show welcome message
  const messages = storedMessages.length > 0 ? storedMessages : [welcomeMessage];

  // Load chat messages on mount
  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const messageText = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    try {
      await sendMessage(messageText);
      // Messages are automatically updated by the store
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to get response from Claude');
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
    Alert.alert('Start New Chat', 'This will clear your current conversation. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'New Chat',
        style: 'destructive',
        onPress: async () => {
          await clearMessages();
        },
      },
    ]);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
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
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
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
                    <FontAwesome name="check-circle" size={16} color="#22c55e" />
                    <Text className="text-success-600 dark:text-success-400 font-semibold ml-2">
                      Action Performed
                    </Text>
                  </View>
                )}
                <Text
                  className={`${
                    message.role === 'user' ? 'text-white' : 'text-neutral-900 dark:text-neutral-50'
                  }`}
                >
                  {message.content}
                </Text>
              </View>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {formatTimestamp(message.timestamp)}
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
                  <Text className="text-neutral-700 dark:text-neutral-300">{prompt}</Text>
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
                inputText.trim() && !loading
                  ? 'bg-primary-500 active:bg-primary-600'
                  : 'bg-neutral-300 dark:bg-neutral-700'
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
