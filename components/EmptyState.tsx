import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
}

/**
 * EmptyState Component
 * 
 * Displays a centered icon and message when a list or view has no data.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, message }) => {
  return (
    <View className="items-center justify-center py-20 px-6">
      <Ionicons name={icon} size={64} color="#E5E7EB" />
      <Text className="text-gray-400 mt-4 text-center text-lg font-medium">
        {message}
      </Text>
    </View>
  );
};
