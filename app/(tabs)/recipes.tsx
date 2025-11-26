import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRecipeStore } from '@/store/recipeStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function RecipesScreen() {
  const router = useRouter();
  const {
    fetchRecipes,
    getFilteredRecipes,
    loading,
    searchQuery,
    setSearchQuery,
    favoriteFilter,
    setFavoriteFilter,
    toggleFavorite,
  } = useRecipeStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  };

  const filteredRecipes = getFilteredRecipes();

  return (
    <View className="flex-1 bg-cream-100 dark:bg-neutral-900">
      <View className="p-4 border-b border-cream-300 dark:border-neutral-800">
        <View className="flex-row items-center space-x-2 mb-3">
          <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-neutral-800 rounded-lg px-3 py-2">
            <FontAwesome name="search" size={16} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-neutral-900 dark:text-white"
              placeholder="Search recipes..."
              placeholderTextColor="#A8A29E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            className={`p-2 rounded-lg ${
              favoriteFilter ? 'bg-warning-500' : 'bg-gray-100 dark:bg-neutral-800'
            }`}
            onPress={() => setFavoriteFilter(!favoriteFilter)}
          >
            <FontAwesome name="star" size={20} color={favoriteFilter ? 'white' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-primary-500 py-3 rounded-lg items-center"
          onPress={() => router.push('/recipe/add')}
        >
          <Text className="text-white font-semibold">Add Recipe</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#FF7A55" />
          </View>
        ) : filteredRecipes.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <FontAwesome name="book" size={48} color="#9CA3AF" />
            <Text className="text-neutral-600 dark:text-neutral-400 mt-4 text-center">
              {searchQuery || favoriteFilter
                ? 'No recipes found'
                : 'No recipes yet\nAdd your first recipe to get started!'}
            </Text>
          </View>
        ) : (
          <View className="p-4">
            {filteredRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                className="bg-cream-50 dark:bg-neutral-800 rounded-lg p-4 mb-3"
                onPress={() => router.push(`/recipe/${recipe.id}`)}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-lg font-semibold text-neutral-900 dark:text-white flex-1">
                    {recipe.title}
                  </Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe.id);
                    }}
                  >
                    <FontAwesome
                      name={recipe.is_favorite ? 'star' : 'star-o'}
                      size={20}
                      color={recipe.is_favorite ? '#EAB308' : '#9CA3AF'}
                    />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center space-x-4 mb-2">
                  {recipe.prep_time && (
                    <View className="flex-row items-center">
                      <FontAwesome name="clock-o" size={14} color="#9CA3AF" />
                      <Text className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                        {recipe.prep_time}m prep
                      </Text>
                    </View>
                  )}
                  {recipe.cook_time && (
                    <View className="flex-row items-center">
                      <FontAwesome name="fire" size={14} color="#9CA3AF" />
                      <Text className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                        {recipe.cook_time}m cook
                      </Text>
                    </View>
                  )}
                  {recipe.servings && (
                    <View className="flex-row items-center">
                      <FontAwesome name="users" size={14} color="#9CA3AF" />
                      <Text className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                        {recipe.servings} servings
                      </Text>
                    </View>
                  )}
                </View>

                {recipe.tags.length > 0 && (
                  <View className="flex-row flex-wrap">
                    {recipe.tags.slice(0, 3).map((tag, index) => (
                      <View
                        key={index}
                        className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded mr-2 mb-1"
                      >
                        <Text className="text-xs text-blue-800 dark:text-blue-200">{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
