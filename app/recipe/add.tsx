import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRecipeStore } from '@/store/recipeStore';
import { RecipeIngredient } from '@/types/database.types';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function AddRecipeScreen() {
  const router = useRouter();
  const { addRecipe } = useRecipeStore();

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [servings, setServings] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [source, setSource] = useState('');
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { name: '', quantity: 0, unit: '' },
  ]);
  const [loading, setLoading] = useState(false);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 0, unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: keyof RecipeIngredient,
    value: string | number
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSave = async () => {
    if (!title.trim() || !instructions.trim()) {
      Alert.alert('Error', 'Please enter at least a title and instructions');
      return;
    }

    const validIngredients = ingredients.filter(
      (ing) => ing.name.trim() && ing.quantity > 0 && ing.unit.trim()
    );

    if (validIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one valid ingredient');
      return;
    }

    try {
      setLoading(true);
      await addRecipe({
        title: title.trim(),
        instructions: instructions.trim(),
        ingredients: validIngredients,
        servings: servings ? parseInt(servings) : null,
        prep_time: prepTime ? parseInt(prepTime) : null,
        cook_time: cookTime ? parseInt(cookTime) : null,
        source: source.trim() || null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
      });

      Alert.alert('Success', 'Recipe added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-cream-100 dark:bg-neutral-900"
    >
      <View className="flex-row items-center justify-between p-4 border-b border-cream-300 dark:border-neutral-800">
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color="#FF7A55" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-neutral-900 dark:text-white">
          Add Recipe
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Title *
          </Text>
          <TextInput
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="Recipe name"
            placeholderTextColor="#A8A29E"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <Text className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
          Ingredients *
        </Text>
        {ingredients.map((ingredient, index) => (
          <View key={index} className="flex-row items-center mb-3">
            <View className="flex-1 mr-2">
              <TextInput
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="Name"
                placeholderTextColor="#A8A29E"
                value={ingredient.name}
                onChangeText={(value) =>
                  updateIngredient(index, 'name', value)
                }
              />
            </View>
            <View className="w-20 mr-2">
              <TextInput
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="Qty"
                placeholderTextColor="#A8A29E"
                value={ingredient.quantity.toString()}
                onChangeText={(value) =>
                  updateIngredient(index, 'quantity', parseFloat(value) || 0)
                }
                keyboardType="numeric"
              />
            </View>
            <View className="w-20 mr-2">
              <TextInput
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="Unit"
                placeholderTextColor="#A8A29E"
                value={ingredient.unit}
                onChangeText={(value) => updateIngredient(index, 'unit', value)}
              />
            </View>
            {ingredients.length > 1 && (
              <TouchableOpacity onPress={() => removeIngredient(index)}>
                <FontAwesome name="trash-o" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          className="bg-gray-200 dark:bg-gray-700 py-2 rounded-lg items-center mb-4"
          onPress={addIngredient}
        >
          <Text className="text-neutral-700 dark:text-neutral-300 font-semibold">
            + Add Ingredient
          </Text>
        </TouchableOpacity>

        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Instructions *
          </Text>
          <TextInput
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="Step-by-step instructions"
            placeholderTextColor="#A8A29E"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={6}
            style={{ textAlignVertical: 'top' }}
          />
        </View>

        <View className="flex-row space-x-3 mb-4">
          <View className="flex-1">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Servings
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              placeholder="4"
              placeholderTextColor="#A8A29E"
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Prep Time (min)
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              placeholder="15"
              placeholderTextColor="#A8A29E"
              value={prepTime}
              onChangeText={setPrepTime}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Cook Time (min)
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              placeholder="30"
              placeholderTextColor="#A8A29E"
              value={cookTime}
              onChangeText={setCookTime}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Source
          </Text>
          <TextInput
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="Website, book, or person"
            placeholderTextColor="#A8A29E"
            value={source}
            onChangeText={setSource}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Tags (comma separated)
          </Text>
          <TextInput
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-cream-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            placeholder="Italian, Pasta, Quick"
            placeholderTextColor="#A8A29E"
            value={tags}
            onChangeText={setTags}
          />
        </View>

        <TouchableOpacity
          className="bg-primary-500 py-4 rounded-lg items-center mb-6"
          onPress={handleSave}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? 'Saving...' : 'Save Recipe'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
