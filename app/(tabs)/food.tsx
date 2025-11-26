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
      color: 'bg-primary-500',
    },
    {
      id: 'recipes' as FoodSection,
      title: 'Recipes',
      description: 'Browse and manage recipes',
      icon: 'book' as const,
      color: 'bg-success-500',
    },
    {
      id: 'grocery' as FoodSection,
      title: 'Grocery Lists',
      description: 'Create shopping lists',
      icon: 'shopping-cart' as const,
      color: 'bg-primary-400',
    },
    {
      id: 'pantry' as FoodSection,
      title: 'Pantry',
      description: 'Track your ingredients',
      icon: 'archive' as const,
      color: 'bg-primary-600',
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
        <View className="bg-cream-100 dark:bg-neutral-900 border-b border-cream-300 dark:border-neutral-800 px-4 py-3">
          <TouchableOpacity
            onPress={() => setCurrentSection('menu')}
            className="flex-row items-center"
          >
            <FontAwesome name="chevron-left" size={20} color="#FF7A55" />
            <Text className="ml-2 text-primary-500 font-semibold">Back to Menu</Text>
          </TouchableOpacity>
        </View>
        {renderContent()}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream-100 dark:bg-neutral-900">
      <View className="p-6">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Food Management
        </Text>
        <Text className="text-neutral-600 dark:text-neutral-400 mb-6">
          Manage your meals, recipes, groceries, and pantry
        </Text>

        <View className="space-y-4">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-cream-50 dark:bg-neutral-800 rounded-xl p-5 flex-row items-center border border-cream-300 dark:border-neutral-700 active:bg-cream-200 dark:active:bg-neutral-700"
              onPress={() => setCurrentSection(item.id)}
            >
              <View
                className={`${item.color} w-14 h-14 rounded-full items-center justify-center mr-4`}
              >
                <FontAwesome name={item.icon} size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                  {item.title}
                </Text>
                <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                  {item.description}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={20} color="#A8A29E" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
          <View className="flex-row items-start">
            <FontAwesome name="lightbulb-o" size={20} color="#FF7A55" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-primary-800 dark:text-primary-200 mb-1">
                Quick Tip
              </Text>
              <Text className="text-sm text-primary-700 dark:text-primary-300">
                Use the Chat tab to ask Claude for recipe suggestions, meal plans, or cooking tips based on your pantry items!
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
