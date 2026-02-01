import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from 'expo-haptics';
import { useExpenses } from "../../hooks/useExpenses";
import { useTranslation } from "../../hooks/useTranslation";

const CATEGORIES = [
  { id: "transport", icon: "train" },
  { id: "accommodation", icon: "hotel" },
  { id: "fuel", icon: "gas-pump" },
  { id: "parking", icon: "parking" },
  { id: "meals", icon: "utensils" },
  { id: "other", icon: "receipt" },
];

export default function CreateExpenseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { createExpense } = useExpenses();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("transport");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t('gallery_permission_title'), t('gallery_permission_msg'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('invalid_amount_title'), t('invalid_amount_msg'));
      return;
    }

    if (category === "other" && !description.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('description_required_title'), t('description_required_msg'));
      return;
    }

    setSubmitting(true);
    const success = await createExpense(
      {
        amount: Number(amount),
        category: category as any,
        description,
        paid_by: "employee", // Default for now
        currency: "JPY",
      },
      image || undefined
    );

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
    setSubmitting(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('new_expense'),
          headerBackTitle: t('expenses_title'),
        }}
      />

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* AMOUNT INPUT */}
        <View className="mb-8 items-center">
          <Text className="text-gray-500 mb-2 font-medium">{t('total_amount')} (¥)</Text>
          <View className="flex-row items-center">
            <Text className="text-4xl font-bold text-brand-dark mr-2">¥</Text>
            <TextInput
              className="text-4xl font-bold text-brand-dark min-w-[100px]"
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        {/* CATEGORY SELECTOR */}
        <Text className="text-brand-dark font-bold mb-4">{t('category')}</Text>
        <View className="flex-row flex-wrap gap-3 mb-8">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                category === cat.id
                  ? "border-brand-red bg-red-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <FontAwesome5
                name={cat.icon}
                size={14}
                color={category === cat.id ? "#D9381E" : "#9CA3AF"}
              />
              <Text
                className={`ml-2 font-bold ${
                  category === cat.id ? "text-brand-red" : "text-gray-500"
                }`}
              >
                {t(('cat_' + cat.id) as any)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DESCRIPTION */}
        <View className="mb-8">
          <Text className="text-brand-dark font-bold mb-2">{t('description')}</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-brand-dark"
            placeholder={category === 'other' ? t('required_placeholder') : t('notes_placeholder')}
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* RECEIPT ATTACHMENT */}
        <View className="mb-10">
          <Text className="text-brand-dark font-bold mb-4">{t('receipt')}</Text>
          <TouchableOpacity
            onPress={pickImage}
            className="w-full aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 items-center justify-center overflow-hidden"
          >
            {image ? (
              <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="items-center">
                <Ionicons name="camera" size={40} color="#D1D5DB" />
                <Text className="text-gray-400 mt-2">{t('upload_photo')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={submitting}
          className={`w-full p-4 rounded-2xl items-center mb-10 shadow-lg ${
            submitting ? "bg-gray-400" : "bg-brand-red"
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">{t('submit')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
