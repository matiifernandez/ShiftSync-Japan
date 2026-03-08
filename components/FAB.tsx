import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

interface FABProps {
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

/**
 * Floating Action Button (FAB)
 * 
 * A circular button positioned absolutely (usually at the bottom right)
 * to perform a primary action on a screen.
 */
export const FAB: React.FC<FABProps> = ({ 
  onPress, 
  iconName = "add", 
  iconSize = 32,
  backgroundColor = Colors.brand.red,
  style
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.fab, 
        { backgroundColor, shadowColor: backgroundColor },
        style
      ]}
      activeOpacity={0.8}
    >
      <Ionicons name={iconName} size={iconSize} color="white" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
