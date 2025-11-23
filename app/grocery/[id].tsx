import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroceryStore } from '@/store/groceryStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function GroceryListDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const {
    groceryLists,
    groceryListItems,
    fetchGroceryListItems,
    addItemToList,
    toggleItemChecked,
    deleteItem,
  } = useGroceryStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');

  const list = groceryLists.find((l) => l.id === id);
  const items = groceryListItems[id as string] || [];

  useEffect(() => {
    if (id) {
      fetchGroceryListItems(id as string);
    }
  }, [id]);

  const handleAddItem = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const quantity = parseFloat(itemQuantity) || 1;

    try {
      await addItemToList(id as string, {
        name: itemName.trim(),
        quantity,
        unit: itemUnit.trim() || 'unit',
        category: null,
        is_checked: false,
      });

      setItemName('');
      setItemQuantity('');
      setItemUnit('');
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item');
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      await toggleItemChecked(id as string, itemId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    Alert.alert('Delete Item', `Remove "${itemName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(id as string, itemId);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const uncheckedItems = items.filter((i) => !i.is_checked);
  const checkedItems = items.filter((i) => i.is_checked);
  const progress =
    items.length > 0 ? (checkedItems.length / items.length) * 100 : 0;

  if (!list) {
    return (
      <View className="flex-1 items-center justify-center bg-cream-100 dark:bg-neutral-900">
        <Text className="text-neutral-600 dark:text-neutral-400">
          List not found
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream-100 dark:bg-neutral-900">
      <View className="p-4 border-b border-cream-300 dark:border-neutral-800">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={24} color="#FF7A55" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <FontAwesome name="plus" size={24} color="#FF7A55" />
          </TouchableOpacity>
        </View>

        <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          {list.name}
        </Text>

        <View className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <View
            className="bg-success-600 rounded-full h-2"
            style={{ width: `${progress}%` }}
          />
        </View>

        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
          {checkedItems.length} of {items.length} items
        </Text>
      </View>

      <ScrollView className="flex-1">
        {uncheckedItems.length > 0 && (
          <View className="p-4">
            <Text className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
              To Buy
            </Text>
            {uncheckedItems.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center bg-cream-50 dark:bg-neutral-800 rounded-lg p-4 mb-2"
              >
                <TouchableOpacity
                  className="mr-3"
                  onPress={() => handleToggleItem(item.id)}
                >
                  <View className="w-6 h-6 border-2 border-gray-400 rounded" />
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="text-neutral-900 dark:text-white font-medium">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    {item.quantity} {item.unit}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteItem(item.id, item.name)}
                >
                  <FontAwesome name="trash-o" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {checkedItems.length > 0 && (
          <View className="p-4">
            <Text className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
              Purchased
            </Text>
            {checkedItems.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center bg-cream-50 dark:bg-neutral-800 rounded-lg p-4 mb-2 opacity-50"
              >
                <TouchableOpacity
                  className="mr-3"
                  onPress={() => handleToggleItem(item.id)}
                >
                  <View className="w-6 h-6 bg-success-600 rounded items-center justify-center">
                    <FontAwesome name="check" size={14} color="white" />
                  </View>
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="text-neutral-900 dark:text-white font-medium line-through">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    {item.quantity} {item.unit}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteItem(item.id, item.name)}
                >
                  <FontAwesome name="trash-o" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {items.length === 0 && (
          <View className="flex-1 items-center justify-center py-12">
            <FontAwesome name="shopping-basket" size={48} color="#9CA3AF" />
            <Text className="text-neutral-600 dark:text-neutral-400 mt-4 text-center">
              No items yet{'\n'}Add items to your grocery list
            </Text>
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
          <View className="bg-cream-100 dark:bg-neutral-900 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                Add Item
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white mb-3"
              placeholder="Item name"
              placeholderTextColor="#A8A29E"
              value={itemName}
              onChangeText={setItemName}
            />

            <View className="flex-row space-x-3 mb-4">
              <TextInput
                className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="Quantity"
                placeholderTextColor="#A8A29E"
                value={itemQuantity}
                onChangeText={setItemQuantity}
                keyboardType="numeric"
              />
              <TextInput
                className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="Unit"
                placeholderTextColor="#A8A29E"
                value={itemUnit}
                onChangeText={setItemUnit}
              />
            </View>

            <TouchableOpacity
              className="bg-primary-500 py-3 rounded-lg items-center"
              onPress={handleAddItem}
            >
              <Text className="text-white font-semibold">Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
