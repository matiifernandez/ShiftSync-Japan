import React from "react";
import { View, TextInput, TextInputProps, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FormInputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  containerClass?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * FormInput Component
 * 
 * A reusable input field with an optional leading icon and consistent styling.
 * Props are spread to the inner TextInput. 
 * Use containerClass or containerStyle to style the outer wrapper.
 */
export const FormInput: React.FC<FormInputProps> = ({ 
  icon, 
  iconColor = "#9CA3AF",
  containerClass = "bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center",
  containerStyle,
  ...props 
}) => {
  return (
    <View 
      className={containerClass}
      style={containerStyle}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={20} 
          color={iconColor} 
          style={{ marginRight: 12 }} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
      )}
      <TextInput
        className="flex-1 text-brand-dark text-base"
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
};
