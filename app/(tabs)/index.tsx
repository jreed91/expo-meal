import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRecipeStore } from '@/store/recipeStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Database } from '@/types/database.types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MealPlannerScreen() {
  const {
    fetchMealPlans,
    selectedWeekStart,
    setSelectedWeekStart,
    getWeekDates,
    getMealsForDate,
    addMealPlan,
    deleteMealPlan,
    loading,
  } = useMealPlanStore();

  const { recipes, fetchRecipes } = useRecipeStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');

  useEffect(() => {
    loadData();
  }, [selectedWeekStart]);

  const loadData = async () => {
    const weekDates = getWeekDates();
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    await Promise.all([fetchMealPlans(startDate, endDate), fetchRecipes()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeekStart(newDate);
  };

  const goToToday = () => {
    setSelectedWeekStart(new Date());
  };

  const formatDateHeader = (date: Date) => {
    return `${DAYS[date.getDay()]} ${date.getDate()}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleAddMeal = (date: Date, mealType: MealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setModalVisible(true);
  };

  const handleSelectRecipe = async (recipeId: string) => {
    if (!selectedDate) return;

    try {
      await addMealPlan({
        recipe_id: recipeId,
        meal_type: selectedMealType,
        date: selectedDate.toISOString().split('T')[0],
      });
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add meal');
    }
  };

  const handleDeleteMeal = (mealId: string) => {
    Alert.alert('Delete Meal', 'Remove this meal from your plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMealPlan(mealId);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete meal');
          }
        },
      },
    ]);
  };

  const weekDates = getWeekDates();
  const favoriteRecipes = recipes.filter((r) => r.is_favorite);

  return (
    <View className="flex-1 bg-cream-100 dark:bg-neutral-900">
      <View className="p-4 border-b border-cream-300 dark:border-neutral-800">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={goToPreviousWeek}>
            <FontAwesome name="chevron-left" size={24} color="#FF7A55" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToToday}>
            <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
              Week of{' '}
              {selectedWeekStart.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextWeek}>
            <FontAwesome name="chevron-right" size={24} color="#FF7A55" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {weekDates.map((date, dayIndex) => {
          const meals = getMealsForDate(date);
          return (
            <View key={dayIndex} className="w-72 border-r border-cream-300 dark:border-neutral-800">
              <View
                className={`p-3 border-b border-cream-300 dark:border-neutral-800 ${
                  isToday(date) ? 'bg-blue-100 dark:bg-blue-900' : ''
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    isToday(date)
                      ? 'text-blue-800 dark:text-blue-200'
                      : 'text-neutral-900 dark:text-white'
                  }`}
                >
                  {formatDateHeader(date)}
                </Text>
              </View>

              <ScrollView className="flex-1 p-2">
                {MEAL_TYPES.map((mealType) => {
                  const mealsForType = meals.filter(
                    (m) => m.meal_type === mealType
                  );
                  return (
                    <View key={mealType} className="mb-4">
                      <Text className="text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold mb-2">
                        {mealType}
                      </Text>
                      {mealsForType.length > 0 ? (
                        mealsForType.map((meal) => {
                          const recipe = recipes.find(
                            (r) => r.id === meal.recipe_id
                          );
                          return (
                            <TouchableOpacity
                              key={meal.id}
                              className="bg-cream-50 dark:bg-neutral-800 rounded-lg p-3 mb-2"
                              onLongPress={() => handleDeleteMeal(meal.id)}
                            >
                              <Text className="text-neutral-900 dark:text-white font-medium">
                                {recipe?.title || meal.meal_name || 'Meal'}
                              </Text>
                              {recipe?.is_favorite && (
                                <FontAwesome
                                  name="star"
                                  size={12}
                                  color="#EAB308"
                                  style={{ marginTop: 4 }}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <TouchableOpacity
                          className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-3 items-center border border-dashed border-neutral-300 dark:border-neutral-700"
                          onPress={() => handleAddMeal(date, mealType)}
                        >
                          <FontAwesome name="plus" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-cream-100 dark:bg-neutral-900 rounded-t-3xl p-6 max-h-3/4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                Add {selectedMealType}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {favoriteRecipes.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Favorites
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {favoriteRecipes.map((recipe) => (
                    <TouchableOpacity
                      key={recipe.id}
                      className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-3 mr-2"
                      onPress={() => handleSelectRecipe(recipe.id)}
                    >
                      <FontAwesome name="star" size={16} color="#EAB308" />
                      <Text className="text-neutral-900 dark:text-white font-medium mt-1">
                        {recipe.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              All Recipes
            </Text>
            <ScrollView>
              {recipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  className="bg-cream-50 dark:bg-neutral-800 rounded-lg p-4 mb-2 flex-row justify-between items-center"
                  onPress={() => handleSelectRecipe(recipe.id)}
                >
                  <Text className="text-neutral-900 dark:text-white font-medium flex-1">
                    {recipe.title}
                  </Text>
                  {recipe.is_favorite && (
                    <FontAwesome name="star" size={16} color="#EAB308" />
                  )}
                </TouchableOpacity>
              ))}
              {recipes.length === 0 && (
                <Text className="text-center text-neutral-500 dark:text-neutral-400 py-4">
                  No recipes yet. Add recipes first!
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
