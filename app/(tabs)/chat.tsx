import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Mock data for the conversation list
const CONVERSATIONS = [
  {
    id: "general-group",
    name: "General Staff JP/EN",
    lastMessage: "Konnichiwa! The Tottori shift is updated.",
    time: "10:30 AM",
    unread: 3,
    type: "group",
    avatar: null,
  },
  {
    id: "1",
    name: "Kenji Tanaka",
    lastMessage: "Do you have the tickets for the Shinkansen?",
    time: "9:15 AM",
    unread: 0,
    type: "direct",
    avatar: "https://i.pravatar.cc/150?u=kenji",
  },
  {
    id: "2",
    name: "Sarah Jenkins",
    lastMessage: "Perfect, see you at the hotel lobby.",
    time: "Yesterday",
    unread: 0,
    type: "direct",
    avatar: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    id: "logistics-team",
    name: "Logistics Team",
    lastMessage: "Truck is arriving at Tokyo Station now.",
    time: "Yesterday",
    unread: 1,
    type: "group",
    avatar: null,
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const renderChatItem = ({ item }: { item: typeof CONVERSATIONS[0] }) => {
    return (
      <TouchableOpacity
        className="flex-row items-center px-6 py-4 border-b border-gray-50 active:bg-gray-50"
        onPress={() => router.push({
            pathname: "/chat/[id]",
            params: { id: item.id, name: item.name }
        })}
      >
        <View className="relative">
          <View className="w-14 h-14 bg-gray-200 rounded-full items-center justify-center overflow-hidden border border-gray-100">
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} className="w-full h-full" />
            ) : (
              <FontAwesome5
                name={item.type === "group" ? "users" : "user"}
                size={24}
                color="#9CA3AF"
              />
            )}
          </View>
          {item.unread > 0 && (
            <View className="absolute -top-1 -right-1 bg-brand-red w-5 h-5 rounded-full items-center justify-center border-2 border-white">
              <Text className="text-white text-[10px] font-bold">
                {item.unread}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-brand-dark font-bold text-lg" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-gray-400 text-xs">{item.time}</Text>
          </View>
          <Text className="text-gray-500 text-sm" numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" className="ml-2" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop: insets.top }}>
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold text-brand-dark mb-4">Messages</Text>
        <View className="bg-gray-100 flex-row items-center px-4 py-3 rounded-2xl">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-brand-dark text-base"
            placeholder="Search conversations..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <FlatList
        data={CONVERSATIONS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#E5E7EB" />
            <Text className="text-gray-400 mt-4 text-lg">No conversations found</Text>
          </View>
        }
      />
    </View>
  );
}