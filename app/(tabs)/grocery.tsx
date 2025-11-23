import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGroceryStore } from '@/store/groceryStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function GroceryScreen() {
  const router = useRouter();
  const {
    groceryLists,
    fetchGroceryLists,
    createGroceryList,
    deleteGroceryList,
    generateFromMealPlan,
    loading,
  } = useGroceryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [listName, setListName] = useState('');
  const [daysAhead, setDaysAhead] = useState('7');

  useEffect(() => {
    fetchGroceryLists();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroceryLists();
    setRefreshing(false);
  };

  const handleCreateList = async () => {
    if (!listName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    try {
      await createGroceryList(listName.trim());
      setListName('');
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create list');
    }
  };

  const handleGenerateFromMealPlan = async () => {
    const days = parseInt(daysAhead);
    if (isNaN(days) || days < 1) {
      Alert.alert('Error', 'Please enter a valid number of days');
      return;
    }

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      await generateFromMealPlan(
        `Grocery List ${new Date().toLocaleDateString()}`,
        startDate,
        endDate
      );

      setGenerateModalVisible(false);
      Alert.alert('Success', 'Grocery list generated from meal plan!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate list');
    }
  };

  const handleDeleteList = (id: string, name: string) => {
    Alert.alert('Delete List', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroceryList(id);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete list');
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Grocery Lists
        </Text>

        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="flex-1 bg-blue-600 py-3 rounded-lg items-center"
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-white font-semibold">New List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-green-600 py-3 rounded-lg items-center"
            onPress={() => setGenerateModalVisible(true)}
          >
            <Text className="text-white font-semibold">From Meal Plan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {groceryLists.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <FontAwesome name="shopping-cart" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 dark:text-gray-400 mt-4 text-center">
              No grocery lists yet{'\n'}Create one or generate from meal plan!
            </Text>
          </View>
        ) : (
          <View className="p-4">
            {groceryLists.map((list) => (
              <TouchableOpacity
                key={list.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3 flex-row justify-between items-center"
                onPress={() => router.push(`/grocery/${list.id}`)}
              >
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                    {list.name}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Created{' '}
                    {new Date(list.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View className="flex-row items-center space-x-3">
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list.id, list.name);
                    }}
                  >
                    <FontAwesome name="trash-o" size={20} color="#EF4444" />
                  </TouchableOpacity>
                  <FontAwesome name="chevron-right" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                New Grocery List
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
              placeholder="List name"
              placeholderTextColor="#9CA3AF"
              value={listName}
              onChangeText={setListName}
            />

            <TouchableOpacity
              className="bg-blue-600 py-3 rounded-lg items-center"
              onPress={handleCreateList}
            >
              <Text className="text-white font-semibold">Create List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={generateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGenerateModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Generate from Meal Plan
              </Text>
              <TouchableOpacity
                onPress={() => setGenerateModalVisible(false)}
              >
                <FontAwesome name="times" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 dark:text-gray-400 mb-3">
              This will create a grocery list from your upcoming meal plan
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of days ahead
              </Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="7"
                placeholderTextColor="#9CA3AF"
                value={daysAhead}
                onChangeText={setDaysAhead}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              className="bg-green-600 py-3 rounded-lg items-center"
              onPress={handleGenerateFromMealPlan}
            >
              <Text className="text-white font-semibold">Generate List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
