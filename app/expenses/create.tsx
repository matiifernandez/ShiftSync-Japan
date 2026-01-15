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
import { useExpenses } from "../../hooks/useExpenses";

const CATEGORIES = [
  { id: "transport", label: "Transport", icon: "train", jp: "交通費" },
  { id: "accommodation", label: "Hotel", icon: "hotel", jp: "宿泊費" },
  { id: "fuel", label: "Fuel", icon: "gas-pump", jp: "ガソリン代" },
  { id: "parking", label: "Parking", icon: "parking", jp: "駐車場" },
  { id: "meals", label: "Meals", icon: "utensils", jp: "食事代" },
  { id: "other", label: "Other", icon: "receipt", jp: "その他" },
];

export default function CreateExpenseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createExpense } = useExpenses();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("transport");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "We need access to your gallery to upload receipts.");
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
      Alert.alert("Invalid Amount", "Please enter a valid numeric amount.");
      return;
    }

    if (category === "other" && !description.trim()) {
      Alert.alert("Description Required", "Please provide a description for 'Other' expenses.");
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
      router.back();
    }
    setSubmitting(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "New Expense",
          headerBackTitle: "Back",
        }}
      />

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* AMOUNT INPUT */}
        <View className="mb-8 items-center">
          <Text className="text-gray-500 mb-2 font-medium">Amount (¥)</Text>
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
        <Text className="text-brand-dark font-bold mb-4">Category / カテゴリー</Text>
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
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DESCRIPTION */}
        <View className="mb-8">
          <Text className="text-brand-dark font-bold mb-2">Description / 備考</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-brand-dark"
            placeholder={category === 'other' ? "Required for 'Other'..." : "Additional notes..."}
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* RECEIPT ATTACHMENT */}
        <View className="mb-10">
          <Text className="text-brand-dark font-bold mb-4">Receipt / レシート</Text>
          <TouchableOpacity
            onPress={pickImage}
            className="w-full aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 items-center justify-center overflow-hidden"
          >
            {image ? (
              <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="items-center">
                <Ionicons name="camera" size={40} color="#D1D5DB" />
                <Text className="text-gray-400 mt-2">Attach Receipt Photo</Text>
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
            <Text className="text-white font-bold text-lg">Submit Expense</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
