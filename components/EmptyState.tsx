import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  iconColor?: string;
  iconContainerClass?: string;
}

/**
 * EmptyState Component
 * 
 * Displays a centered icon and message when a list or view has no data.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  message, 
  iconColor = "#E5E7EB",
  iconContainerClass
}) => {
  return (
    <View className="items-center justify-center py-20 px-6">
      <View className={iconContainerClass}>
        <Ionicons 
          name={icon} 
          size={iconContainerClass ? 40 : 64} 
          color={iconColor} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      <Text className="text-gray-400 mt-4 text-center text-lg font-medium">
        {message}
      </Text>
    </View>
  );
};
