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
import { usePantryStore } from '@/store/pantryStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function PantryScreen() {
  const {
    pantryItems,
    fetchPantryItems,
    addPantryItem,
    deletePantryItem,
    getExpiringItems,
    loading,
  } = usePantryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    fetchPantryItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPantryItems();
    setRefreshing(false);
  };

  const handleAddItem = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const quantity = parseFloat(itemQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      await addPantryItem({
        name: itemName.trim(),
        quantity,
        unit: itemUnit.trim() || 'unit',
        category: itemCategory.trim() || null,
        expiry_date: expiryDate || null,
      });

      setItemName('');
      setItemQuantity('');
      setItemUnit('');
      setItemCategory('');
      setExpiryDate('');
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item');
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert('Delete Item', `Remove "${name}" from pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePantryItem(id);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const expiringItems = getExpiringItems(7);
  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const sevenDays = new Date();
    sevenDays.setDate(today.getDate() + 7);
    return expiry >= today && expiry <= sevenDays;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Pantry
        </Text>

        {expiringItems.length > 0 && (
          <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <View className="flex-row items-center">
              <FontAwesome name="warning" size={16} color="#EAB308" />
              <Text className="text-yellow-800 dark:text-yellow-200 font-semibold ml-2">
                {expiringItems.length} item{expiringItems.length !== 1 ? 's' : ''}{' '}
                expiring soon
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          className="bg-blue-600 py-3 rounded-lg items-center"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white font-semibold">Add Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pantryItems.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <FontAwesome name="archive" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 dark:text-gray-400 mt-4 text-center">
              No items in pantry{'\n'}Add items to track your inventory
            </Text>
          </View>
        ) : (
          <View className="p-4">
            {pantryItems.map((item) => {
              const expired = isExpired(item.expiry_date);
              const expiring = isExpiringSoon(item.expiry_date);

              return (
                <View
                  key={item.id}
                  className={`rounded-lg p-4 mb-3 ${
                    expired
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : expiring
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400">
                        {item.quantity} {item.unit}
                      </Text>
                      {item.category && (
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.category}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id, item.name)}
                    >
                      <FontAwesome name="trash-o" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {item.expiry_date && (
                    <View className="flex-row items-center mt-2">
                      <FontAwesome
                        name="calendar"
                        size={14}
                        color={
                          expired ? '#EF4444' : expiring ? '#EAB308' : '#9CA3AF'
                        }
                      />
                      <Text
                        className={`text-sm ml-2 ${
                          expired
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : expiring
                              ? 'text-yellow-600 dark:text-yellow-400 font-semibold'
                              : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        Expires{' '}
                        {new Date(item.expiry_date).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
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
                Add Pantry Item
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-3"
                placeholder="Item name *"
                placeholderTextColor="#9CA3AF"
                value={itemName}
                onChangeText={setItemName}
              />

              <View className="flex-row space-x-3 mb-3">
                <TextInput
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Quantity *"
                  placeholderTextColor="#9CA3AF"
                  value={itemQuantity}
                  onChangeText={setItemQuantity}
                  keyboardType="numeric"
                />
                <TextInput
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Unit"
                  placeholderTextColor="#9CA3AF"
                  value={itemUnit}
                  onChangeText={setItemUnit}
                />
              </View>

              <TextInput
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-3"
                placeholder="Category (e.g., Dairy, Produce)"
                placeholderTextColor="#9CA3AF"
                value={itemCategory}
                onChangeText={setItemCategory}
              />

              <TextInput
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
                placeholder="Expiry date (YYYY-MM-DD)"
                placeholderTextColor="#9CA3AF"
                value={expiryDate}
                onChangeText={setExpiryDate}
              />

              <TouchableOpacity
                className="bg-blue-600 py-3 rounded-lg items-center"
                onPress={handleAddItem}
              >
                <Text className="text-white font-semibold">Add to Pantry</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
