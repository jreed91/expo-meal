import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Import the existing screens
import MealPlannerScreen from './index';
import RecipesScreen from './recipes';
import GroceryScreen from './grocery';
import PantryScreen from './pantry';

type FoodSection = 'menu' | 'meals' | 'recipes' | 'grocery' | 'pantry';

export default function FoodManagementScreen() {
  const [currentSection, setCurrentSection] = useState<FoodSection>('menu');

  const menuItems = [
    {
      id: 'meals' as FoodSection,
      title: 'Meal Planner',
      description: 'Plan your weekly meals',
      icon: 'calendar' as const,
      color: 'bg-blue-500',
    },
    {
      id: 'recipes' as FoodSection,
      title: 'Recipes',
      description: 'Browse and manage recipes',
      icon: 'book' as const,
      color: 'bg-green-500',
    },
    {
      id: 'grocery' as FoodSection,
      title: 'Grocery Lists',
      description: 'Create shopping lists',
      icon: 'shopping-cart' as const,
      color: 'bg-orange-500',
    },
    {
      id: 'pantry' as FoodSection,
      title: 'Pantry',
      description: 'Track your ingredients',
      icon: 'archive' as const,
      color: 'bg-purple-500',
    },
  ];

  const renderContent = () => {
    switch (currentSection) {
      case 'meals':
        return <MealPlannerScreen />;
      case 'recipes':
        return <RecipesScreen />;
      case 'grocery':
        return <GroceryScreen />;
      case 'pantry':
        return <PantryScreen />;
      default:
        return null;
    }
  };

  if (currentSection !== 'menu') {
    return (
      <View className="flex-1">
        <View className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <TouchableOpacity
            onPress={() => setCurrentSection('menu')}
            className="flex-row items-center"
          >
            <FontAwesome name="chevron-left" size={20} color="#3B82F6" />
            <Text className="ml-2 text-blue-600 font-semibold">Back to Menu</Text>
          </TouchableOpacity>
        </View>
        {renderContent()}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Food Management
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 mb-6">
          Manage your meals, recipes, groceries, and pantry
        </Text>

        <View className="space-y-4">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 flex-row items-center border border-gray-200 dark:border-gray-700"
              onPress={() => setCurrentSection(item.id)}
            >
              <View
                className={`${item.color} w-14 h-14 rounded-full items-center justify-center mr-4`}
              >
                <FontAwesome name={item.icon} size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <View className="flex-row items-start">
            <FontAwesome name="lightbulb-o" size={20} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Quick Tip
              </Text>
              <Text className="text-sm text-blue-800 dark:text-blue-300">
                Use the Chat tab to ask Claude for recipe suggestions, meal plans, or cooking tips based on your pantry items!
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
