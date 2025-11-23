import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecipeStore } from '@/store/recipeStore';
import { RecipeIngredient } from '@/types/database.types';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { recipes, deleteRecipe, toggleFavorite, fetchRecipes } =
    useRecipeStore();
  const [loading, setLoading] = useState(false);

  const recipe = recipes.find((r) => r.id === id);

  useEffect(() => {
    if (!recipe) {
      fetchRecipes();
    }
  }, []);

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteRecipe(id as string);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete recipe');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const ingredients = recipe.ingredients as RecipeIngredient[];

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <View className="flex-row space-x-4">
          <TouchableOpacity
            onPress={() => toggleFavorite(recipe.id)}
            disabled={loading}
          >
            <FontAwesome
              name={recipe.is_favorite ? 'star' : 'star-o'}
              size={24}
              color={recipe.is_favorite ? '#EAB308' : '#9CA3AF'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} disabled={loading}>
            <FontAwesome name="trash-o" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {recipe.title}
          </Text>

          <View className="flex-row flex-wrap mb-4">
            {recipe.servings && (
              <View className="flex-row items-center mr-4 mb-2">
                <FontAwesome name="users" size={16} color="#9CA3AF" />
                <Text className="text-gray-600 dark:text-gray-400 ml-2">
                  {recipe.servings} servings
                </Text>
              </View>
            )}
            {recipe.prep_time && (
              <View className="flex-row items-center mr-4 mb-2">
                <FontAwesome name="clock-o" size={16} color="#9CA3AF" />
                <Text className="text-gray-600 dark:text-gray-400 ml-2">
                  {recipe.prep_time}m prep
                </Text>
              </View>
            )}
            {recipe.cook_time && (
              <View className="flex-row items-center mr-4 mb-2">
                <FontAwesome name="fire" size={16} color="#9CA3AF" />
                <Text className="text-gray-600 dark:text-gray-400 ml-2">
                  {recipe.cook_time}m cook
                </Text>
              </View>
            )}
          </View>

          {recipe.source && (
            <View className="mb-4">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Source: {recipe.source}
              </Text>
            </View>
          )}

          {recipe.tags.length > 0 && (
            <View className="flex-row flex-wrap mb-6">
              {recipe.tags.map((tag, index) => (
                <View
                  key={index}
                  className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full mr-2 mb-2"
                >
                  <Text className="text-sm text-blue-800 dark:text-blue-200">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View className="mb-6">
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Ingredients
            </Text>
            <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              {ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  className="flex-row items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <View className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                  <Text className="text-gray-900 dark:text-white flex-1">
                    {ingredient.quantity} {ingredient.unit} {ingredient.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Instructions
            </Text>
            <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <Text className="text-gray-900 dark:text-white leading-6">
                {recipe.instructions}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
