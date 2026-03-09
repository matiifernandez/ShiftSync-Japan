import React from "react";
import { View, Text, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  iconColor?: string;
  iconSize?: number;
  iconContainerClass?: string;
  containerClass?: string;
  style?: StyleProp<ViewStyle>;
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
  iconSize = 64,
  iconContainerClass,
  containerClass = "items-center justify-center py-20 px-6",
  style
}) => {
  const iconElement = (
    <Ionicons 
      name={icon} 
      size={iconSize} 
      color={iconColor} 
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    />
  );

  return (
    <View className={containerClass} style={style}>
      {iconContainerClass ? (
        <View className={iconContainerClass}>
          {iconElement}
        </View>
      ) : (
        iconElement
      )}
      <Text className="text-gray-400 mt-4 text-center text-lg font-medium">
        {message}
      </Text>
    </View>
  );
};
