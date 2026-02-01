import React, { useEffect, useRef } from "react";
import { Text, Animated, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../context/ToastContext";

export default function Toast() {
  const { isVisible, message, type, hideToast } = useToast();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  if (!message && !isVisible) return null;

  const bgColors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-gray-800",
  };

  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    success: "checkmark-circle",
    error: "alert-circle",
    info: "information-circle",
  };

  return (
    <Animated.View
      style={{
        opacity,
        position: "absolute",
        top: insets.top + 10,
        left: 20,
        right: 20,
        zIndex: 9999,
        transform: [
          {
            translateY: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            }),
          },
        ],
      }}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        className={`${bgColors[type]} rounded-2xl p-4 flex-row items-center shadow-lg shadow-black/20`}
        accessibilityRole="alert"
        accessibilityLabel={`${type} notification: ${message}`}
      >
        <Ionicons name={icons[type]} size={24} color="white" />
        <Text className="text-white font-medium ml-3 flex-1 text-base">
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
