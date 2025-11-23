import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { profile, user, signOut, fetchProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [allergies, setAllergies] = useState(
    profile?.allergies?.join(', ') || ''
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allergiesArray = allergies
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          allergies: allergiesArray,
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setAllergies(profile?.allergies?.join(', ') || '');
    setEditing(false);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Profile
        </Text>

        <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Email
          </Text>
          <Text className="text-lg text-gray-900 dark:text-white">
            {user?.email}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </Text>
          {editing ? (
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
            />
          ) : (
            <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <Text className="text-lg text-gray-900 dark:text-white">
                {profile?.full_name || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Allergies
          </Text>
          {editing ? (
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g., Peanuts, Shellfish, Dairy"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          ) : (
            <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <Text className="text-lg text-gray-900 dark:text-white">
                {profile?.allergies && profile.allergies.length > 0
                  ? profile.allergies.join(', ')
                  : 'None specified'}
              </Text>
            </View>
          )}
          {editing && (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Separate multiple allergies with commas
            </Text>
          )}
        </View>

        {editing ? (
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-blue-600 py-3 rounded-lg items-center"
              onPress={handleSave}
              disabled={loading}
            >
              <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-300 dark:bg-gray-700 py-3 rounded-lg items-center"
              onPress={handleCancel}
              disabled={loading}
            >
              <Text className="text-gray-700 dark:text-gray-300 font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-blue-600 py-3 rounded-lg items-center mb-4"
            onPress={() => setEditing(true)}
          >
            <Text className="text-white font-semibold">Edit Profile</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="bg-red-600 py-3 rounded-lg items-center mt-4"
          onPress={handleSignOut}
        >
          <Text className="text-white font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
