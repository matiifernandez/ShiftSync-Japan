import React from "react";
import { View, TextInput, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FormInputProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  accessibilityLabel?: string;
}

/**
 * FormInput Component
 * 
 * A reusable input field with a leading icon and consistent styling.
 */
export const FormInput: React.FC<FormInputProps> = ({ 
  icon, 
  iconColor = "#9CA3AF",
  accessibilityLabel,
  ...props 
}) => {
  return (
    <View 
      className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center"
      accessibilityRole="none"
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={iconColor} 
        style={{ marginRight: 12 }} 
      />
      <TextInput
        className="flex-1 text-brand-dark text-base"
        placeholderTextColor="#9CA3AF"
        accessibilityLabel={accessibilityLabel}
        {...props}
      />
    </View>
  );
};
