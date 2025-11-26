import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import * as profileApi from '@/lib/profileApi';

export default function ProfileScreen() {
  const { profile, user, signOut, fetchProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [allergies, setAllergies] = useState(profile?.allergies?.join(', ') || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allergiesArray = allergies
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a);

      await profileApi.updateProfile({
        full_name: fullName,
        allergies: allergiesArray,
      });

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
    <ScrollView className="flex-1 bg-cream-100 dark:bg-neutral-900">
      <View className="p-6">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">Profile</Text>

        <View className="bg-cream-50 dark:bg-neutral-800 rounded-xl p-4 mb-6">
          <Text className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Email</Text>
          <Text className="text-lg text-neutral-900 dark:text-white">{user?.email}</Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Full Name
          </Text>
          {editing ? (
            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor="#A8A29E"
            />
          ) : (
            <View className="bg-cream-50 dark:bg-neutral-800 rounded-xl p-4">
              <Text className="text-lg text-neutral-900 dark:text-white">
                {profile?.full_name || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Allergies
          </Text>
          {editing ? (
            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g., Peanuts, Shellfish, Dairy"
              placeholderTextColor="#A8A29E"
              multiline
            />
          ) : (
            <View className="bg-cream-50 dark:bg-neutral-800 rounded-xl p-4">
              <Text className="text-lg text-neutral-900 dark:text-white">
                {profile?.allergies && profile.allergies.length > 0
                  ? profile.allergies.join(', ')
                  : 'None specified'}
              </Text>
            </View>
          )}
          {editing && (
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Separate multiple allergies with commas
            </Text>
          )}
        </View>

        {editing ? (
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-primary-500 py-3 rounded-xl items-center active:bg-primary-600"
              onPress={handleSave}
              disabled={loading}
            >
              <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-neutral-300 dark:bg-neutral-700 py-3 rounded-xl items-center active:bg-neutral-400 dark:active:bg-neutral-600"
              onPress={handleCancel}
              disabled={loading}
            >
              <Text className="text-neutral-700 dark:text-neutral-300 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-primary-500 py-3 rounded-xl items-center mb-4 active:bg-primary-600"
            onPress={() => setEditing(true)}
          >
            <Text className="text-white font-semibold">Edit Profile</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="bg-danger-600 py-3 rounded-xl items-center mt-4 active:bg-danger-700"
          onPress={handleSignOut}
        >
          <Text className="text-white font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
