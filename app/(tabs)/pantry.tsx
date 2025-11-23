import React from 'react';
import { View, Text } from 'react-native';

export default function PantryScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
        Pantry
      </Text>
      <Text className="text-gray-600 dark:text-gray-400 mt-2">
        Coming soon
      </Text>
    </View>
  );
}
