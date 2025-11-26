import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await signUp(email, password, fullName);
      Alert.alert('Success', 'Account created! Please check your email to verify your account.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-cream-100 dark:bg-neutral-900"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Create Account
        </Text>
        <Text className="text-neutral-600 dark:text-neutral-400 mb-8">
          Start planning your meals today
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Full Name *
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              placeholder="John Doe"
              placeholderTextColor="#A8A29E"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Email *
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              placeholder="your@email.com"
              placeholderTextColor="#A8A29E"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Password *
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              placeholder="••••••••"
              placeholderTextColor="#A8A29E"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Confirm Password *
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              placeholder="••••••••"
              placeholderTextColor="#A8A29E"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            className="w-full bg-primary-500 py-4 rounded-xl items-center mt-4 active:bg-primary-600"
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">Sign Up</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-4">
            <Text className="text-neutral-600 dark:text-neutral-400">
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text className="text-primary-500 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
