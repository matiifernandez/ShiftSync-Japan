import { Stack } from "expo-router";
import { View } from "react-native";

export default function Layout() {
  return (
    // Stack is the navigator for a stack-based navigation (like screens on top of each other)
    <Stack
      screenOptions={{
        headerShown: false, // We hide the default title bar (we want a custom design)
        contentStyle: { backgroundColor: "#FFFFFF" }, // Global white background
      }}
    >
      {/* Here we define the routes.
        "index" refers to app/index.tsx (the Login).
      */}
      <Stack.Screen name="index" />
    </Stack>
  );
}
