import React from "react";
import { Tabs } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F5F5F5",
          height: 90, // Taller tab bar for modern look
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#D9381E", // Brand Red
        tabBarInactiveTintColor: "#9CA3AF", // Gray
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="travel"
        options={{
          title: "Travel",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="plane" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="calendar" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
